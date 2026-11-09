package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAccountRequest(
		@NotBlank(message = "Account code is required") String code,
		@NotBlank(message = "Account name is required") String accountName,
		@NotBlank(message = "Account type is required") String accountType,
		@NotBlank(message = "Account category is required") String category,
		@NotBlank(message = "Account description is required") String description,
		String taxType,
		Boolean enablePaymentToAccount,
		Boolean addToWatchList,
		String status) {
}
