package org.merra.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Properties;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.merra.config.JwtUtils;
import org.merra.dto.ResetPasswordRequest;
import org.merra.entities.UserAccount;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

class AuthServicePasswordResetTest {

  private static final String RAW_TOKEN = "raw-reset-token";

  private JavaMailSender mailSender;
  private PasswordEncoder passwordEncoder;
  private UserAccountRepository userRepository;
  private AuthService authService;

  @BeforeEach
  @SuppressWarnings("unchecked")
  void setUp() {
    mailSender = mock(JavaMailSender.class);
    passwordEncoder = mock(PasswordEncoder.class);
    userRepository = mock(UserAccountRepository.class);

    authService = new AuthService(
        mock(RedisTemplate.class),
        mailSender,
        mock(UserDetailsService.class),
        new JwtUtils(),
        mock(AuthenticationManager.class),
        passwordEncoder,
        userRepository,
        mock(UserAccountService.class),
        mock(TokenBlacklistService.class));

    ReflectionTestUtils.setField(authService, "emailFrom", "no-reply@merra.example");
    ReflectionTestUtils.setField(authService, "webUrl", "http://localhost:4200/");
    ReflectionTestUtils.setField(authService, "passwordResetTokenMinutes", 60L);
    ReflectionTestUtils.setField(authService, "passwordResetCooldownDays", 14L);

    when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
    when(userRepository.save(any(UserAccount.class))).thenAnswer(inv -> inv.getArgument(0));
  }

  private static String sha256(String value) throws Exception {
    return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
  }

  private UserAccount enabledUser() {
    UserAccount user = new UserAccount("jane@merra.example", "encoded-old");
    user.setIsEnabled(true);
    when(userRepository.findUserByEmailIgnoreCase("jane@merra.example")).thenReturn(Optional.of(user));
    return user;
  }

  private UserAccount userWithOutstandingToken() throws Exception {
    UserAccount user = new UserAccount("jane@merra.example", "encoded-old");
    user.setIsEnabled(true);
    user.setPasswordResetTokenHash(sha256(RAW_TOKEN));
    user.setPasswordResetExpiresAt(OffsetDateTime.now().plusMinutes(30));
    when(userRepository.findByPasswordResetTokenHash(sha256(RAW_TOKEN))).thenReturn(Optional.of(user));
    return user;
  }

  @Test
  void requestPasswordReset_storesHashedTokenAndSendsEmail() {
    UserAccount user = enabledUser();

    authService.requestPasswordReset(" jane@merra.example ");

    ArgumentCaptor<UserAccount> saved = ArgumentCaptor.forClass(UserAccount.class);
    verify(userRepository).save(saved.capture());
    assertNotNull(saved.getValue().getPasswordResetTokenHash());
    assertEquals(64, saved.getValue().getPasswordResetTokenHash().length());
    assertTrue(user.getPasswordResetExpiresAt().isAfter(OffsetDateTime.now()));
    verify(mailSender).send(any(MimeMessage.class));
  }

  @Test
  void requestPasswordReset_unknownEmail_doesNothing() {
    when(userRepository.findUserByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

    authService.requestPasswordReset("nobody@merra.example");

    verify(userRepository, never()).save(any());
    verify(mailSender, never()).send(any(MimeMessage.class));
  }

  @Test
  void requestPasswordReset_withinFourteenDays_issuesNoToken() {
    UserAccount user = enabledUser();
    user.setPasswordResetAt(OffsetDateTime.now().minusDays(5));

    authService.requestPasswordReset("jane@merra.example");

    assertNull(user.getPasswordResetTokenHash());
    verify(userRepository, never()).save(any());
    // informational email only
    verify(mailSender).send(any(MimeMessage.class));
  }

  @Test
  void requestPasswordReset_afterFourteenDays_issuesToken() {
    UserAccount user = enabledUser();
    user.setPasswordResetAt(OffsetDateTime.now().minusDays(15));

    authService.requestPasswordReset("jane@merra.example");

    assertNotNull(user.getPasswordResetTokenHash());
  }

  @Test
  void resetPassword_success_updatesPasswordAndConsumesToken() throws Exception {
    UserAccount user = userWithOutstandingToken();
    when(passwordEncoder.matches("NewPassw0rd!", "encoded-old")).thenReturn(false);
    when(passwordEncoder.encode("NewPassw0rd!")).thenReturn("encoded-new");

    authService.resetPassword(new ResetPasswordRequest(RAW_TOKEN, "NewPassw0rd!", "NewPassw0rd!"));

    assertEquals("encoded-new", user.getAccountPassword());
    assertNull(user.getPasswordResetTokenHash());
    assertNull(user.getPasswordResetExpiresAt());
    assertNotNull(user.getPasswordResetAt());
  }

  @Test
  void tokenStatus_distinguishesValidExpiredAndUnknown() throws Exception {
    UserAccount user = userWithOutstandingToken();
    when(userRepository.findByPasswordResetTokenHash(sha256("unknown"))).thenReturn(Optional.empty());

    assertTrue(authService.getPasswordResetTokenStatus(RAW_TOKEN).valid());

    user.setPasswordResetExpiresAt(OffsetDateTime.now().minusMinutes(1));
    var expired = authService.getPasswordResetTokenStatus(RAW_TOKEN);
    assertFalse(expired.valid());
    assertTrue(expired.expired());

    var unknown = authService.getPasswordResetTokenStatus("unknown");
    assertFalse(unknown.valid());
    assertFalse(unknown.expired());
  }

  @Test
  void requestPasswordReset_tokenLivesForConfiguredDuration() {
    ReflectionTestUtils.setField(authService, "passwordResetTokenMinutes", 1440L);
    UserAccount user = enabledUser();

    authService.requestPasswordReset("jane@merra.example");

    OffsetDateTime expiry = user.getPasswordResetExpiresAt();
    assertTrue(expiry.isAfter(OffsetDateTime.now().plusHours(23)));
    assertTrue(expiry.isBefore(OffsetDateTime.now().plusHours(25)));
  }

  @Test
  void resetPassword_mismatchedPasswords_rejected() {
    assertThrows(IllegalArgumentException.class,
        () -> authService.resetPassword(new ResetPasswordRequest(RAW_TOKEN, "NewPassw0rd!", "Different123")));
  }

  @Test
  void resetPassword_unknownToken_rejected() throws Exception {
    when(userRepository.findByPasswordResetTokenHash(sha256("bad"))).thenReturn(Optional.empty());

    assertThrows(BadCredentialsException.class,
        () -> authService.resetPassword(new ResetPasswordRequest("bad", "NewPassw0rd!", "NewPassw0rd!")));
  }

  @Test
  void resetPassword_expiredToken_rejected() throws Exception {
    UserAccount user = userWithOutstandingToken();
    user.setPasswordResetExpiresAt(OffsetDateTime.now().minusMinutes(1));

    assertThrows(BadCredentialsException.class,
        () -> authService.resetPassword(new ResetPasswordRequest(RAW_TOKEN, "NewPassw0rd!", "NewPassw0rd!")));
    assertFalse(authService.isPasswordResetTokenValid(RAW_TOKEN));
  }

  @Test
  void resetPassword_withinFourteenDays_rejected() throws Exception {
    UserAccount user = userWithOutstandingToken();
    user.setPasswordResetAt(OffsetDateTime.now().minusDays(3));

    assertThrows(IllegalArgumentException.class,
        () -> authService.resetPassword(new ResetPasswordRequest(RAW_TOKEN, "NewPassw0rd!", "NewPassw0rd!")));
    verify(userRepository, never()).save(any());
  }

  @Test
  void resetPassword_sameAsCurrent_rejected() throws Exception {
    userWithOutstandingToken();
    when(passwordEncoder.matches("SamePassw0rd!", "encoded-old")).thenReturn(true);

    assertThrows(IllegalArgumentException.class,
        () -> authService.resetPassword(new ResetPasswordRequest(RAW_TOKEN, "SamePassw0rd!", "SamePassw0rd!")));
  }
}
