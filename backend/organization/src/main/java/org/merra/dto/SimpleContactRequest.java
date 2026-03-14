package org.merra.dto;

import java.util.UUID;

public record SimpleContactRequest (
		String name,
		UUID organizationId
) {
	public SimpleContactRequest {
		if (name == null || name.isBlank()) {
			throw new IllegalArgumentException("name cannot be null or blank");
		}
		if (organizationId == null) {
			throw new IllegalArgumentException("organizationId cannot be null");
		}
	}
}