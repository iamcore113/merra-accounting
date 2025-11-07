package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CompleteContactRequest(
		@NotNull(message = "organizationId component cannot be null")
		UUID organizationId,
		@NotBlank(message = "name component cannpt be blank")
		String name,
		String firstName,
		String lastName,
		String emailAddress,
		String accountNumber,
		String companyNumber,
		@NotBlank(message = "contactStatus component cannot be blank")
		String contactStatus
) {

}
