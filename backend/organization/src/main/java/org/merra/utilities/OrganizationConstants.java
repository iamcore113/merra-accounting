package org.merra.utilities;

public final class OrganizationConstants {
	private OrganizationConstants() {}
	
	/* INFO: Tax basis */
	public static final String TAX_BASIS_CASH = "CASH";
	public static final String TAX_BASIS_ACCRUAL = "ACCRUAL";
	
	/* INFO: LIST OF CURRENCIES */
	public static final String CURRENCY_UNITES_STATES = "USD";
	public static final String CURRENCY_MEXICO = "MXN";
	public static final String CURRENY_JAPAN = "JPY";
	public static final String CURRENCY_CHINA = "CNY";
	public static final String CURRENCY_INDIA = "INR";
	public static final String CURRENCY_BRAZIL = "BRL";
	public static final String CURRENCY_SOUTH_AFRICA = "ZAR";
	public static final String CURRENCY_EGYPT = "EGP";
	public static final String CURRENCY_PHILIPPINES = "PHP";
	public static final String CURRENCY_SWITZERLAND = "CHF";
	
	// Organization user invitation status
	public static final String INVITATION_STATUS_PENDING = "PENDING";
	public static final String INVITATION_STATUS_ACCEPTING = "ACCEPTED";
	public static final String INVITATION_STATUS_DECLINED = "DECLINED";
	public static final String INVITATION_STATUS_CANCELLED = "CANCELLED";
	
	// Supported external links
	public static final String EXTERNAL_LINK_FACEBOOK = "FACEBOOK";
	public static final String EXTERNAL_LINK_INSTAGRAM = "INSTAGRAM";
	public static final String EXTERNAL_LINK_WEBSITE = "WEBSITE";
	public static final String EXTERNAL_LINK_TIKTOK = "TIKTOK";
	
	// Supported phone type
	public static final String PHONE_TYPE_DEFAULT = "DEFAULT";
	public static final String PHONE_TYPE_DDI = "DDI";
	public static final String PHONE_TYPE_MOBILE = "MOBILE";
	public static final String PHONE_TYPE_FAX = "FAX";
	
	// Address lines
	public static final String ADDRESS_LINE_1 = "addressLine1";
	public static final String ADDRESS_LINE_2 = "addressLine2";
	public static final String ADDRESS_LINE_3 = "addressLine3";
	public static final String ADDRESS_LINE_4 = "addressLine4";
	
	// Payment terms Elements
	public static final String PAYMENT_TERMS_BILLS = "BILLS";
	public static final String PAYMENT_TERMS_SALES = "SALES";
}
