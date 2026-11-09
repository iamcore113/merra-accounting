package org.merra.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record InvoiceDetailResponse(
		UUID id,
		String invoiceNumber,
		String type,
		String typeName,
		String organizationName,
		String organizationEmail,
		String organizationPhone,
		String organizationAddress,
		String organizationTaxNumber,
		UUID contactId,
		String contactName,
		String contactEmail,
		String contactPhone,
		String contactAddress,
		String contactAccountNumber,
		String contactTypeInitials,
		LocalDate date,
		LocalDate dueDate,
		String lineAmountTypes,
		String status,
		String reference,
		Double subTotal,
		BigDecimal totalTax,
		BigDecimal grandTotal,
		List<LineItemDetail> lineItems) {

	public record LineItemDetail(
			UUID id,
			String lineItemId,
			String description,
			Double quantity,
			Double unitAmount,
			Double lineAmount,
			String accountCode,
			String taxType,
			BigDecimal taxAmount,
			Integer discountRate,
			BigDecimal total) {
	}
}
