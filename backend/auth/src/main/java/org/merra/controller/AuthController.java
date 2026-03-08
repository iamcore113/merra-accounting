package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.AuthResponse;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.LoginRequest;
import org.merra.dto.ResendEmailVerification;
import org.merra.dto.VerificationResponse;
import org.merra.dto.VerifiedAccountResponse;
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

import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "api/v1/auth/")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
    public ResponseEntity<ApiResponse> verifyEmail(@RequestParam("token") String tokenParam) {
        final VerifiedAccountResponse res = authService.verifyEmail(tokenParam);
        final ApiResponse apiRes = new ApiResponse(
                "Email successfully verified",
                true,
                HttpStatus.CREATED,
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
    public ResponseEntity<AuthResponse> signin(@Valid @RequestBody LoginRequest loginRequest) {
        final AuthResponse res = authService.login(loginRequest);
        return ResponseEntity.ok(res);
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
    public ResponseEntity<ApiResponse> signup(@Valid @RequestBody CreateAccountRequest req) {
        final VerificationResponse res = authService.signup(req);

        ApiResponse response = new ApiResponse();
        if (res.resent()) {
            response.setMessage(AuthConstantResponses.EMAIL_VERIFICATION_RESEND);
            response.setResult(true);
            response.setResponse(HttpStatus.OK);
            response.setData(res);
        } else {
            response.setMessage(AuthConstantResponses.EMAIL_VERIFICATION);
            response.setResult(true);
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
    @PostMapping("resend/verification/email")
    public ResponseEntity<ApiResponse> resendEmailVerification(@Valid @RequestBody ResendEmailVerification req) {
        final var resentToken = authService.resendEmailVerification(req);

        ApiResponse response = new ApiResponse();
        response.setMessage(AuthConstantResponses.EMAIL_VERIFICATION_RESEND);
        response.setResult(true);
        response.setResponse(HttpStatus.OK);
        response.setData(resentToken);
        return ResponseEntity.ok(response);
    }

}