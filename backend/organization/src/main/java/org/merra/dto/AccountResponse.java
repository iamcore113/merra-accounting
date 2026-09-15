package org.merra.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AccountResponse(
		UUID accountID,
		String code,
		String name,
		String taxType,
		String status,
		LocalDate updatedDate,
		boolean addToWatchList
) {
	public AccountResponse {
		if (accountID == null) {
			throw new IllegalArgumentException("accountID cannot be null");
		}
		if (code == null || code.isBlank()) {
			throw new IllegalArgumentException("code cannot be null or blank");
		}
		if (name == null || name.isBlank()) {
			throw new IllegalArgumentException("name cannot be null or blank");
		}
		if (taxType == null || taxType.isBlank()) {
			throw new IllegalArgumentException("taxType cannot be null or blank");
		}
		if (status == null || status.isBlank()) {
			throw new IllegalArgumentException("status cannot be null or blank");
		}
	}
}