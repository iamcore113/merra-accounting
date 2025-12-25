package org.merra.dto;
public record JwtTokens(
		String accessToken,
		String refreshToken
) {
	public JwtTokens {
		if (accessToken == null || accessToken.isBlank()) {
			throw new IllegalArgumentException("accessToken component cannot be blank.");
		}

		if (refreshToken == null || refreshToken.isBlank()) {
			throw new IllegalArgumentException("refreshToken component cannot be blank.");
		}
	}
}

