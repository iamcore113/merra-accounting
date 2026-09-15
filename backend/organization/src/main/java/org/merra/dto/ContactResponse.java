package org.merra.dto;

import java.util.UUID;

public record ContactResponse(
		UUID contactId,
		String name
) {
	public ContactResponse {
		if (contactId == null) {
			throw new IllegalArgumentException("contactId cannot be null");
		}
		if (name == null || name.isBlank()) {
			throw new IllegalArgumentException("name cannot be null or blank");
		}
	}
}
