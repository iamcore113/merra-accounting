package org.merra.service;

import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.merra.config.JwtUtils;
import org.merra.dto.SigninResponse;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.EmailVerificationStatusResponse;
import org.merra.dto.FillPersonalInformation;
import org.merra.dto.JwtTokens;
import org.merra.dto.LoginRequest;
import org.merra.dto.ResendEmailVerification;
import org.merra.dto.PasswordResetTokenStatusResponse;
import org.merra.dto.ResetPasswordRequest;
import org.merra.dto.VerificationResponse;
import org.merra.dto.VerifiedAccountResponse;
import org.merra.dto.VerifyPinRequest;
import org.merra.dto.VisitorAccessToken;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.merra.entities.UserAccount;
import org.merra.enums.UserAccountStatusEn;
import org.merra.exception.EmailAlreadyEnabledException;
import org.merra.multitenancy.UserWorkspaceManager;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.merra.utilities.RedisKeys;
import org.merra.utilities.SecurityUtils;
import org.merra.utils.AuthConstantResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.util.InvalidUrlException;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;

@Service
@Validated
public class AuthService {
  private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

  @Value("${token.access-token-duration}")
  private long forAccessToken;
  @Value("${token.refresh-token-duration}")
  private long refreshTokenExpiration;
  @Value("${token.email-verification-duration}")
  private long verificationTokenDuration;
  @Value("${spring.mail.username}")
  private String emailFrom;
  @Value("${app.frontend.url}")
  private String webUrl;
  @Value("${app.password-reset.token-minutes:1440}")
  private long passwordResetTokenMinutes;
  @Value("${app.password-reset.cooldown-days:14}")
  private long passwordResetCooldownDays;

  private final static String ROLE_ADVISOR = UserAccountStatusEn.ADVISOR.toString();
  private final static String ROLE_VISITOR = UserAccountStatusEn.VISITOR.toString();
  private final static String ROLE_STANDARD = UserAccountStatusEn.STANDARD.toString();
  private final static String ROLE_READ_ONLY = UserAccountStatusEn.READ_ONLY.toString();
  private final static String ROLE_INVOICE_ONLY = UserAccountStatusEn.INVOICE_ONLY.toString();
  private final static String ROLE_IDLE = UserAccountStatusEn.IDLE.toString();

  /** 24 hours duration (in milliseconds) for the 4-digit activation PIN code. */
  public static final long PIN_VERIFICATION_DURATION_MS = 24L * 60 * 60 * 1000L;
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final RedisTemplate<String, Object> redisTemplate;
  private final JavaMailSender mailSender;
  private final UserDetailsService userDetailsService;
  private final JwtUtils jwtUtils;
  private final AuthenticationManager authenticationManager;
  private final PasswordEncoder passwordEncoder;
  private final UserAccountRepository userRepository;
  private final UserAccountService userAccountService;
  private final TokenBlacklistService tokenBlacklistService;
  private final UserWorkspaceManager userWorkspaceManager;

  public AuthService(
      RedisTemplate<String, Object> redisTemplate,
      JavaMailSender mailSender,
      UserDetailsService userDetailsService,
      JwtUtils jwtUtils,
      AuthenticationManager authenticationManager,
      PasswordEncoder passwordEncoder,
      UserAccountRepository userAccountRepository,
      UserAccountService userAccountService,
      TokenBlacklistService tokenBlacklistService) {
    this(redisTemplate, mailSender, userDetailsService, jwtUtils, authenticationManager,
        passwordEncoder, userAccountRepository, userAccountService, tokenBlacklistService, null);
  }

  @Autowired
  public AuthService(
      RedisTemplate<String, Object> redisTemplate,
      JavaMailSender mailSender,
      UserDetailsService userDetailsService,
      JwtUtils jwtUtils,
      AuthenticationManager authenticationManager,
      PasswordEncoder passwordEncoder,
      UserAccountRepository userAccountRepository,
      UserAccountService userAccountService,
      TokenBlacklistService tokenBlacklistService,
      @Autowired(required = false) UserWorkspaceManager userWorkspaceManager) {
    this.redisTemplate = redisTemplate;
    this.mailSender = mailSender;
    this.userDetailsService = userDetailsService;
    this.jwtUtils = jwtUtils;
    this.authenticationManager = authenticationManager;
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userAccountRepository;
    this.userAccountService = userAccountService;
    this.tokenBlacklistService = tokenBlacklistService;
    this.userWorkspaceManager = userWorkspaceManager;
  }

  public VisitorAccessToken generateVisitorAccessToken() {
    // TODO: Implement visitor access token generation
    return new VisitorAccessToken("visitor-token");
  }

  /**
   * Generates a random 4-digit numeric PIN code (e.g. "0482").
   */
  public String generatePinCode() {
    return String.format("%04d", SECURE_RANDOM.nextInt(10000));
  }

  /**
   * Generates a signed JWT containing the 4-digit PIN code with a 24-hour
   * expiration duration.
   */
  public String generatePinVerificationToken(String email, String pinCode) {
    return jwtUtils.generateToken(
        email,
        Map.of("pin", pinCode, "role", ROLE_IDLE),
        PIN_VERIFICATION_DURATION_MS,
        false);
  }

  /**
   * Verifies the 4-digit PIN code submitted by the user, checks the 24-hour
   * expiration window, enables the user account, assigns the default role, and
   * issues a limited-access JWT token.
   *
   * @param request The VerifyPinRequest containing the user's email and 4-digit PIN
   * @return VerifiedAccountResponse containing verification status, user ID,
   *         email, and a limited-access token
   * @throws BadCredentialsException     if the PIN is invalid or expired
   * @throws EntityNotFoundException     if the user account does not exist
   * @throws EmailAlreadyEnabledException if the account is already enabled
   */
  public VerifiedAccountResponse verifyAccountPin(@NotNull VerifyPinRequest request) {
    if (request.email() == null || request.email().isBlank()) {
      throw new BadCredentialsException("Email is required.");
    }
    if (request.pin() == null || !request.pin().trim().matches("^\\d{4}$")) {
      throw new BadCredentialsException("PIN code must be a 4-digit number.");
    }

    final String email = request.email().trim();
    final String submittedPin = request.pin().trim();

    UserAccount findAccount = userRepository.findUserByEmailIgnoreCase(email)
        .orElseThrow(() -> new EntityNotFoundException("User account not found."));

    if (findAccount.isEnabled()) {
      throw new EmailAlreadyEnabledException("Account is already activated.");
    }

    final String accountVerificationToken = findAccount.getVerificationToken();
    if (accountVerificationToken == null || accountVerificationToken.isBlank()) {
      throw new BadCredentialsException("No active PIN code found for this account. Please request a new PIN.");
    }

    final String storedPin;
    try {
      storedPin = jwtUtils.extractClaim(accountVerificationToken, claims -> claims.get("pin", String.class));
    } catch (ExpiredJwtException e) {
      throw new BadCredentialsException("PIN code has expired. Please request a new PIN code.");
    } catch (JwtException | IllegalArgumentException e) {
      throw new BadCredentialsException("Invalid or expired PIN code.");
    }

    if (storedPin == null || !Objects.equals(storedPin, submittedPin)) {
      throw new BadCredentialsException("Invalid PIN code. Please check the code and try again.");
    }

    return activateUserAccount(findAccount);
  }

  /**
   * Verifies the provided account verification token, enables the user account,
   * assigns the default role, and issues a limited access JWT token.
   *
   * @param tokenParam The verification token received from the verification link
   * @return VerifiedAccountResponse containing verification status, user ID,
   *         email, and a limited-access token
   * @throws BadCredentialsException if the token is invalid or does not match the
   *                                 stored token
   * @throws EntityNotFoundException if the user account does not exist
   */
  public VerifiedAccountResponse verifyAccountToken(@NotNull String tokenParam) {
    final String email;
    try {
      email = jwtUtils.extractUsername(tokenParam);
    } catch (ExpiredJwtException e) {
      throw new BadCredentialsException("Verification token has expired.");
    } catch (JwtException | IllegalArgumentException e) {
      throw new BadCredentialsException("Invalid token.");
    }

    if (email == null) {
      throw new BadCredentialsException("Token email not found.");
    }
    // Retrieve the user account by email
    UserAccount findAccount = userRepository.findUserByEmailIgnoreCase(email)
        .orElseThrow(() -> new EntityNotFoundException("User account not found."));
    final String accountVerificationToken = findAccount.getVerificationToken();

    if (accountVerificationToken == null) {
      throw new BadCredentialsException("No verification token found for this account.");
    }

    // Validate the provided token against the stored verification token
    if (!Objects.equals(accountVerificationToken, tokenParam)) {
      throw new BadCredentialsException("Invalid token.");
    }

    return activateUserAccount(findAccount);
  }

  private VerifiedAccountResponse activateUserAccount(UserAccount findAccount) {
    String existingRole = findAccount.getRoles();
    boolean hasOrganizationRole = findAccount.isPartOfOrganization()
        && existingRole != null
        && !existingRole.isBlank()
        && !existingRole.toUpperCase().contains(ROLE_IDLE);
    String assignedRole = hasOrganizationRole
        ? existingRole.replace("ROLE_", "")
        : ROLE_IDLE;

    // Enable the account, clear the verification token, and preserve organization role if already joined
    findAccount.setVerificationToken(null);
    findAccount.setIsEnabled(true);
    findAccount.setRoles(assignedRole);
    userRepository.save(findAccount);

    try {
      if (redisTemplate != null) {
        redisTemplate.delete(RedisKeys.PRINCIPAL);
      }
    } catch (Exception e) {
      logger.warn("Failed to evict principal cache after account activation: {}", e.getMessage());
    }

    final String getAccountEmail = findAccount.getEmail();
    final UUID getUserId = findAccount.getUserId();

    // Generate an access JWT token.
    final String generateAccessToken = jwtUtils.generateToken(getAccountEmail, Map.of("role", assignedRole),
        forAccessToken,
        false);

    UserDetails userDetails = userDetailsService.loadUserByUsername(getAccountEmail);
    Authentication auth = new UsernamePasswordAuthenticationToken(
        userDetails,
        null, // No password needed here!
        userDetails.getAuthorities());

    // Set the authenticated user in the security context
    SecurityContextHolder.getContext().setAuthentication(auth);

    return new VerifiedAccountResponse(true, getUserId, getAccountEmail, generateAccessToken);
  }

  /**
   * Sends a verification email to the specified user with a 4-digit activation PIN code.
   *
   * @param email   The recipient's email address
   * @param pinCode The 4-digit PIN code to include in the email
   */
  public void sendVerificationEmail(String email, String pinCode) {
    final String subject = "Enter PIN Code to Activate Your Account";
    final String msg = "Enter the 4-digit PIN code below on the account activation page to activate your account.";
    sendEmail(email, pinCode, subject, null, msg);
  }

  /**
   * Sends a password reset email to the specified user with a reset token link.
   *
   * @param email      The recipient's email address
   * @param resetToken The password reset token to include in the email link
   */
  public void sendForgotPasswordEmail(String email, String resetToken) {
    final String subject = "Password Reset Request";
    final String path = "account/reset-password";
    final String msg = "We received a request to reset your MERRA password. Click the button below to choose a new one.";
    final String validFor = passwordResetTokenMinutes % 60 == 0
        ? (passwordResetTokenMinutes / 60) + (passwordResetTokenMinutes == 60 ? " hour" : " hours")
        : passwordResetTokenMinutes + " minutes";
    final String note = "This link is valid for <strong style=\"color:#374151;\">" + validFor
        + "</strong> and can only be used once. If you didn't request a password reset, you can safely ignore this email.";
    sendEmail(email, resetToken, subject, path, msg, note, "Reset Password");
  }

  /**
   * Sends an informational email when a password reset was requested before the
   * restriction window elapsed.
   */
  private void sendPasswordResetCooldownEmail(String email, OffsetDateTime nextAllowedAt) {
    final String subject = "Password Reset Unavailable";
    final String msg = "A password reset was requested for your account, but your password was already reset recently. "
        + "For your security, passwords can only be reset once every " + passwordResetCooldownDays + " days.";
    final String note = "You can request another reset on or after <strong style=\"color:#374151;\">"
        + nextAllowedAt.format(DateTimeFormatter.ofPattern("MMMM d, yyyy")) + "</strong>. "
        + "If this wasn't you, please contact support.";
    sendEmail(email, null, subject, null, msg, note, null);
  }

  private void sendEmail(String email, String token, String subject, String path, String msg) {
    sendEmail(email, token, subject, path, msg,
        "This PIN code is valid for <strong style=\"color:#374151;\">24 hours</strong> and will expire after that. If you didn't create an account with MERRA, you can safely ignore this email.",
        "Continue");
  }

  /**
   * Sends an HTML email to the specified recipient styled to match the MERRA
   * frontend UI design (#689D4B primary green, sharp 0px border-radius, Inter
   * typography, and slate text hierarchy).
   *
   * @param email   The recipient's email address
   * @param token   The 4-digit PIN code (or action token) to include in the email;
   *                {@code null} for informational emails without an action
   * @param subject The subject of the email
   * @param path    The path to append to the frontend URL for the page link
   * @param msg     The message to display in the email body
   * @param note    The (HTML) footnote shown under the action
   * @param buttonLabel The label of the action button for link emails
   */
  private void sendEmail(String email, String token, String subject, String path, String msg, String note,
      String buttonLabel) {
    try {
      boolean isPinCode = token != null && token.matches("^\\d{4}$");
      final String actionSection;
      if (token == null) {
        actionSection = "";
      } else if (isPinCode) {
        actionSection = """
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background-color:#f4f8f1;border:1px solid #689D4B;border-radius:0;padding:18px 36px;">
                <span style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,monospace;font-size:32px;font-weight:700;letter-spacing:12px;color:#689D4B;margin-right:-12px;display:inline-block;">%s</span>
              </div>
            </div>
            """.formatted(token);
      } else {
        UriComponents uriBuilder = UriComponentsBuilder.fromUriString(webUrl)
            .path(path)
            .queryParam("token", token)
            .build();
        final URL actionUrl = uriBuilder.toUri().toURL();
        actionSection = """
            <div style="text-align:center;margin:28px 0;">
              <a href="%s" style="background-color:#689D4B;border:1px solid #689D4B;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:0;font-weight:600;font-size:15px;display:inline-block;">%s</a>
            </div>
            """.formatted(actionUrl, buttonLabel);
      }

      final String content = """
          <div style="background-color:#f8fafc;padding:48px 16px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">
            <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-top:4px solid #689D4B;border-radius:0;padding:40px 32px;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
              <div style="text-align:center;margin-bottom:28px;">
                <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:0.12em;color:#689D4B;">MERRA</h1>
                <p style="margin:6px 0 0 0;font-size:13px;font-weight:500;color:#64748b;letter-spacing:0.025em;">Accounting &amp; Bookkeeping</p>
              </div>

              <h2 style="font-size:18px;font-weight:600;color:#1e293b;text-align:center;margin:0 0 12px 0;">%s</h2>
              <p style="font-size:15px;color:#374151;line-height:1.55;text-align:center;margin:0 0 24px 0;">
                %s
              </p>

              %s

              <p style="font-size:13px;color:#6b7280;line-height:1.5;text-align:center;margin:16px 0 0 0;">
                %s
              </p>

              <hr style="border:none;height:1px;background:#e2e8f0;margin:28px 0;">

              <div style="text-align:center;font-size:12px;color:#64748b;line-height:1.6;">
                <p style="margin:0 0 4px 0;">Need help? <a href="mailto:support@merra.example" style="color:#0284c7;text-decoration:underline;font-weight:500;">Contact Support</a></p>
                <p style="margin:0;color:#94a3b8;">MERRA &bull; 123 Business St, Suite 100 &bull; Manila, Philippines</p>
              </div>
            </div>

            <div style="text-align:center;font-size:12px;color:#94a3b8;margin-top:20px;">
              If you didn&rsquo;t expect this email, you can ignore it.
            </div>
          </div>
          """
          .formatted(subject, msg, actionSection, note);

      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

      helper.setTo(email);
      helper.setSubject(subject);
      helper.setFrom(emailFrom);
      helper.setText(content, true);
      mailSender.send(mimeMessage);

    } catch (MessagingException | MalformedURLException | MailException | InvalidUrlException e) {
      System.err.println("Failed to send email: " + e.getMessage());
    }
  }

  /**
   * Authenticates a user using the provided login request and returns a JWT-based
   * authentication response.
   *
   * @param request The login request containing the user's email and password
   * @return A {@link SigninResponse} containing JWT tokens and user details upon
   *         successful authentication
   * @throws BadCredentialsException if authentication fails due to invalid
   *                                 credentials
   */
  public SigninResponse login(LoginRequest request) {
    return createAuthenticationResponse(request.email(), request.password());
  }

  /**
   * Authenticates a user with the provided login credentials and returns a
   * JWT-based authentication response.
   *
   * @param request The login request containing the user's email and password.
   * @return A {@link SigninResponse} containing JWT tokens and user details upon
   *         successful authentication.
   * @throws BadCredentialsException if authentication fails due to invalid
   *                                 credentials.
   */
  public SigninResponse loginWithCredentials(LoginRequest request) {
    final String email = request.email();
    final String password = request.password();
    return createAuthenticationResponse(email, password);
  }

  /**
   * Attempts to authenticate a user with the provided email and password.
   * Throws a BadCredentialsException if authentication fails.
   *
   * @param email    The user's email address
   * @param password The user's password
   * @return Authentication object if successful
   * @throws BadCredentialsException if authentication fails
   */
  private Authentication authenticateUser(String email, String password) {
    try {
      return authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
    } catch (AuthenticationException e) {
      // Wrap and rethrow authentication failures as BadCredentialsException with a
      // custom message
      throw new BadCredentialsException(AuthConstantResponses.INVALID_CREDENTIALS, e);
    }
  }

  /* Create JWT tokens after successful authentication */
  private SigninResponse createAuthenticationResponse(String email, String password) {

    Authentication authentication = authenticateUser(email, password);

    // Set the authenticated user in the security context
    SecurityContextHolder.getContext().setAuthentication(authentication);

    UserAccount getUser = userRepository
        .findUserByEmailIgnoreCase(email).get();

    SigninResponse response = new SigninResponse();

    // Check if the user's profile is complete:
    // - Both first name and last name must be set (not null)
    // - User must be part of an organization
    boolean isProfileComplete = true;
    if (getUser.getFirstName() == null || getUser.getLastName() == null) {
      isProfileComplete = false;
    }

    boolean isPartOfOrganization = getUser.isPartOfOrganization() ? getUser.isPartOfOrganization() : false;
    boolean hasActiveWorkspace = userWorkspaceManager != null
        && userWorkspaceManager.checkAndRefreshWorkspace(getUser.getUserId());

    response.setAccountStatus(
        response.new AccountStatus(isProfileComplete, getUser.isEnabled(), isPartOfOrganization, hasActiveWorkspace));

    final Map<String, Object> claims = Map.of("role", getUser.getRoles());
    final String accessToken = jwtUtils.generateToken(getUser.getEmail(), claims, forAccessToken, false);
    final String refreshToken = jwtUtils.generateToken(getUser.getEmail(), claims, refreshTokenExpiration, true);
    List<String> roles = getUser.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

    response.setTokens(new JwtTokens(accessToken, refreshToken));
    response.setUserdetails(response.new Userdetails(getUser.getUserId(), getUser.getEmail(), roles));

    return response;

  }

  public VerificationResponse signup(CreateAccountRequest request) {
    final String emailReq = request.email();
    final String genderReq = request.gender();
    final String passwordReq = request.password();
    Optional<UserAccount> userEmail = userRepository.findUserByEmailIgnoreCase(emailReq);

    if (userEmail.isPresent()) {
      if (userEmail.get().isEnabled()) {
        throw new EmailAlreadyEnabledException("Email already exists.");
      } else {
        var user = userEmail.get();
        final String pinCode = generatePinCode();
        final String resetToken = generatePinVerificationToken(user.getEmail(), pinCode);
        user.setVerificationToken(resetToken);
        userRepository.save(user);
        sendVerificationEmail(user.getEmail(), pinCode);

        return new VerificationResponse(true, new VerificationResponse.VerificationToken(resetToken),
            new VerificationResponse.UserDetail(user.getUserId(), user.getEmail()));
      }
    }

    final String encodedPassword = passwordEncoder.encode(passwordReq);
    UserAccount userBuilder = new UserAccount(emailReq, encodedPassword);
    userBuilder.setGender(genderReq);

    final String pinCode = generatePinCode();
    final String verificationEmailToken = generatePinVerificationToken(userBuilder.getEmail(), pinCode);
    userBuilder.setVerificationToken(verificationEmailToken);
    final UserAccount newUser = userRepository.save(userBuilder);
    sendVerificationEmail(request.email(), pinCode);

    /**
     * Once the new user is created,
     * create it's account settings
     */
    userAccountService.createUserAccountSetting(newUser);
    return new VerificationResponse(
        false,
        new VerificationResponse.VerificationToken(verificationEmailToken),
        new VerificationResponse.UserDetail(newUser.getUserId(), newUser.getEmail()));
  }

  public VerificationResponse resendEmailVerification(ResendEmailVerification request) {
    Optional<UserAccount> findUser;
    if (request.userId() != null) {
      findUser = userRepository.findById(request.userId());
    } else if (request.email() != null && !request.email().isBlank()) {
      findUser = userRepository.findUserByEmailIgnoreCase(request.email().trim());
    } else {
      throw new IllegalArgumentException("User ID or email is required to resend verification email.");
    }

    if (findUser.isEmpty()) {
      throw new EntityNotFoundException("User not found.");
    }

    UserAccount user = findUser.get();
    if (user.isEnabled()) {
      throw new EmailAlreadyEnabledException("Email is already verified.");
    }

    final String pinCode = generatePinCode();
    final String newVerificationToken = generatePinVerificationToken(user.getEmail(), pinCode);
    user.setVerificationToken(newVerificationToken);
    userRepository.save(user);
    sendVerificationEmail(user.getEmail(), pinCode);
    return new VerificationResponse(true, new VerificationResponse.VerificationToken(newVerificationToken),
        new VerificationResponse.UserDetail(user.getUserId(), user.getEmail()));
  }

  /**
   * Starts the "forgot password" flow. A single-use reset link is emailed when the
   * account exists, is activated, and has not reset its password within the last
   * {@code app.password-reset.cooldown-days} (default 14) days.
   *
   * <p>
   * To avoid leaking which emails are registered, this method never reveals
   * whether the account exists; callers always receive the same response. Accounts
   * inside the restriction window instead get an informational email with the
   * next available date.
   * </p>
   */
  public void requestPasswordReset(String email) {
    if (email == null || email.isBlank()) {
      return;
    }
    Optional<UserAccount> found = userRepository.findUserByEmailIgnoreCase(email.trim());
    if (found.isEmpty() || !found.get().isEnabled()) {
      return;
    }

    UserAccount user = found.get();
    final OffsetDateTime now = OffsetDateTime.now();
    final OffsetDateTime nextAllowed = nextPasswordResetAllowedAt(user);
    if (nextAllowed != null && now.isBefore(nextAllowed)) {
      sendPasswordResetCooldownEmail(user.getEmail(), nextAllowed);
      return;
    }

    final byte[] raw = new byte[32];
    SECURE_RANDOM.nextBytes(raw);
    final String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

    user.setPasswordResetTokenHash(hashResetToken(rawToken));
    user.setPasswordResetExpiresAt(now.plusMinutes(passwordResetTokenMinutes));
    userRepository.save(user);
    sendForgotPasswordEmail(user.getEmail(), rawToken);
  }

  /**
   * @return {@code true} when the token matches an outstanding, unexpired reset
   *         request.
   */
  public boolean isPasswordResetTokenValid(String token) {
    return findAccountByValidResetToken(token).isPresent();
  }

  /**
   * Describes the state of a reset token so the UI can show a dedicated
   * "link expired" page: valid, expired (known token past its deadline) or
   * invalid (unknown/already used).
   */
  public PasswordResetTokenStatusResponse getPasswordResetTokenStatus(String token) {
    if (findAccountByValidResetToken(token).isPresent()) {
      return new PasswordResetTokenStatusResponse(true, false);
    }
    return new PasswordResetTokenStatusResponse(false, isResetTokenExpired(token));
  }

  private boolean isResetTokenExpired(String token) {
    if (token == null || token.isBlank()) {
      return false;
    }
    return userRepository.findByPasswordResetTokenHash(hashResetToken(token.trim()))
        .map(u -> u.getPasswordResetExpiresAt() != null
            && !OffsetDateTime.now().isBefore(u.getPasswordResetExpiresAt()))
        .orElse(false);
  }

  /**
   * Completes the "forgot password" flow: validates the emailed token, enforces
   * the 14-day restriction, stores the new password and invalidates the token.
   *
   * @throws BadCredentialsException  if the token is invalid or expired
   * @throws IllegalArgumentException if the passwords don't match / are too weak,
   *                                  the new password equals the current one, or
   *                                  the account reset its password too recently
   */
  public void resetPassword(ResetPasswordRequest request) {
    if (!Objects.equals(request.newPassword(), request.confirmPassword())) {
      throw new IllegalArgumentException("Passwords do not match.");
    }

    UserAccount user = findAccountByValidResetToken(request.token())
        .orElseThrow(() -> new BadCredentialsException(
            isResetTokenExpired(request.token())
                ? "This password reset link has expired. Please request a new one."
                : "This password reset link is invalid. Please request a new one."));

    final OffsetDateTime now = OffsetDateTime.now();
    final OffsetDateTime nextAllowed = nextPasswordResetAllowedAt(user);
    if (nextAllowed != null && now.isBefore(nextAllowed)) {
      throw new IllegalArgumentException(passwordResetCooldownMessage(nextAllowed));
    }

    if (user.getPassword() != null && passwordEncoder.matches(request.newPassword(), user.getPassword())) {
      throw new IllegalArgumentException("New password must be different from your current password.");
    }

    user.setAccountPassword(passwordEncoder.encode(request.newPassword()));
    user.setPasswordResetTokenHash(null);
    user.setPasswordResetExpiresAt(null);
    user.setPasswordResetAt(now);
    userRepository.save(user);
    logger.info("Password reset completed for user {}", user.getUserId());
  }

  private Optional<UserAccount> findAccountByValidResetToken(String token) {
    if (token == null || token.isBlank()) {
      return Optional.empty();
    }
    return userRepository.findByPasswordResetTokenHash(hashResetToken(token.trim()))
        .filter(u -> u.getPasswordResetExpiresAt() != null
            && OffsetDateTime.now().isBefore(u.getPasswordResetExpiresAt()));
  }

  /** @return when the account may reset again, or {@code null} if it has never reset. */
  private OffsetDateTime nextPasswordResetAllowedAt(UserAccount user) {
    return user.getPasswordResetAt() == null
        ? null
        : user.getPasswordResetAt().plusDays(passwordResetCooldownDays);
  }

  private String passwordResetCooldownMessage(OffsetDateTime nextAllowed) {
    return "Your password was reset recently. Passwords can only be reset once every "
        + passwordResetCooldownDays + " days. You can reset it again on "
        + nextAllowed.format(DateTimeFormatter.ofPattern("MMMM d, yyyy")) + ".";
  }

  private static String hashResetToken(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 is not available", e);
    }
  }

  public void fillPersonalInformation(FillPersonalInformation req, UUID id) {
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

  /**
   * Retrieves the currently authenticated UserAccount from the security context.
   *
   * @return the authenticated UserAccount
   * @throws EntityNotFoundException if no user is authenticated or the principal
   *                                 is not a UserAccount
   */
  public UserAccount getCurrentAuthenticatedUser() {
    UserAccount principal = SecurityUtils.getPrincipal(UserAccount.class)
        .orElseThrow(() -> new EntityNotFoundException("No authenticated UserAccount found."));
    logger.info("Authenticated user: {}", principal);
    return principal;
  }

  /**
   * Checks the verification status of an account by its email.
   * Used to prevent access to the verification page if the account is already verified.
   *
   * @param email The user email address
   * @return EmailVerificationStatusResponse indicating existence and verification status
   */
  public EmailVerificationStatusResponse checkVerificationStatus(String email) {
    if (email == null || email.isBlank()) {
      return new EmailVerificationStatusResponse(false, false, false);
    }
    Optional<UserAccount> userOpt = userRepository.findUserByEmailIgnoreCase(email.trim());
    if (userOpt.isEmpty()) {
      return new EmailVerificationStatusResponse(false, false, false);
    }
    UserAccount user = userOpt.get();
    boolean isVerified = user.isEnabled();
    return new EmailVerificationStatusResponse(true, isVerified, !isVerified);
  }

  /**
   * Invalidate the current user session by blacklisting both the access token
   * and refresh token (if provided), clearing the security context, and evicting
   * cached user principal data.
   *
   * @param accessToken  the Bearer access token string
   * @param refreshToken the optional refresh token string
   */
  public void logout(String accessToken, String refreshToken) {
    if (accessToken != null && !accessToken.isBlank()) {
      tokenBlacklistService.blacklistToken(accessToken);
    }
    if (refreshToken != null && !refreshToken.isBlank()) {
      tokenBlacklistService.blacklistToken(refreshToken);
    }
    SecurityContextHolder.clearContext();
    try {
      redisTemplate.delete(RedisKeys.PRINCIPAL);
      redisTemplate.delete(RedisKeys.PRINCIPAL_ACCOUNT_SETTINGS);
    } catch (Exception e) {
      logger.warn("Could not delete principal keys from Redis during logout: {}", e.getMessage());
    }
    logger.info("Successfully completed user logout and token invalidation");
  }
}
