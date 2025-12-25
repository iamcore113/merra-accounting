package org.merra.dto;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import org.merra.validation.annotation.ValidateInvoice;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@ValidateInvoice
public record CreateInvoiceRequest(
		@NotNull(message = "invoiceType component cannot be null.")
		String invoiceType,
		@NotNull(message = "contact component cannot be null")
		UUID contact,
		@NotNull(message = "lineAmounType component cannot be null")
		@Pattern(regexp = "^[A-Z](?:[A-Z]|_[A-Z])*$", message = "Invalid value for lineAmountType component.")
		String lineAmountType,
		@NotNull(message = "lineItems component cannot be null.")
		Set<LineItems> lineItems,
		@NotNull(message = "date component cannot be null.")
		LocalDate date,
		@Future(message = "Invalid value for dueDate component.")
		@DateTimeFormat(iso = ISO.DATE)
		LocalDate dueDate,
		String status,
		@NotNull(message = "taxEligible component cannot be null.")
		Boolean taxEligible,
		String reference
) {
	public record LineItems(
			@NotNull(message = "description component cannot be null.")
			String description,
			@NotNull(message = "quantity component cannot be null.")
			@DecimalMin("1.0")
			@Digits(fraction = 1, integer = 3)
			Double quantity,
			@NotNull(message = "unitAmount component cannot be null.")
			@Digits(fraction = 2, integer = 6)
			Double unitAmount,
			@NotBlank(message = "accountCode component cannot be blank.")
			String accountCode,
			String overrideTaxType,
			Integer discountRate
	) {
	}
}
