package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank(message = "email component cannot be blank.")
		String email,
		@NotBlank(message = "password component cannot be blank.")
		String password) {
}

