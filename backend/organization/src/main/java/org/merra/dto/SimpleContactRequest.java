package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SimpleContactRequest (
		@NotBlank(message = "name component cannot be blank")
		String name,
		@NotNull(message = "organizationId component cannot be null")
		UUID organizationId
) {
}