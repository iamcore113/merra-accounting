package org.merra.dto;

import java.util.UUID;

public record CompleteContactRequest(
		UUID organizationId,
		String name,
		String firstName,
		String lastName,
		String emailAddress,
		String accountNumber,
		String companyNumber,
		String contactStatus
) {
	public CompleteContactRequest {
		if (organizationId == null) {
			throw new IllegalArgumentException("organizationId cannot be null");
		}
		if (name == null || name.isBlank()) {
			throw new IllegalArgumentException("name cannot be null or blank");
		}
		if (contactStatus == null || contactStatus.isBlank()) {
			throw new IllegalArgumentException("contactStatus cannot be null or blank");
		}
	}
}
