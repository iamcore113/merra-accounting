package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateInvoiceResponse(
		@NotNull(message = "invoiceID component cannot be null.")
		UUID invoiceID,
		@NotBlank(message = "formerStatus cannot be blank.")
		String formerStatus,
		@NotBlank(message = "currentStatus cannot be blank.")
		String currentStatus
) {

}
