package org.merra.dto;

import java.util.UUID;

public record VerifiedAccountResponse(
                boolean isVerified,
                UUID userId,
                String email,
                String accessToken,
                String refreshToken,
                boolean isProfileComplete,
                boolean partOfOrganization,
                boolean hasActiveWorkspace) {

        public VerifiedAccountResponse(
                        boolean isVerified,
                        UUID userId,
                        String email,
                        String accessToken) {
                this(isVerified, userId, email, accessToken, null, false, false, false);
        }

        public VerifiedAccountResponse {
                if (email == null || email.isBlank()) {
                        throw new IllegalArgumentException("email component cannot be blank.");
                }
                if (accessToken == null || accessToken.isBlank()) {
                        throw new IllegalArgumentException("accessToken component cannot be blank.");
                }
        }

}
