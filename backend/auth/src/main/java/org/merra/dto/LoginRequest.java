package org.merra.dto;

public record LoginRequest(
		String email,
		String password) {
	public LoginRequest {
		if (email == null || email.isBlank()) {
			throw new IllegalArgumentException("email component cannot be blank.");
		}
		if (password == null || password.isBlank()) {
			throw new IllegalArgumentException("password component cannot be blank.");
		}
	}
}
