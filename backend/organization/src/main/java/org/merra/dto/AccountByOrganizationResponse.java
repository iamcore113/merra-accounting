package org.merra.dto;

import java.util.UUID;

public record AccountByOrganizationResponse(
		UUID organizationID,
		UUID accountID,
		String code,
		String accountName,
		String accountType,
		String description) {
	public AccountByOrganizationResponse {
		if (organizationID == null) {
			throw new IllegalArgumentException("organizationID cannot be null");
		}
		if (accountID == null) {
			throw new IllegalArgumentException("accountID cannot be null");
		}
		if (code == null || code.isBlank()) {
			throw new IllegalArgumentException("code cannot be null or blank");
		}
		if (accountName == null || accountName.isBlank()) {
			throw new IllegalArgumentException("accountName cannot be null or blank");
		}
		if (accountType == null || accountType.isBlank()) {
			throw new IllegalArgumentException("accountType cannot be null or blank");
		}
	}
}