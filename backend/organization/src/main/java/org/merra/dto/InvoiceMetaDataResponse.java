package org.merra.dto;

import java.util.Set;
import java.util.UUID;

public record InvoiceMetaDataResponse(
		Set<InvoiceType> invoiceTypes,
		Set<InvoiceStatusCode> invoiceStatusCodes,
		Set<LineAmountType> lineAmountTypes) {

	public record LineAmountType(UUID id, String name) {
		public LineAmountType {
			if (id == null || name == null || name.isBlank() || name.isEmpty()) {
				throw new IllegalArgumentException("id and name must not be null or empty");
			}
			if (name.isBlank() || name == null) {
				throw new IllegalArgumentException("name must not be null or empty");
			}
		}
	}

	public record InvoiceType(UUID id, String name) {
		public InvoiceType {
			if (id == null || name == null || name.isBlank() || name.isEmpty()) {
				throw new IllegalArgumentException("id and name must not be null or empty");
			}
			if (name.isBlank() || name == null) {
				throw new IllegalArgumentException("name must not be null or empty");
			}
		}
	}

	public record InvoiceStatusCode(UUID id, String code) {
		public InvoiceStatusCode {
			if (id == null) {
				throw new IllegalArgumentException("id must not be null or empty");
			}
			if (code.isBlank() || code == null) {
				throw new IllegalArgumentException("code must not be null or empty");
			}
		}
	}
}
