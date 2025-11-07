package org.merra.utilities;

public final class InvoiceConstants {
	private InvoiceConstants() {}
	
	// Invoice Statuses
	public static final String INVOICE_STATUS_DRAFT = "DRAFT"; // The default status
	public static final String INVOICE_STATUS_SUBMITTED = "SUBMITTED";
	public static final String INVOICE_STATUS_AUTHORISED = "AUTHORISED";
	
	// Invoice Line amount types
	// this means the provided unitAmount for each line item
	//  is the price before any tax is applied.
	public static final String INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE = "EXCLUSIVE";
	public static final String INVOICE_LINE_AMOUNT_TYPE_INCLUSIVE = "INCLUSIVE";
	public static final String INVOICE_LINE_AMOUNT_TYPE_NOTAX = "NO_TAX";
	
	// Invoice tax calculation types
	public static final String INVOICE_TAX_CALCULATION_TYPE_TAXCALC_AUTO = "TAXCALC/AUTO";
	
	// Invoice type
	public static final String INVOICE_TYPE_CUSTOMER_INVOICE = "CUSTOMER_INVOICE";
	public static final String INVOICE_TYPE_SUPPLIER_INVOICE = "SUPPLIER_INVOICE";
}
