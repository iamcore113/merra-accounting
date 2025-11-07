package org.merra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAccountRequest(
		@NotBlank(message = "email component cannot be blank.") String email,
		@NotBlank(message = "password component cannot be blank.") @Size(min = 8, max = 100, message = "password component has invalid character size.") String password) {
}