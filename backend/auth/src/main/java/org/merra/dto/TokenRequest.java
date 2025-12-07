package org.merra.dto;

public record TokenRequest(
		String userEmail,
		String refreshToken) {
	public TokenRequest {
		if (userEmail == null || userEmail.isBlank()) {
			throw new IllegalArgumentException("userEmail component cannot be blank.");
		}

		if (refreshToken == null || refreshToken.isBlank()) {
			throw new IllegalArgumentException("refreshToken component cannot be blank.");
		}
	}
}
