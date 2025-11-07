package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InvoiceTaxEligibility(
		@NotNull(message = "organizationID component cannot be null.")
		UUID organizationID,
		@NotNull(message = "taxEligible component cannot be null.")
		Boolean taxEligible,
		@NotBlank(message = "message component cannot be blank.")
		String message
) {

}