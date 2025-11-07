package org.merra.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccountResponse(
		@NotNull(message = "accountID component cannot be null.")
		UUID accountID,
		@NotBlank(message = "code component cannot be blank.")
		String code,
		@NotBlank(message = "name component cannot be blank.")
		String name,
		@NotBlank(message = "taxType component cannot be blank.")
		String taxType,
		@NotBlank(message = "status component cannot be blank.")
		String status,
		LocalDate updatedDate,
		boolean addToWatchList
) {

}