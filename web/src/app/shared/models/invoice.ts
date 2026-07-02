// Corresponds to: backend/organization/src/main/java/org/merra/dto/InvoiceMetaDataResponse.java
export interface LineAmountType {
	id: string;
	name: string;
}

export interface InvoiceType {
	id: string;
	name: string;
}

export interface InvoiceStatusCode {
	id: string;
	code: string;
}

export interface InvoiceMetaDataResponse {
	invoiceTypes: InvoiceType[];
	invoiceStatusCodes: InvoiceStatusCode[];
	lineAmountTypes: LineAmountType[];
}
