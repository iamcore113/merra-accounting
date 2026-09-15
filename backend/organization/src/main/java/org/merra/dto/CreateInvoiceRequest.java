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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@ValidateInvoice
public record CreateInvoiceRequest(
		UUID invoiceType,
		UUID contact,
		@Pattern(regexp = "^[A-Z](?:[A-Z]|_[A-Z])*$", message = "Invalid value for lineAmountType component.") String lineAmountType,
		Set<LineItems> lineItems,
		LocalDate date,
		@Future(message = "Invalid value for dueDate component.") @DateTimeFormat(iso = ISO.DATE) LocalDate dueDate,
		String status,
		Boolean taxEligible,
		String reference) {
	public CreateInvoiceRequest {
		if (lineItems != null && lineItems.isEmpty()) {
			throw new IllegalArgumentException("lineItems component cannot be empty.");
		}
		if (invoiceType == null) {
			throw new IllegalArgumentException("invoiceType component cannot be null or blank.");
		}
		if (contact == null || contact.toString().isBlank()) {
			throw new IllegalArgumentException("contact component cannot be blank.");
		}
		if (lineAmountType == null || lineAmountType.isBlank()) {
			throw new IllegalArgumentException("lineAmountType component cannot be null or blank.");
		}
		if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
			throw new IllegalArgumentException("dueDate component must be a future date.");
		}
		if (taxEligible == null) {
			throw new IllegalArgumentException("taxEligible component cannot be null.");
		}
	}

	public record LineItems(
			String description,
			@NotNull(message = "quantity component cannot be null.") @DecimalMin("1.0") @Digits(fraction = 1, integer = 3) Double quantity,
			@NotNull(message = "unitAmount component cannot be null.") @Digits(fraction = 2, integer = 6) Double unitAmount,
			String accountCode,
			String overrideTaxType,
			Integer discountRate) {

		public LineItems {
			if (discountRate == null) {
				throw new IllegalArgumentException("discountRate component cannot be null.");
			}
			if (accountCode == null || accountCode.isBlank()) {
				throw new IllegalArgumentException("accountCode component cannot be null or blank.");
			}
			if (description == null || description.isBlank()) {
				throw new IllegalArgumentException("description component cannot be null or blank.");
			}
		}
	}
}
