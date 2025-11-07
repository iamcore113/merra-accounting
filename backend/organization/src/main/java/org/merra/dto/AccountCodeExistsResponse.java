package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record AccountCodeExistsResponse(
		@NotBlank(message = "accountCode component cannot be blank.")
		String accountCode,
		boolean exists
) {

}
