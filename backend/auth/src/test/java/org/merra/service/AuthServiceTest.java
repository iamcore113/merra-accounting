package org.merra.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.merra.config.JwtUtils;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.VerificationResponse;
import org.merra.entities.UserAccount;
import org.merra.enums.UserAccountStatusEn;
import org.merra.exception.EmailAlreadyEnabledException;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserAccountRepository userRepository;

    @Mock
    private UserAccountService userAccountService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        // Set required @Value fields using ReflectionTestUtils
        ReflectionTestUtils.setField(authService, "verificationTokenDuration", 3600);
        ReflectionTestUtils.setField(authService, "emailFrom", "test@merra.org");
        ReflectionTestUtils.setField(authService, "webUrl", "http://localhost:4200");
    }

    @Test
    void signup_WhenUserAlreadyEnabled_ThrowsEmailAlreadyEnabledException() {
        // Arrange
        String email = "test@example.com";
        CreateAccountRequest request = new CreateAccountRequest(email, "male", "password123");

        UserAccount existingUser = new UserAccount(email, "encodedPassword");
        existingUser.setIsEnabled(true);

        when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.of(existingUser));

        // Act & Assert
        assertThrows(EmailAlreadyEnabledException.class, () -> authService.signup(request));
        verify(userRepository).findUserByEmailIgnoreCase(email);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void signup_WhenUserExistsButNotEnabled_ResendsVerificationEmail() {
        // Arrange
        String email = "test@example.com";
        String gender = "male";
        String existingToken = "existing-token";
        String newToken = "new-verification-token";
        UUID userId = UUID.randomUUID();

        CreateAccountRequest request = new CreateAccountRequest(email, gender, "password123");

        UserAccount existingUser = new UserAccount(email, "encodedPassword");
        existingUser.setIsEnabled(false);
        existingUser.setVerificationToken(existingToken);

        MimeMessage mimeMessage = mock(MimeMessage.class);

        when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.of(existingUser));
        when(jwtUtils.generateToken(anyString(), any(), anyInt(), anyBoolean())).thenReturn(newToken);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        VerificationResponse response = authService.signup(request);

        // Assert
        assertNotNull(response);
        assertTrue(response.resent());
        assertEquals(newToken, response.verificationToken().token());
        assertEquals(userId, response.userDetail().userId());
        assertEquals(email, response.userDetail().email());

        verify(userRepository).findUserByEmailIgnoreCase(email);
        verify(jwtUtils).generateToken(email, Map.of("role", "IDLE"), 3600, false);
        verify(userRepository).save(existingUser);
        verify(mailSender).createMimeMessage();
    }

    @Test
    void signup_WhenNewUser_CreatesAccountAndSendsVerification() {
        // Arrange
        String email = "devneil113@gmail.com";
        String gender = "male";
        String password = "HAHA1234wow";
        String verificationToken = UUID.randomUUID().toString();
        UUID userId = UUID.randomUUID();

        CreateAccountRequest request = new CreateAccountRequest(email, gender, password);

        UserAccount newUser = new UserAccount(email, "encodedPassword");
        newUser.setGender(gender);
        newUser.setVerificationToken(verificationToken);

        MimeMessage mimeMessage = mock(MimeMessage.class);

        when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(password)).thenReturn("encodedPassword");
        when(jwtUtils.generateToken(anyString(), any(), anyInt(), anyBoolean())).thenReturn(verificationToken);
        when(userRepository.save(any(UserAccount.class))).thenReturn(newUser);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        VerificationResponse response = authService.signup(request);

        // Assert
        assertNotNull(response);
        assertFalse(response.resent());
        assertEquals(verificationToken, response.verificationToken().token());
        assertEquals(userId, response.userDetail().userId());
        assertEquals(email, response.userDetail().email());

        verify(userRepository).findUserByEmailIgnoreCase(email);
        verify(passwordEncoder).encode(password);
        verify(jwtUtils).generateToken(email, Map.of("role", "IDLE"), 3600, false);
        verify(userRepository).save(any(UserAccount.class));
        verify(userAccountService).createUserAccountSetting(any(UserAccount.class));
        verify(mailSender).createMimeMessage();
    }

    @Test
    void signup_WhenNewUser_SetsCorrectGender() {
        // Arrange
        String email = "user@example.com";
        String gender = "other";
        String password = "securepass";
        String verificationToken = "token-xyz";
        UUID userId = UUID.randomUUID();

        CreateAccountRequest request = new CreateAccountRequest(email, gender, password);

        UserAccount savedUser = new UserAccount(email, "encodedPassword");
        savedUser.setGender(gender);
        savedUser.setVerificationToken(verificationToken);

        MimeMessage mimeMessage = mock(MimeMessage.class);

        when(userRepository.findUserByEmailIgnoreCase(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(password)).thenReturn("encodedPassword");
        when(jwtUtils.generateToken(anyString(), any(), anyInt(), anyBoolean())).thenReturn(verificationToken);
        when(userRepository.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount user = invocation.getArgument(0);
            assertEquals(gender, user.getGender());
            user.setVerificationToken(verificationToken);
            return user;
        });
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        authService.signup(request);

        // Assert
        verify(userRepository).save(any(UserAccount.class));
    }
}
