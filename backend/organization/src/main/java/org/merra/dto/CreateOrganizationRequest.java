package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;

public record CreateOrganizationRequest(
		String displayName,
		UUID type,
		String contactNo,
		@Email(message = "Email component must be valid")
		String email,
		String country,
		FinancialYear financialYear,
		String currency) {

			public CreateOrganizationRequest {
				if (displayName == null || displayName.isBlank()) {
					throw new IllegalArgumentException("displayName cannot be null or blank");
				}
				if (type == null) {
					throw new IllegalArgumentException("type cannot be null");
				}
				if (email == null || email.isBlank()) {
					throw new IllegalArgumentException("email cannot be null or blank");
				}
				if (country == null || country.isBlank()) {
					throw new IllegalArgumentException("country cannot be null or blank");
				}
				if (currency == null || currency.isBlank()) {
					throw new IllegalArgumentException("currency cannot be null or blank");
				}
				if (contactNo == null || contactNo.isBlank()) {
					throw new IllegalArgumentException("contactNo cannot be null or blank");
				}
				if (financialYear == null) {
					throw new IllegalArgumentException("financialYear cannot be null");
				}
			}
	public record FinancialYear(int yearEndDay, int yearEndMonth) {
		public FinancialYear {
				if (yearEndMonth < 1 || yearEndMonth > 12) {
					throw new IllegalArgumentException("yearEndMonth must be between 1 and 12");
				}
		}
	}
}
