package org.merra.dto;

import java.util.UUID;

public record UpdateInvoiceResponse(
		UUID invoiceID,
		String formerStatus,
		String currentStatus) {
	public UpdateInvoiceResponse {
		if (invoiceID == null) {
			throw new IllegalArgumentException("invoiceID cannot be null");
		}
		if (formerStatus == null || formerStatus.isBlank()) {
			throw new IllegalArgumentException("formerStatus cannot be null or blank");
		}
		if (currentStatus == null || currentStatus.isBlank()) {
			throw new IllegalArgumentException("currentStatus cannot be null or blank");
		}
	}
}
