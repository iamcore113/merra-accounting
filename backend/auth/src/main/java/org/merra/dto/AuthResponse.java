package org.merra.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AuthResponse(
		@NotNull(message = "token component cannot be null.") JwtTokens token,
		@NotNull(message = "user component cannot be null.") UserDetail user,
		List<String> roles) {
	public record UserDetail(
			@NotNull(message = "userId component cannot be null.") UUID userId,
			@NotBlank(message = "email component cannot be blank.") String email) {
	}
}