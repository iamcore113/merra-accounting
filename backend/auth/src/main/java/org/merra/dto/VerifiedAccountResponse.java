package org.merra.dto;

import java.util.UUID;

public record VerifiedAccountResponse(
                boolean isVerified,
                UUID userId,
                String email,
                String temporaryAccessToken
) {
        public VerifiedAccountResponse {
                if (email == null || email.isBlank()) {
                        throw new IllegalArgumentException("email component cannot be blank.");
                }
                if (temporaryAccessToken == null || temporaryAccessToken.isBlank()) {
                        throw new IllegalArgumentException("temporaryAccessToken component cannot be blank.");
                }
        }

}
