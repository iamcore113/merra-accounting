package org.merra.dto;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record JournalResponse(
		UUID journalId,
		BigInteger journalNumber,
		LocalDate journalDate,
		String narration,
		String sourceType,
		UUID invoiceId,
		String invoiceNumber,
		String invoiceType,
		String invoiceTypeName,
		String invoiceStatus,
		String contactName,
		String reference,
		BigDecimal totalDebit,
		BigDecimal totalCredit,
		List<JournalLineItem> journalLines) {

	public record JournalLineItem(
			UUID id,
			UUID accountId,
			String accountCode,
			String accountName,
			String accountType,
			String description,
			BigDecimal debit,
			BigDecimal credit) {
	}
}
