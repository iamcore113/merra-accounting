package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrganizationRequest(
		@NotBlank(message = "displayName cannot be blank") String displayName,
		@NotNull(message = "type cannot be blank") UUID type,
		@NotBlank(message = "description cannot be blank") String email,
		@NotBlank(message = "currency cannot be blank") String country,
		FinancialYear financialYear,
		String currency) {
	public record FinancialYear(
			int yearEndDay,
			int yearEndMonth) {
	}
}
