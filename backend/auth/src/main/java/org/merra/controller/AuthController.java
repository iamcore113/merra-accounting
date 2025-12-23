package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.AuthResponse;
import org.merra.dto.JwtTokens;
import org.merra.dto.LoginRequest;
import org.merra.dto.ResendEmailVerification;
import org.merra.dto.CreateAccountRequest;
import org.merra.dto.TokenRequest;
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
     * Generate new access & refresh token
     * 
     * @param request TokenRequest object type.
     * @return
     */
    @PostMapping("tokens")
    public ResponseEntity<?> tokens(@Valid @RequestBody TokenRequest request) {
        final JwtTokens tokens = authService.tokens(request);
        return new ResponseEntity<>(tokens, HttpStatus.OK);
    }

    @PostMapping(value = "signin")
    public ResponseEntity<AuthResponse> signin(@Valid @RequestBody LoginRequest loginRequest) {
        final AuthResponse res = authService.login(loginRequest);
        return ResponseEntity.ok(res);
    }

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