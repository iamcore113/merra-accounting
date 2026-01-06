package org.merra.dto;

public record VerifiedAccountResponse(
                boolean isVerified,
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
