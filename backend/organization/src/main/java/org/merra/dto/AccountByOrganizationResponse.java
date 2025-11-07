package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccountByOrganizationResponse(
		@NotNull(message = "organizationID component cannot be null.")
		UUID organizationID,
		@NotNull(message = "accountID component cannot be null.")
		UUID accountID,
		@NotBlank(message = "code component cannot be blank.")
		String code,
		@NotBlank(message = "accountName component cannot be blank.")
		String accountName,
		@NotBlank(message = "accountType component cannot be blank.")
		String accountType,
		String description
) {

}