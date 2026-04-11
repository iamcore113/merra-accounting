package org.merra.dto;

import java.util.UUID;

public record ContactsByOrganizationResponse(
		String organizationName,
		UUID contactId,
		String contactName
) {
	public ContactsByOrganizationResponse {
		if (organizationName == null || organizationName.isBlank()) {
			throw new IllegalArgumentException("Organization name cannot be null or blank");
		}
		if (contactId == null) {
			throw new IllegalArgumentException("Contact ID cannot be null");
		}
		if (contactName == null || contactName.isBlank()) {
			throw new IllegalArgumentException("Contact name cannot be null or blank");
		}
	}
}
