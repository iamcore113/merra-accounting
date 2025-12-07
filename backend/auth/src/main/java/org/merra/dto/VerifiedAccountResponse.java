package org.merra.dto;

public record VerifiedAccountResponse(
                boolean isVerified, String email) {
        public VerifiedAccountResponse {
                if (email == null || email.isBlank()) {
                        throw new IllegalArgumentException("email component cannot be blank.");
                }
        }

}
