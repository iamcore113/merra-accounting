package org.merra.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.merra.config.JwtUtils;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.VerifiedAccountResponse;
import org.merra.dto.VerifyPinRequest;
import org.merra.entities.UserAccount;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

class AuthServicePinVerificationTest {

  private static final String TEST_SECRET = "dGVzdC1zZWNyZXQta2V5LWZvci1tZXJyYS1hY2NvdW50aW5nLWF1dGgtdGVzdHMtMjU2Yml0cw==";

  private JwtUtils jwtUtils;
  private JavaMailSender mailSender;
  private UserDetailsService userDetailsService;
  private PasswordEncoder passwordEncoder;
  private UserAccountRepository userRepository;
  private UserAccountService userAccountService;
  private AuthService authService;

  @BeforeEach
  @SuppressWarnings("unchecked")
  void setUp() {
    jwtUtils = new JwtUtils();
    ReflectionTestUtils.setField(jwtUtils, "jwtSecret", TEST_SECRET);

    RedisTemplate<String, Object> redisTemplate = mock(RedisTemplate.class);
    mailSender = mock(JavaMailSender.class);
    userDetailsService = mock(UserDetailsService.class);
    AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    passwordEncoder = mock(PasswordEncoder.class);
    userRepository = mock(UserAccountRepository.class);
    userAccountService = mock(UserAccountService.class);
    TokenBlacklistService tokenBlacklistService = mock(TokenBlacklistService.class);

    authService = new AuthService(
        redisTemplate,
        mailSender,
        userDetailsService,
        jwtUtils,
        authenticationManager,
        passwordEncoder,
        userRepository,
        userAccountService,
        tokenBlacklistService);

    ReflectionTestUtils.setField(authService, "forAccessToken", 3600000L);
    ReflectionTestUtils.setField(authService, "refreshTokenExpiration", 7L);
    ReflectionTestUtils.setField(authService, "verificationTokenDuration", AuthService.PIN_VERIFICATION_DURATION_MS);
    ReflectionTestUtils.setField(authService, "emailFrom", "no-reply@merra.example");
    ReflectionTestUtils.setField(authService, "webUrl", "http://localhost:4200");
  }

  @Test
  void generatePinCode_returnsFourDigits() {
    for (int i = 0; i < 50; i++) {
      String pin = authService.generatePinCode();
      assertNotNull(pin);
      assertTrue(pin.matches("^\\d{4}$"), "Expected 4-digit PIN but got: " + pin);
    }
  }

  @Test
  void verifyAccountPin_activatesAccountWhenPinIsValidAndWithin24Hours() {
    String email = "user@merra.example";
    String pin = "4829";
    String verificationToken = authService.generatePinVerificationToken(email, pin);

    UserAccount account = new UserAccount(email, "hashed-pwd");
    UUID userId = UUID.randomUUID();
    ReflectionTestUtils.setField(account, "userId", userId);
    account.setVerificationToken(verificationToken);
    account.setIsEnabled(false);

    when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.of(account));
    when(userDetailsService.loadUserByUsername(email)).thenReturn(account);

    VerifiedAccountResponse response = authService.verifyAccountPin(new VerifyPinRequest(email, pin));

    assertTrue(response.isVerified());
    assertEquals(email, response.email());
    assertEquals(userId, response.userId());
    assertNotNull(response.accessToken());
    assertTrue(account.isEnabled());
    assertNull(account.getVerificationToken());
    verify(userRepository).save(account);
  }

  @Test
  void verifyAccountPin_throwsWhenPinDoesNotMatch() {
    String email = "user@merra.example";
    String verificationToken = authService.generatePinVerificationToken(email, "4829");

    UserAccount account = new UserAccount(email, "hashed-pwd");
    account.setVerificationToken(verificationToken);
    account.setIsEnabled(false);

    when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.of(account));

    BadCredentialsException ex = assertThrows(
        BadCredentialsException.class,
        () -> authService.verifyAccountPin(new VerifyPinRequest(email, "9999")));
    assertTrue(ex.getMessage().contains("Invalid PIN code"));
  }

  @Test
  void verifyAccountPin_throwsWhenPinIsExpiredAfter24Hours() {
    String email = "user@merra.example";
    String pin = "1234";
    // Generate an already-expired token (-1000ms)
    String expiredToken = jwtUtils.generateToken(email, Map.of("pin", pin), -1000L, false);

    UserAccount account = new UserAccount(email, "hashed-pwd");
    account.setVerificationToken(expiredToken);
    account.setIsEnabled(false);

    when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.of(account));

    BadCredentialsException ex = assertThrows(
        BadCredentialsException.class,
        () -> authService.verifyAccountPin(new VerifyPinRequest(email, pin)));
    assertTrue(ex.getMessage().toLowerCase().contains("expired"));
  }

  @Test
  void signup_sendsStyledEmailWithFourDigitPin() throws Exception {
    String email = "newuser@merra.example";
    MimeMessage mimeMessage = new MimeMessage(Session.getDefaultInstance(new Properties()));
    when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.empty());
    when(passwordEncoder.encode(any())).thenReturn("encoded-password");
    when(userRepository.save(any(UserAccount.class))).thenAnswer(inv -> {
      UserAccount saved = inv.getArgument(0);
      ReflectionTestUtils.setField(saved, "userId", UUID.randomUUID());
      return saved;
    });

    var res = authService.signup(new CreateAccountRequest(email, "male", "StrongPass1!"));
    assertNotNull(res);
    verify(mailSender).send(mimeMessage);

    String storedToken = res.verificationToken().token();
    String embeddedPin = jwtUtils.extractClaim(storedToken, claims -> claims.get("pin", String.class));
    assertNotNull(embeddedPin);
    assertTrue(embeddedPin.matches("^\\d{4}$"));

    MimeMultipart multipart = (MimeMultipart) mimeMessage.getContent();
    MimeMultipart related = (MimeMultipart) multipart.getBodyPart(0).getContent();
    String htmlBody = (String) related.getBodyPart(0).getContent();

    assertTrue(htmlBody.contains(embeddedPin), "Email HTML should display the 4-digit PIN");
    assertTrue(htmlBody.contains("#689D4B"), "Email HTML should use frontend primary green #689D4B");
    assertTrue(htmlBody.contains("border-radius:0"), "Email HTML should match sharp 0px border-radius style");
    assertTrue(htmlBody.contains("24 hours"), "Email HTML should state 24 hours expiration");
    assertFalse(htmlBody.contains("Go to Activation Page"), "Email HTML should not contain an activation link button");
    assertFalse(htmlBody.contains("account/verify"), "Email HTML should not contain an activation page URL");
  }
}
