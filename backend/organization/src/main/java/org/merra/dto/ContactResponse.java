package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContactResponse(
		@NotNull(message = "contactId component cannot be null")
		UUID contactId,
		@NotBlank(message = "name component cannot be blank")
		String name
) {

}
