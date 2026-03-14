package org.merra.dto;

import java.util.UUID;

public record OrganziationSelectionResponse(
    UUID organizationId,
    String displayName,
    String legalName,
    String description,
    String status
) {
    public OrganziationSelectionResponse {
    	if (organizationId == null) {
			throw new IllegalArgumentException("organizationId cannot be null");
		}
    	if (displayName == null || displayName.isBlank()) {
    		throw new IllegalArgumentException("displayName cannot be null or blank");
    	}
    	if (legalName == null || legalName.isBlank()) {
			throw new IllegalArgumentException("legalName cannot be null or blank");
		}
    	if (status == null || status.isBlank()) {
    		throw new IllegalArgumentException("status cannot be null or blank");
    	}
    }
}
