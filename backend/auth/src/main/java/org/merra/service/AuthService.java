package org.merra.service;

import java.net.MalformedURLException;
import java.net.URL;
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
import org.merra.dto.FillPersonalInformation;
import org.merra.dto.JwtTokens;
import org.merra.dto.LoginRequest;
import org.merra.dto.ResendEmailVerification;
import org.merra.dto.VerificationResponse;
import org.merra.dto.VerifiedAccountResponse;
import org.merra.dto.VisitorAccessToken;
import org.merra.entities.UserAccount;
import org.merra.enums.UserAccountStatusEn;
import org.merra.exception.EmailAlreadyEnabledException;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.merra.utils.AuthConstantResponses;
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
  private int forAccessToken;
  @Value("${token.refresh-token-duration}")
  private int refreshTokenExpiration;
  @Value("${token.email-verification-duration}")
  private int verificationTokenDuration;
  @Value("${spring.mail.username}")
  private String emailFrom;
  @Value("${app.frontend.url}")
  private String webUrl;

  private final static String ROLE_ADVISOR = UserAccountStatusEn.ADVISOR.toString();
  private final static String ROLE_VISITOR = UserAccountStatusEn.VISITOR.toString();
  private final static String ROLE_STANDARD = UserAccountStatusEn.STANDARD.toString();
  private final static String ROLE_READ_ONLY = UserAccountStatusEn.READ_ONLY.toString();
  private final static String ROLE_INVOICE_ONLY = UserAccountStatusEn.INVOICE_ONLY.toString();
  private final static String ROLE_IDLE = UserAccountStatusEn.IDLE.toString();

  private final RedisTemplate<String, Object> redisTemplate;
  private final JavaMailSender mailSender;
  private final UserDetailsService userDetailsService;
  private final JwtUtils jwtUtils;
  private final AuthenticationManager authenticationManager;
  private final PasswordEncoder passwordEncoder;
  private final UserAccountRepository userRepository;
  private final UserAccountService userAccountService;

  public AuthService(
      RedisTemplate<String, Object> redisTemplate,
      JavaMailSender mailSender,
      UserDetailsService userDetailsService,
      JwtUtils jwtUtils,
      AuthenticationManager authenticationManager,
      PasswordEncoder passwordEncoder,
      UserAccountRepository userAccountRepository,
      UserAccountService userAccountService) {
    this.redisTemplate = redisTemplate;
    this.mailSender = mailSender;
    this.userDetailsService = userDetailsService;
    this.jwtUtils = jwtUtils;
    this.authenticationManager = authenticationManager;
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userAccountRepository;
    this.userAccountService = userAccountService;
  }

  public VisitorAccessToken generateVisitorAccessToken() {
    // TODO: Implement visitor access token generation
    return new VisitorAccessToken("visitor-token");
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
    // Extract email from the JWT token
    final String email = jwtUtils.extractUsername(tokenParam);
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

    // Enable the account, clear the verification token, and assign the default role
    findAccount.setVerificationToken(null);
    findAccount.setIsEnabled(true);
    findAccount.setRoles(ROLE_IDLE);
    userRepository.save(findAccount);

    final String getAccountEmail = findAccount.getEmail();
    final UUID getUserId = findAccount.getUserId();

    // Generate a access JWT token.
    final String generateAccessToken = jwtUtils.generateToken(getAccountEmail, Map.of("role", ROLE_IDLE),
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
   * Sends a verification email to the specified user with a verification token
   * link.
   *
   * @param email    The recipient's email address
   * @param verToken The verification token to include in the email link
   */
  public void sendVerificationEmail(String email, String verToken) {
    final String subject = "Email Verification";
    final String path = "account/verify";
    final String msg = "Click the button below to verify your email address";
    sendEmail(email, verToken, subject, path, msg);

  }

  /**
   * Sends a password reset email to the specified user with a reset token link.
   *
   * @param email      The recipient's email address
   * @param resetToken The password reset token to include in the email link
   */
  public void sendForgotPasswordEmail(String email, String resetToken) {
    final String subject = "Password Reset Request";
    final String path = "auth/req/reset-password/";
    final String msg = "Click the button below to reset your password.";
    sendEmail(email, resetToken, subject, path, msg);
  }

  /**
   * Sends an HTML email to the specified recipient with a verification or reset
   * link.
   *
   * @param email   The recipient's email address
   * @param token   The token to be included in the link
   * @param subject The subject of the email
   * @param path    The path to append to the frontend URL for the action link
   * @param msg     The message to display in the email body
   *
   *                This method builds a styled HTML email containing an action
   *                link (e.g., for verification or password reset)
   *                and sends it using the configured mail sender. If sending
   *                fails, the error is logged to standard error.
   */
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

    response.setAccountStatus(response.new AccountStatus(isProfileComplete, getUser.isEnabled(), isPartOfOrganization));

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
    Optional<UserAccount> findUserEmail = userRepository.findUserByEmailIgnoreCase(emailReq);

    if (findUserEmail.isPresent()) {
      if (findUserEmail.get().isEnabled()) {
        throw new EmailAlreadyEnabledException("Email already exists.");
      } else {
        var user = findUserEmail.get();
        var userTokens = user.getVerificationToken();
        final String resetToken = jwtUtils.generateToken(user.getEmail(), Map.of("role", ROLE_IDLE),
            verificationTokenDuration, false);
        user.setVerificationToken(userTokens);
        sendVerificationEmail(user.getEmail(), resetToken);
        userRepository.save(user);

        return new VerificationResponse(true, new VerificationResponse.VerificationToken(resetToken),
            new VerificationResponse.UserDetail(user.getUserId(), user.getEmail()));
      }
    }

    final String encodedPassword = passwordEncoder.encode(passwordReq);
    UserAccount userBuilder = new UserAccount(emailReq, encodedPassword);
    userBuilder.setGender(genderReq);

    final String verificationEmailToken = jwtUtils.generateToken(userBuilder.getEmail(), Map.of("role", ROLE_IDLE),
        verificationTokenDuration, false);
    userBuilder.setVerificationToken(verificationEmailToken);
    final UserAccount newUser = userRepository.save(userBuilder);
    sendVerificationEmail(request.email(), verificationEmailToken);

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
    Optional<UserAccount> findUser = userRepository.findById(request.userId());

    if (findUser.isEmpty()) {
      throw new EntityNotFoundException("User not found.");
    }

    UserAccount user = findUser.get();
    if (user.isEnabled()) {
      throw new EmailAlreadyEnabledException("Email is already verified.");
    }

    final String newVerificationToken = jwtUtils.generateToken(user.getEmail(), Map.of("role", ROLE_IDLE),
        verificationTokenDuration, false);
    user.setVerificationToken(newVerificationToken);
    userRepository.save(user);
    sendVerificationEmail(user.getEmail(), newVerificationToken);
    return new VerificationResponse(true, new VerificationResponse.VerificationToken(newVerificationToken),
        new VerificationResponse.UserDetail(user.getUserId(), user.getEmail()));
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
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !auth.isAuthenticated()) {
      throw new EntityNotFoundException("No authenticated user found.");
    }

    if (auth.getPrincipal() instanceof UserAccount principal) {
      logger.info("Authenticated user: {}", principal);
      return principal;
    } else {
      throw new EntityNotFoundException("Authenticated principal is not a UserAccount.");
    }
  }
}
