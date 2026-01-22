package org.merra.controller;

import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.JwtTokens;
import org.merra.dto.ValidateTokenRequest;
import org.merra.service.TokenService;
import org.merra.utils.AuthConstantResponses;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;


@RestController
@RequestMapping("api/v1/tokens/")
public class TokensController {
    private final TokenService tokenService;
    
    public TokensController(TokenService ts) {
        this.tokenService = ts;
    }
    /**
     * Generate new access & refresh token
     * 
     * @param request TokenRequest object type.
     * @return
     */
    @GetMapping("request/user/{userId}")
    public ResponseEntity<ApiResponse> requestTokens(@PathVariable("userId") UUID userId) {
        final JwtTokens tokens = tokenService.requestTokens(userId);
        ApiResponse response = new ApiResponse();
        response.setMessage(AuthConstantResponses.TOKENS_ISSUED);
        response.setResult(true);
        response.setResponse(HttpStatus.OK);
        response.setData(tokens);
        return ResponseEntity.ok(response);
    }

    @GetMapping("validate")
    public ResponseEntity<ApiResponse> validateToken(@Valid @RequestBody ValidateTokenRequest req) {
        var validate = tokenService.validateToken(req.token());
        ApiResponse response = new ApiResponse();
        response.setMessage(AuthConstantResponses.TOKEN_INVALID);
        response.setResult(true);
        response.setResponse(HttpStatus.OK);
        response.setData(validate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("obtain/new")
    public ResponseEntity<ApiResponse> obtainNewAccessToken(@Valid @RequestBody ValidateTokenRequest req) {
        final JwtTokens tokens = tokenService.obtainNewAccessToken(req.token());
        ApiResponse response = new ApiResponse();
        response.setMessage(AuthConstantResponses.TOKENS_ISSUED);
        response.setResult(true);
        response.setResponse(HttpStatus.OK);
        response.setData(tokens);
        return ResponseEntity.ok(response);
    }
}