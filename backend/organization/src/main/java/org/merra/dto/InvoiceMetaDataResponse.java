package org.merra.dto;

import java.util.List;

public record InvoiceMetaDataResponse(
		List<String> invoiceTypes,
		List<String> invoiceStatusCodes
) {

}
