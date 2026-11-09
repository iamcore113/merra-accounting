package org.merra.dto;

import java.util.List;
import java.util.UUID;

public record AccountMetadataResponse(
		List<CategoryOption> categories,
		List<AccountTypeOption> accountTypes) {

	public record CategoryOption(
			UUID id,
			String name,
			String entryType) {
	}

	public record AccountTypeOption(
			UUID id,
			String name,
			String category,
			String description) {
	}
}
