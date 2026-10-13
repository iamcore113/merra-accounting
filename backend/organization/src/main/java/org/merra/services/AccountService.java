package org.merra.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.merra.dto.AccountByOrganizationResponse;
import org.merra.dto.AccountCodeExistsResponse;
import org.merra.dto.AccountResponse;
import org.merra.entities.Account;
import org.merra.entities.AccountCategory;
import org.merra.entities.AccountType;
import org.merra.entities.Organization;
import org.merra.mapper.AccountMapper;
import org.merra.repositories.AccountCategoryRepository;
import org.merra.repositories.AccountRepository;
import org.merra.repositories.AccountTypeRepository;
import org.merra.utilities.AccountConstants;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;

// This class will handle the chart of accounts
@Service
@Validated
public class AccountService {
	private final AccountMapper accountMapper;
	private final AccountCategoryRepository accountCategoryRepository;
	private final AccountRepository accountRepository;
	private final AccountTypeRepository accountTypeRepository;

	public AccountService(
			AccountMapper accountMapper,
			AccountCategoryRepository accountCategoryRepository,
			AccountRepository accountRepository,
			AccountTypeRepository accountTypeRepository) {
		this.accountMapper = accountMapper;
		this.accountCategoryRepository = accountCategoryRepository;
		this.accountRepository = accountRepository;
		this.accountTypeRepository = accountTypeRepository;
	}

	public AccountResponse createAccount() {
		return null;
	}

	/**
	 * This will check if account code already exists globally or not.
	 * 
	 * @param code - accepts {@linkplain java.lang.String} object type.
	 * @return - {@linkplain AccountCodeExistsResponse} object type.
	 */
	public AccountCodeExistsResponse checkIfCodeExists(String code) {
		boolean checkIfExists = accountRepository.existsByCodeIgnoreCase(code);

		return new AccountCodeExistsResponse(code, checkIfExists);
	}

	/**
	 * This will check if account code already exists for a specific organization.
	 * 
	 * @param code           - accepts {@linkplain java.lang.String} object type.
	 * @param organizationId - accepts {@linkplain java.util.UUID} object type.
	 * @return - {@linkplain AccountCodeExistsResponse} object type.
	 */
	public AccountCodeExistsResponse checkIfCodeExists(String code, UUID organizationId) {
		boolean checkIfExists = accountRepository.existsByCodeIgnoreCaseAndOrganizationId(code, organizationId);

		return new AccountCodeExistsResponse(code, checkIfExists);
	}

	/**
	 * Provisions the standard chart of accounts for a newly created organization.
	 *
	 * <p>
	 * Creates and persists a predefined set of ledger accounts grouped by
	 * category (Asset, Liability, Equity, Revenue, Expense). Account types that
	 * do not yet exist in the database are created on-the-fly before the accounts
	 * are saved. All persistence operations are wrapped in a single transaction
	 * so the entire set is committed or rolled back atomically.
	 * </p>
	 *
	 * <p>
	 * Accounts provisioned per category:
	 * </p>
	 * <ul>
	 * <li><b>Asset</b>: Accounts Receivable, Prepaid Expenses, Inventory, Fixed
	 * Assets</li>
	 * <li><b>Liability</b>: Accounts Payable, Loans Payable, Tax Payable</li>
	 * <li><b>Equity</b>: Retained Earnings, Owner's Drawing, Owner's Capital</li>
	 * <li><b>Revenue</b>: Sales Revenue, Service Income</li>
	 * <li><b>Expense</b>: Office Expenses, Marketing Expenses, Consulting &amp;
	 * Accounting, Cost of Goods Sold, Utilities, Travel &amp; Entertainment</li>
	 * </ul>
	 *
	 * @param org The {@linkplain Organization} for which the default accounts are
	 *            created.
	 */
	@Transactional
	public void createDefaultAccounts(@NotNull Organization org) {

		// Account categories
		AccountCategory assetCategory = getCategoryOrThrow(AccountConstants.ACCOUNT_CATEGORY_ASSET);
		AccountCategory liabilityCategory = getCategoryOrThrow(AccountConstants.ACCOUNT_CATEGORY_LIABILITY);
		AccountCategory revenueCategory = getCategoryOrThrow(AccountConstants.ACCOUNT_CATEGORY_REVENUE);
		AccountCategory equityCategory = getCategoryOrThrow(AccountConstants.ACCOUNT_CATEGORY_EQUITY);
		AccountCategory expenseCategory = getCategoryOrThrow(AccountConstants.ACCOUNT_CATEGORY_EXPENSE);

		// Account types
		AccountType currentAsset = getOrCreateAccountType("Current Asset");
		AccountType inventoryType = getOrCreateAccountType("Inventory");
		AccountType fixedAssetType = getOrCreateAccountType("Fixed Asset");
		AccountType currentLiabilityType = getOrCreateAccountType("Current Liability");
		AccountType liabilityType = getOrCreateAccountType("Liability");
		AccountType equityType = getOrCreateAccountType("Equity");
		AccountType revenueType = getOrCreateAccountType("Revenue");
		AccountType expenseType = getOrCreateAccountType("Expense");
		AccountType directCost = getOrCreateAccountType("Direct Costs");

		List<Account> defaultAccounts = new ArrayList<>(18);

		// Create asset accounts
		Account accountReceivable = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_ACC_RECEIVABLE,
				AccountConstants.ACCOUNT_NAME_ACC_RECEIVABLE,
				currentAsset,
				assetCategory);
		accountReceivable.setDescription("Money owed to the business.");
		defaultAccounts.add(accountReceivable);

		Account prepaidExpense = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_PREP_EXPENSES,
				AccountConstants.ACCOUNT_NAME_PREP_EXPENSES,
				currentAsset,
				assetCategory);
		prepaidExpense.setDescription("Expenses paid in advance.");
		defaultAccounts.add(prepaidExpense);

		Account inventoryAssetAccount = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_INVENTORY,
				AccountConstants.ACCOUNT_NAME_INVENTORY,
				inventoryType,
				assetCategory);
		inventoryAssetAccount.setDescription("Account for businesses that hold and track stock.");
		defaultAccounts.add(inventoryAssetAccount);

		Account fixedAssetAccount = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_FIXED_ASSET,
				AccountConstants.ACCOUNT_NAME_FIXED_ASSET,
				fixedAssetType,
				assetCategory);
		fixedAssetAccount.setDescription("Accounts for long-term assets.");
		defaultAccounts.add(fixedAssetAccount);

		// Create liability accounts
		Account accountPayable = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_ACC_PAYABLE,
				AccountConstants.ACCOUNT_NAME_ACC_PAYABLE,
				currentLiabilityType,
				liabilityCategory);
		accountPayable.setDescription("Tracks money you owe to your suppliers.");
		defaultAccounts.add(accountPayable);

		Account loans = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_LOANS_PAYABLE,
				AccountConstants.ACCOUNT_NAME_LOANS_PAYABLE,
				liabilityType,
				liabilityCategory);
		loans.setDescription("Long-term debt.");
		defaultAccounts.add(loans);

		Account taxPayable = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_TAX_PAYABLE,
				AccountConstants.ACCOUNT_NAME_TAX_PAYABLE,
				currentLiabilityType,
				liabilityCategory);
		taxPayable.setDescription("Tracks collected taxes.");
		defaultAccounts.add(taxPayable);

		// Create equity accounts
		Account annualEarning = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_RETAINED_EARNING,
				AccountConstants.ACCOUNT_NAME_RETAINED_EARNING,
				equityType,
				equityCategory);
		annualEarning.setDescription("Profits retained in the business.");
		defaultAccounts.add(annualEarning);

		Account ownersDrawing = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_OWNER_DRAWING,
				AccountConstants.ACCOUNT_NAME_OWNER_DRAWING,
				equityType,
				equityCategory);
		ownersDrawing.setDescription("Owner withdrawals.");
		defaultAccounts.add(ownersDrawing);

		Account ownerCapital = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_OWNER_CAPITAL,
				AccountConstants.ACCOUNT_NAME_OWNER_CAPITAL,
				equityType,
				equityCategory);
		ownerCapital.setDescription("Money the owner puts into the business.");
		defaultAccounts.add(ownerCapital);

		// Create revenue accounts
		Account salesRevenueAcc = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_SALES_REVENUE,
				AccountConstants.ACCOUNT_NAME_SALES_REVENUE,
				revenueType,
				revenueCategory);
		salesRevenueAcc.setDescription("Income from core operations.");
		defaultAccounts.add(salesRevenueAcc);

		Account serviceIncomeAcc = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_SERVICE_INCOME,
				AccountConstants.ACCOUNT_NAME_SERVICE_INCOME,
				revenueType,
				revenueCategory);
		serviceIncomeAcc.setDescription("Fees for services provided.");
		defaultAccounts.add(serviceIncomeAcc);

		// Create expenses accounts
		Account officeExpenses = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_OFFICE_EXPENSES,
				AccountConstants.ACCOUNT_NAME_OFFICE_EXPENSES,
				expenseType,
				expenseCategory);
		officeExpenses.setDescription(
				"Costs that a business incurs for the day-to-day operation and maintenance of its workspace.");
		defaultAccounts.add(officeExpenses);

		Account advertisingExpenses = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_MARKETING_EXPENSES,
				AccountConstants.ACCOUNT_NAME_MARKETING_EXPENSES,
				expenseType,
				expenseCategory);
		advertisingExpenses.setDescription(
				"Costs a business incurs to promote its products, services, or brand to a target audience.");
		defaultAccounts.add(advertisingExpenses);

		Account consultingAndAccountingExpenses = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_CONSULTING_ACCOUNTING,
				AccountConstants.ACCOUNT_NAME_CONSULTING_ACCOUNTING,
				expenseType,
				expenseCategory);
		consultingAndAccountingExpenses
				.setDescription("Costs a business incurs for professional services from external experts.");
		defaultAccounts.add(consultingAndAccountingExpenses);

		Account costOfGoodsSold = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_COST_GOODS_SOLD,
				AccountConstants.ACCOUNT_NAME_COST_GOODS_SOLD,
				directCost,
				expenseCategory);
		costOfGoodsSold.setDescription("Cost of materials / production.");
		defaultAccounts.add(costOfGoodsSold);

		Account utilities = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_UTILITIES,
				AccountConstants.ACCOUNT_NAME_UTILITIES,
				expenseType,
				expenseCategory);
		utilities.setDescription("Electricity, water, etc.");
		defaultAccounts.add(utilities);

		Account travelAndEntertainment = new Account(
				org,
				AccountConstants.ACCOUNT_CODE_TRAVEL_AND_ENTERTAINMENT,
				AccountConstants.ACCOUNT_NAME_TRAVEL_AND_ENTERTAINMENT,
				expenseType,
				expenseCategory);
		travelAndEntertainment.setDescription("Business travel, meals.");
		defaultAccounts.add(travelAndEntertainment);

		accountRepository.saveAll(defaultAccounts);
	}

	private AccountCategory getCategoryOrThrow(String categoryName) {
		return accountCategoryRepository.findByNameIgnoreCase(categoryName)
				.orElseThrow(() -> new IllegalStateException("Account category not found: " + categoryName));
	}

	private AccountType getOrCreateAccountType(String typeName) {
		return accountTypeRepository.findByNameIgnoreCase(typeName)
				.orElseGet(() -> accountTypeRepository.save(new AccountType(typeName, "")));
	}

	/**
	 * This method will filter account objects by organization id.
	 * 
	 * @param organizationId - accepts {@linkplain java.util.UUID} object type.
	 * @return - {@linkplain java.util.Set} that holds
	 *         {@linkplain AccountByOrganizationResponse} objects.
	 */
	public Set<AccountByOrganizationResponse> getAccountsByOrganization(@NotNull UUID organizationId) {
		Set<Account> getOrganizationAccounts = accountRepository.findAccountByOrganizationId(organizationId);
		return accountMapper.toAccountByOrganizationResponses(getOrganizationAccounts);
	}
}