package org.merra.utilities;

public final class AccountConstants {
	// prevent instantiation
	private AccountConstants() {}
	
	// statuses
	public static final String ACCOUNT_STATUS_ACTIVE = "ACTIVE";
	public static final String ACCOUNT_STATUS_ARCHIVED = "ARCHIVED";
	
	// Entry type
	public static final String ACC_ENTRY_DEBIT = "DEBIT";
	public static final String ACC_ENTRY_CREDIT = "CREDIT";

	// Account names
	public static final String ACC_NAME_ACC_RECEIVABLE = "Accounts Receivable";
	public static final String ACC_NAME_PREP_EXPENSES = "Prepaid Expenses";
	public static final String ACC_NAME_INVENTORY = "Inventory";
	public static final String ACC_NAME_FIXED_ASSET = "Fixed Assets";
	public static final String ACC_NAME_ACC_PAYABLE = "Accounts Payable";
	public static final String ACC_NAME_LOANS_PAYABLE = "Loans Payable";
	public static final String ACC_NAME_TAX_PAYABLE = "Tax Payable";
	public static final String ACC_NAME_RETAINED_EARNING = "Retained Earnings";
	public static final String ACC_NAME_OWNER_DRAWING = "Owner's Drawing";
	public static final String ACC_NAME_OWNER_CAPITAL = "Owner's Capital";
	public static final String ACC_NAME_SALES_REVENUE = "Sales Revenue";
	public static final String ACC_NAME_SERVICE_INCOME = "Service Income";
	public static final String ACC_NAME_OFFICE_EXPENSES = "Office Expenses";
	public static final String ACC_NAME_MARKETING_EXPENSES = "Marketing Expenses";
	public static final String ACC_NAME_CONSULTING_ACCOUNTING = "Consulting and Accounting";
	public static final String ACC_NAME_COST_GOODS_SOLD = "Cost of Goods Sold";
	public static final String ACC_NAME_UTILITIES = "Utilities";
	public static final String ACC_NAME_TRAVEL_AND_ENTERTAINMENT = "Travel and Entertainment";

	// Account categories
	public static final String ACC_CATEGORY_ASSET = "ASSET";
	public static final String ACC_CATEGORY_EQUITY = "EQUITY";
	public static final String ACC_CATEGORY_EXPENSE = "EXPENSE";
	public static final String ACC_CATEGORY_LIABILITY = "LIABILITY";
	public static final String ACC_CATEGORY_REVENUE = "REVENUE";
	
	// Account class types
	public static final String ACC__CLASS_TYPE_ASSET = "ASSET";
	public static final String ACC__CLASS_TYPE_EQUITY = "EQUITY";
	public static final String ACC__CLASS_TYPE_EXPENSE = "EXPENSE";
	public static final String ACC__CLASS_TYPE_LIABILITY = "LIABILITY";
	public static final String ACC__CLASS_TYPE_REVENUE = "REVENUE";
	
	// Default Account Codes
	// assets
	public static final String ACC_CODE_ACC_RECEIVABLE = "100";
	public static final String ACC_CODE_PREP_EXPENSES = "110";
	public static final String ACC_CODE_INVENTORY = "120";
	public static final String ACC_CODE_FIXED_ASSET = "130";
	// liabilities
	public static final String ACC_CODE_ACC_PAYABLE = "200";
	public static final String ACC_CODE_LOANS_PAYABLE = "210";
	public static final String ACC_CODE_TAX_PAYABLE = "230";
	// equities
	public static final String ACC_CODE_RETAINED_EARNING = "300";
	public static final String ACC_CODE_OWNER_DRAWING = "310";
	public static final String ACC_CODE_OWNER_CAPITAL = "320";
	// revenues
	public static final String ACC_CODE_SALES_REVENUE = "400";
	public static final String ACC_CODE_SERVICE_INCOME = "410";
	// expenses
	public static final String ACC_CODE_OFFICE_EXPENSES = "500";
	public static final String ACC_CODE_MARKETING_EXPENSES = "510";
	public static final String ACC_CODE_CONSULTING_ACCOUNTING = "520";
	public static final String ACC_CODE_COST_GOODS_SOLD = "530";
	public static final String ACC_CODE_UTILITIES = "540";
	public static final String ACC_CODE_TRAVEL_AND_ENTERTAINMENT = "550";
}
