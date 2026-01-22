package org.merra.dto;

public record ValidateTokenRequest(String token) {
    public ValidateTokenRequest {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("token component is required.");
        }
    }
}
