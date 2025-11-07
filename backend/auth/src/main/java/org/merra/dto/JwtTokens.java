package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record JwtTokens(
		@NotBlank(message = "accessToken component cannot be blank.")
		String accessToken,
		@NotBlank(message = "refreshToken component cannot be blank.")
		String refreshToken
) {}

