package org.merra.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InvoiceListResponse(
		UUID id,
		String invoiceNumber,
		String type,
		String typeName,
		String contactName,
		String contactType,
		LocalDate issueDate,
		LocalDate dueDate,
		String status,
		BigDecimal totalAmount,
		String reference) {
}
