package org.merra.dto;

/**
 * Request to complete a password reset using the token emailed to the user.
 */
public record ResetPasswordRequest(
		String token,
		String newPassword,
		String confirmPassword) {
	public ResetPasswordRequest {
		if (token == null || token.isBlank()) {
			throw new IllegalArgumentException("Reset token is required.");
		}
		if (newPassword == null || newPassword.isBlank()) {
			throw new IllegalArgumentException("New password cannot be blank.");
		}
		if (newPassword.length() < 8) {
			throw new IllegalArgumentException("Password must be at least 8 characters long.");
		}
		if (confirmPassword == null || confirmPassword.isBlank()) {
			throw new IllegalArgumentException("Please confirm your new password.");
		}
	}
}
