package org.merra.dto;

/**
 * Request to email a password reset link to the given address.
 */
public record ForgotPasswordRequest(String email) {
	public ForgotPasswordRequest {
		if (email == null || email.isBlank()) {
			throw new IllegalArgumentException("Email is required.");
		}
	}
}
