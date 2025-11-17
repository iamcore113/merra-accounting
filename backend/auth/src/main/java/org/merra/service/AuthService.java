package org.merra.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.merra.config.JwtUtils;
import org.merra.dto.AuthResponse;
import org.merra.dto.JwtTokens;
import org.merra.dto.LoginRequest;
import org.merra.dto.ResendEmailVerification;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.FillPersonalInformation;
import org.merra.dto.TokenRequest;
import org.merra.dto.VerificationResponse;
import org.merra.dto.VerifiedAccountResponse;
import org.merra.entities.UserAccount;
import org.merra.exception.EmailAlreadyEnabledException;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.merra.utils.AuthConstantResponses;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import java.net.URL;

@Service
public class AuthService {
  @Value("${jwt.access.token.duration}")
  private int forAccessToken;
  @Value("${jwt.refresh.token-expiration}")
  private int refreshTokenExpiration;
  @Value("${jwt.email.verification-duration}")
  private int verificationToken;
  @Value("${spring.mail.username}")
  private String emailFrom;
  @Value("${app.frontend.url}")
  private String webUrl;

  private final JavaMailSender mailSender;
  private final UserDetailsService userDetailsService;
  private final JwtUtils jwtUtils;
  private final AuthenticationManager authenticationManager;
  private final PasswordEncoder passwordEncoder;
  private final UserAccountRepository userRepository;
  private final UserAccountService userAccountService;

  public AuthService(
      JavaMailSender mailSender,
      UserDetailsService userDetailsService,
      JwtUtils jwtUtils,
      AuthenticationManager authenticationManager,
      PasswordEncoder passwordEncoder,
      UserAccountRepository userAccountRepository,
      UserAccountService userAccountService) {
    this.mailSender = mailSender;
    this.userDetailsService = userDetailsService;
    this.jwtUtils = jwtUtils;
    this.authenticationManager = authenticationManager;
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userAccountRepository;
    this.userAccountService = userAccountService;
  }

  public VerifiedAccountResponse verifyEmail(@NonNull String tokenParam) {
    var email = jwtUtils.extractUsername(tokenParam);
    Optional<UserAccount> findAccount = userRepository.findUserByEmailIgnoreCase(email);

    if (findAccount.isEmpty() || findAccount.get().getVerificationToken() == null
        || !Objects.equals(findAccount.get().getVerificationToken(), tokenParam)) {
      throw new BadCredentialsException("Token expired.");
    }

    var getUser = findAccount.get();
    getUser.setVerificationToken(null);
    getUser.setIsEnabled(true);
    userRepository.save(getUser);

    return new VerifiedAccountResponse(true, getUser.getUserId(), getUser.getEmail());
  }

  public void sendVerificationEmail(String email, String verToken) {
    final String subject = "Email Verification";
    final String path = "auth/signup/req/verify";
    final String msg = "Click the button below to verify your email address";
    sendEmail(email, verToken, subject, path, msg);

  }

  public void sendForgotPasswordEmail(String email, String resetToken) {
    final String subject = "Password Reset Request";
    final String path = "auth/req/reset-password/";
    final String msg = "Click the button below to reset your password.";
    sendEmail(email, resetToken, subject, path, msg);
  }

  private void sendEmail(String email, String token, String subject, String path, String msg) {
    try {
      UriComponents uriBuilder = UriComponentsBuilder.fromUriString(webUrl)
          .path(path)
          .queryParam("token", token)
          .build();

      final URL actionUrl = uriBuilder.toUri().toURL();
      final String content = """
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:10px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align:center;margin-bottom:20px;align-items:center;">
              <h1 style="margin:0;font-size:24px;color:#0b5cff;">MERRA</h1>
              <p style="margin:5px 0 0 0;font-size:13px;color:#7a8596;">Accounting & Bookkeeping</p>
            </div>

            <h2 style="font-size:20px;color:#111;margin-top:10px;">%s</h2>
            <p style="font-size:15px;color:#555;line-height:1.6;margin:10px 0 20px 0;">
              %s
            </p>

            <div style="text-align:center;margin:25px 0;">
              <a href="%s" style="background-color:#0b5cff;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;display:inline-block;">Verify Email</a>
            </div>

            <p style="font-size:13px;color:#7a8596;line-height:1.5;">
              If the button above doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size:13px;word-break:break-all;color:#0b5cff;margin-top:6px;">
              <a href="%s" style="color:#0b5cff;text-decoration:underline;">%s</a>
            </p>

            <p style="font-size:12px;color:#999;margin-top:16px;">
              This link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.
            </p>

            <hr style="border:none;height:1px;background:#eee;margin:25px 0;">

            <div style="text-align:center;font-size:12px;color:#8c96a6;">
              <p style="margin:0 0 4px 0;">Need help? <a href="mailto:support@merra.example" style="color:#0b5cff;text-decoration:underline;">Contact Support</a></p>
              <p style="margin:0;color:#b3bac6;">MERRA • 123 Business St, Suite 100 • Manila, Philippines</p>
            </div>
          </div>

          <div style="text-align:center;font-size:12px;color:#9aa3b3;margin-top:20px;">
            If you didn’t expect this email, you can ignore it.
          </div>
                          """
          .formatted(subject, msg, actionUrl, actionUrl, actionUrl);

      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

      helper.setTo(email);
      helper.setSubject(subject);
      helper.setFrom(emailFrom);
      helper.setText(content, true);
      mailSender.send(mimeMessage);

    } catch (Exception e) {
      System.err.println("Failed to send email: " + e.getMessage());
    }
  }

  public AuthResponse login(@NonNull LoginRequest request) {
    Authentication authentication;

    try {
      authentication = authenticationManager
          .authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
    } catch (AuthenticationException e) {
      throw new org.springframework.security.authentication.BadCredentialsException(
          AuthConstantResponses.INVALID_CREDENTIALS, e);
    }

    SecurityContextHolder.getContext().setAuthentication(authentication);
    UserAccount getUser = userRepository
        .findUserByEmailIgnoreCase(request.email()).get();

    final String accessToken = jwtUtils.generateToken(getUser, forAccessToken, false);
    final String refreshToken = jwtUtils.generateToken(getUser, refreshTokenExpiration, true);
    List<String> roles = getUser.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

    return new AuthResponse(
        new JwtTokens(accessToken, refreshToken),
        new AuthResponse.UserDetail(getUser.getUserId(), getUser.getEmail()),
        roles);
  }

  public VerificationResponse signup(@NonNull CreateAccountRequest request) {
    Optional<UserAccount> findUserEmail = userRepository.findUserByEmailIgnoreCase(request.email());

    if (findUserEmail.isPresent()) {
      if (findUserEmail.get().isEnabled()) {
        throw new EmailAlreadyEnabledException("Email already exists.");
      } else {
        var user = findUserEmail.get();
        var userTokens = user.getVerificationToken();

        final String resetToken = jwtUtils.generateToken(user, verificationToken, false);
        user.setVerificationToken(userTokens);
        sendVerificationEmail(user.getEmail(), resetToken);
        userRepository.save(user);
        return new VerificationResponse(true, resetToken, user.getUserId(), user.getEmail());
      }
    }
    // throw new EntityExistsException(AuthConstantResponses.EMAIL_EXISTS);
    var encodedPassword = passwordEncoder.encode(request.password());
    UserAccount userBuilder = new UserAccount(request.email(), encodedPassword);

    final String verificationEmailToken = jwtUtils.generateToken(userBuilder, verificationToken, false);
    userBuilder.setVerificationToken(verificationEmailToken);
    sendVerificationEmail(request.email(), verificationEmailToken);
    final UserAccount newUser = userRepository.save(userBuilder);

    /**
     * Once the new user is created,
     * create it's account settings
     */
    userAccountService.createUserAccountSetting(newUser);
    System.out.println("New user created: " + newUser.getEmail());
    return new VerificationResponse(
        false,
        verificationEmailToken,
        newUser.getUserId(),
        newUser.getEmail());
  }

  public VerificationResponse resendEmailVerification(@NonNull ResendEmailVerification request) {
    Optional<UserAccount> findUser = userRepository.findById(request.userId());

    if (findUser.isEmpty()) {
      throw new EntityNotFoundException("User not found.");
    }

    UserAccount user = findUser.get();
    if (user.isEnabled()) {
      throw new EmailAlreadyEnabledException("Email is already verified.");
    }

    final String newVerificationToken = jwtUtils.generateToken(user, verificationToken, false);
    user.setVerificationToken(newVerificationToken);
    userRepository.save(user);
    sendVerificationEmail(user.getEmail(), newVerificationToken);
    return new VerificationResponse(true, newVerificationToken, user.getUserId(), user.getEmail());
  }

  public JwtTokens tokens(@NonNull TokenRequest request) {
    UserDetails userDetails = userDetailsService.loadUserByUsername(request.userEmail());

    final boolean IS_TOKEN_VALID = jwtUtils.isTokenValid(request.refreshToken(), userDetails);
    if (!IS_TOKEN_VALID) {
      throw new org.springframework.security.authentication.BadCredentialsException(
          AuthConstantResponses.INVALID_REFRESH_TOKEN);
    }

    final String accessToken = jwtUtils.generateToken(userDetails, forAccessToken, false);
    final String refreshToken = jwtUtils.generateToken(userDetails, refreshTokenExpiration, true);
    return new JwtTokens(accessToken, refreshToken);
  }

  public void fillPersonalInformation(FillPersonalInformation req, @NonNull UUID id) {
    Optional<UserAccount> findUser = userRepository.findById(id);

    if (findUser.isEmpty()) {
      throw new EntityNotFoundException("User not found.");
    }

    UserAccount user = findUser.get();
    user.setFirstName(req.firstName());
    user.setLastName(req.lastName());
    user.setProfileUrl(req.profile());
    userRepository.save(user);

  }
}
