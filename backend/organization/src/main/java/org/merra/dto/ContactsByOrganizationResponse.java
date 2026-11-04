package org.merra.dto;

import java.util.UUID;

public record ContactsByOrganizationResponse(
		String organizationName,
		UUID contactId,
		String contactName,
		String accountNumber,
		String emailAddress,
		Boolean isSupplier,
		Boolean isCustomer,
		String status
) {
	public ContactsByOrganizationResponse {
		organizationName = organizationName != null ? organizationName : "";
		contactName = contactName != null ? contactName : "";
		isSupplier = Boolean.TRUE.equals(isSupplier);
		isCustomer = Boolean.TRUE.equals(isCustomer);
		status = (status != null && !status.isBlank()) ? status : "ACTIVE";
	}
}
