package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record TokenRequest(
		@NotBlank(message = "userEmail component cannot be blank.")
		String userEmail,
		@NotBlank(message = "refreshToken component cannot be blank.")
		String refreshToken
) {}
