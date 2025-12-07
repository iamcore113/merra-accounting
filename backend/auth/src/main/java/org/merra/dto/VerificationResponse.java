package org.merra.dto;

import java.util.UUID;

public record VerificationResponse(
                boolean resent,
                VerificationToken verificationToken,
                UserDetail userDetail) {

        public VerificationResponse {
                if (verificationToken == null) {
                        throw new IllegalArgumentException("verificationToken component cannot be blank.");
                }
        }

        public record VerificationToken(String token) {
                public VerificationToken {
                        if (token == null || token.isBlank()) {
                                throw new IllegalArgumentException("token component cannot be blank.");
                        }
                }
        }

        public record UserDetail(UUID userId, String email) {
                public UserDetail {
                        if (email == null || email.isBlank()) {
                                throw new IllegalArgumentException("email component cannot be blank.");
                        }

                        if (userId == null) {
                                throw new IllegalArgumentException("userId component cannot be blank.");
                        }
                }
        }
}
