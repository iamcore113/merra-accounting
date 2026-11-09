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

export interface InvoiceListItem {
	id: string;
	invoiceNumber: string;
	type: 'CUSTOMER' | 'SUPPLIER';
	typeName: string;
	contactName: string;
	contactType?: 'CT' | 'SP' | 'BT';
	issueDate: string;
	dueDate: string;
	status: 'DRAFT' | 'APPROVED' | 'PAID' | 'VOIDED' | 'SUBMITTED' | 'AUTHORISED';
	totalAmount: number;
	reference?: string;
}

export interface InvoiceLineItemDetail {
	id: string;
	lineItemId: string;
	description: string;
	quantity: number;
	unitAmount: number;
	lineAmount: number;
	accountCode: string;
	taxType: string;
	taxAmount: number;
	discountRate?: number;
	total: number;
}

export interface InvoiceDetailResponse {
	id: string;
	invoiceNumber: string;
	type: 'CUSTOMER' | 'SUPPLIER';
	typeName: string;
	organizationName?: string;
	organizationEmail?: string;
	organizationPhone?: string;
	organizationAddress?: string;
	organizationTaxNumber?: string;
	contactId?: string;
	contactName: string;
	contactEmail?: string;
	contactPhone?: string;
	contactAddress?: string;
	contactAccountNumber?: string;
	contactTypeInitials?: 'CT' | 'SP' | 'BT';
	date: string;
	dueDate: string;
	lineAmountTypes?: string;
	status: string;
	reference?: string;
	subTotal: number;
	totalTax: number;
	grandTotal: number;
	lineItems: InvoiceLineItemDetail[];
}
