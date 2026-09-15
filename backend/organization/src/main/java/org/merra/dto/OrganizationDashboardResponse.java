package org.merra.dto;

public record OrganizationDashboardResponse(
		InvoiceStatusCount invoiceStatusCount
) {
	public record InvoiceStatusCount (
			Integer draft,
			Integer submitted,
			Integer authorised) {
		
		public InvoiceStatusCount {
			if (draft == null) {
				draft = 0;
			}
			if (submitted == null) {
				submitted = 0;
			}
			if (authorised == null) {
				authorised = 0;
			}
		}
	}
}
