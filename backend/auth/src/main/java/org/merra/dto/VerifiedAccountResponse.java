package org.merra.dto;

import java.util.UUID;

public record VerifiedAccountResponse(
                boolean isVerified,
                UUID userId,
                String email,
                String accessToken) {
        public VerifiedAccountResponse {
                if (email == null || email.isBlank()) {
                        throw new IllegalArgumentException("email component cannot be blank.");
                }
                if (accessToken == null || accessToken.isBlank()) {
                        throw new IllegalArgumentException("accessToken component cannot be blank.");
                }
        }

}
