package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.SigninResponse;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.EmailVerificationStatusResponse;
import org.merra.dto.ForgotPasswordRequest;
import org.merra.dto.PasswordResetTokenStatusResponse;
import org.merra.dto.ResetPasswordRequest;
import org.merra.dto.LoginRequest;
import org.merra.dto.LogoutRequest;
import org.merra.dto.ResendEmailVerification;
import org.merra.dto.VerificationResponse;
import org.merra.dto.VerifiedAccountResponse;
import org.merra.dto.VerifyPinRequest;
import org.merra.service.AuthService;
import org.merra.utils.AuthConstantResponses;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "api/auth/")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping(value = "visitor")
    public void enterAsVisitor() {

    }

    /**
     * Verifies a user's account using the 4-digit PIN code sent via email.
     *
     * @param req the VerifyPinRequest containing the user's email and 4-digit PIN
     * @return ResponseEntity containing the verification result and verified
     *         account details
     */
    @PostMapping(value = {"req/signup/verify", "verify-pin"})
    public ResponseEntity<ApiResponse<VerifiedAccountResponse>> verifyPin(@Valid @RequestBody VerifyPinRequest req) {
        final VerifiedAccountResponse res = authService.verifyAccountPin(req);
        final ApiResponse<VerifiedAccountResponse> apiRes = new ApiResponse<>(
                "Account successfully activated",
                true,
                HttpStatus.CREATED,
                res);

        return ResponseEntity.ok(apiRes);
    }

    /**
     * Verifies a user's email address using a verification token sent via email.
     * This endpoint is typically accessed through a link in the verification email.
     *
     * @param tokenParam the email verification token
     * @return ResponseEntity containing the verification result and verified
     *         account details
     */
    @GetMapping(value = "req/signup/verify")
    public ResponseEntity<ApiResponse<VerifiedAccountResponse>> verifyEmail(@RequestParam("token") String tokenParam) {
        final VerifiedAccountResponse res = authService.verifyAccountToken(tokenParam);
        final ApiResponse<VerifiedAccountResponse> apiRes = new ApiResponse<>(
                "Email successfully verified",
                true,
                HttpStatus.CREATED,
                res);

        return ResponseEntity.ok(apiRes);
    }

    /**
     * Checks whether an account with the specified email has already completed
     * verification. Used to protect the verification page from being accessed
     * once the account has been activated.
     *
     * @param email the email address to inspect
     * @return ResponseEntity with existence and verification status
     */
    @GetMapping("verification-status")
    public ResponseEntity<ApiResponse<EmailVerificationStatusResponse>> checkVerificationStatus(
            @RequestParam("email") String email) {
        final EmailVerificationStatusResponse res = authService.checkVerificationStatus(email);
        final ApiResponse<EmailVerificationStatusResponse> apiRes = new ApiResponse<>(
                "Verification status retrieved successfully",
                true,
                HttpStatus.OK,
                res);
        return ResponseEntity.ok(apiRes);
    }

    /**
     * Authenticates a user and provides access tokens for subsequent API requests.
     * Validates credentials and returns authentication tokens upon successful
     * login.
     *
     * @param loginRequest the login credentials containing username/email and
     *                     password
     * @return ResponseEntity containing authentication tokens and user information
     */
    @PostMapping(value = "signin")
    public ResponseEntity<ApiResponse<SigninResponse>> signin(@Valid @RequestBody LoginRequest loginRequest) {
        final SigninResponse res = authService.login(loginRequest);
        final ApiResponse<SigninResponse> apiRes = new ApiResponse<>(
                "Login successful",
                true,
                HttpStatus.OK,
                res);
        return ResponseEntity.ok(apiRes);
    }

    /**
     * Registers a new user account and sends an email verification link.
     * If an account with the same email already exists but is unverified, it
     * resends the verification email.
     *
     * @param req the account creation request containing user details
     * @return ResponseEntity with verification instructions and status
     */
    @PostMapping("signup")
    public ResponseEntity<ApiResponse<VerificationResponse>> signup(@Valid @RequestBody CreateAccountRequest req) {
        final VerificationResponse res = authService.signup(req);

        ApiResponse<VerificationResponse> response = new ApiResponse<>();
        if (res.resent()) {
            response.setMessage(AuthConstantResponses.EMAIL_VERIFICATION_RESEND);
            response.setSuccess(true);
            response.setResponse(HttpStatus.OK);
            response.setData(res);
        } else {
            response.setMessage(AuthConstantResponses.EMAIL_VERIFICATION);
            response.setSuccess(true);
            response.setResponse(HttpStatus.CREATED);
            response.setData(res);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Resends the email verification link to a user who has not yet verified their
     * email.
     * This is useful when the original verification email was not received or has
     * expired.
     *
     * @param req the request containing the email address to resend verification to
     * @return ResponseEntity with confirmation that the verification email was
     *         resent
     */
    @PostMapping(value = {"resend/verification/email", "resend-verification-email"})
    public ResponseEntity<ApiResponse<VerificationResponse>> resendEmailVerification(
            @Valid @RequestBody ResendEmailVerification req) {
        final var resentToken = authService.resendEmailVerification(req);

        ApiResponse<VerificationResponse> response = new ApiResponse<>();
        response.setMessage(AuthConstantResponses.EMAIL_VERIFICATION_RESEND);
        response.setSuccess(true);
        response.setResponse(HttpStatus.OK);
        response.setData(resentToken);
        return ResponseEntity.ok(response);
    }

    /**
     * Emails a password reset link. Always responds with the same message so the
     * endpoint can't be used to discover which emails are registered.
     */
    @PostMapping("forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.requestPasswordReset(req.email());
        return ResponseEntity.ok(new ApiResponse<>(
                "If an account exists for that email, a password reset link has been sent.",
                true,
                HttpStatus.OK,
                null));
    }

    /**
     * Checks whether a password reset token is still valid so the reset page can
     * fail fast on bad or expired links.
     */
    @GetMapping("reset-password/validate")
    public ResponseEntity<ApiResponse<PasswordResetTokenStatusResponse>> validateResetToken(
            @RequestParam("token") String token) {
        return ResponseEntity.ok(new ApiResponse<>(
                "Password reset token checked",
                true,
                HttpStatus.OK,
                authService.getPasswordResetTokenStatus(token)));
    }

    /**
     * Sets a new password using the emailed token. Limited to one reset per 14 days.
     */
    @PostMapping("reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(new ApiResponse<>(
                "Your password has been reset. You can now sign in.",
                true,
                HttpStatus.OK,
                null));
    }

    /**
     * Invalidate user session and blacklist access & refresh tokens.
     *
     * @param request       the HTTP servlet request containing the Authorization header
     * @param logoutRequest optional request body containing the refresh token
     * @return ResponseEntity confirming logout
     */
    @PostMapping("logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            @RequestBody(required = false) LogoutRequest logoutRequest) {
        String accessToken = null;
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);
        }
        String refreshToken = logoutRequest != null ? logoutRequest.refreshToken() : null;
        authService.logout(accessToken, refreshToken);

        ApiResponse<Void> response = new ApiResponse<>(
                "Logout successful",
                true,
                HttpStatus.OK,
                null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("logout")
    public ResponseEntity<ApiResponse<Void>> logoutGet(
            HttpServletRequest request,
            @RequestParam(value = "refreshToken", required = false) String refreshToken) {
        return logout(request, new LogoutRequest(refreshToken));
    }
}