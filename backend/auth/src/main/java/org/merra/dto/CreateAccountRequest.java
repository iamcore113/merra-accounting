package org.merra.dto;

public record CreateAccountRequest(
		String email,
		String gender,
		String password) {
	public CreateAccountRequest {
		if (email == null || email.isBlank()) {
			throw new IllegalArgumentException("email component cannot be blank.");
		}
		if (gender == null || gender.isBlank()) {
			throw new IllegalArgumentException("gender component cannot be blank.");
		}

		if (password == null || password.isBlank()) {
			throw new IllegalArgumentException("password component cannot be blank.");
		}
		if (password.length() < 10) {
			throw new IllegalArgumentException("password must be at least 10 characters long.");
		}
	}
}