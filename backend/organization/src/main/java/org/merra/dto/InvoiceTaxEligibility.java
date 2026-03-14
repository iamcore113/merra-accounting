package org.merra.dto;

import java.util.UUID;

public record InvoiceTaxEligibility(
		UUID organizationID,
		Boolean taxEligible,
		String message
) {
	public InvoiceTaxEligibility {
		if (organizationID == null) {
			throw new IllegalArgumentException("organizationID cannot be null");
		}
		if (taxEligible == null) {
			throw new IllegalArgumentException("taxEligible cannot be null");
		}
		if (message == null || message.isBlank()) {
			throw new IllegalArgumentException("message cannot be null or blank");
		}
	}
}