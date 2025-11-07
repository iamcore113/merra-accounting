package org.merra.services;

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

import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;

// This class will handle the chart of accounts
@Service
public class AccountService {
	private final AccountMapper accountMapper;
	private final AccountCategoryRepository accountCategoryRepository;
	private final AccountRepository accountRepository;
	private final AccountTypeRepository accountTypeRepository;

	public AccountService(
			AccountMapper accountMapper,
			AccountCategoryRepository accountCategoryRepository,
			AccountRepository accountRepository,
			AccountTypeRepository accountTypeRepository
	) {
		this.accountMapper = accountMapper;
		this.accountCategoryRepository = accountCategoryRepository;
		this.accountRepository = accountRepository;
		this.accountTypeRepository = accountTypeRepository;
	}
	
	public AccountResponse createAccount() {
		return null;
	}
	
	/**
	 * This will check if account code already exists or not
	 * @param code - accepts {@linkplain java.util.String} object type.
	 * @return - {@linkplain AccountCodeExistsResponse} object type.
	 */
	public AccountCodeExistsResponse checkIfCodeExists(String code) {
		boolean checkIfExists = accountRepository.existsByCodeIgnoreCase(code);
		
		return new AccountCodeExistsResponse(code, checkIfExists);
	}
	
	
	@Transactional
	public void createDefaultAccounts(@NotNull Organization org) {
		
		// Account categories
		AccountCategory ASSET_CAT = accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_ASSET).get();
		AccountCategory LIABILITY_CAT = accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_LIABILITY).get();
		AccountCategory REVENUE_CAT = accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_REVENUE).get();
		AccountCategory EQUITY_CAT = accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_EQUITY).get();
		AccountCategory EXPENSE_CAT = accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_EXPENSE).get();
		
		// Create asset accounts
		// A debit balance account
		AccountType currentAsset = accountTypeRepository.save(new AccountType("Current Asset", ""));
		Account accountReceivable = new Account(
				org,
				AccountConstants.ACC_CODE_ACC_RECEIVABLE,
				AccountConstants.ACC_NAME_ACC_RECEIVABLE,
				currentAsset,
				ASSET_CAT
		);
		accountReceivable.setDescription("Money owed to the busines.");
		
		Account preparedExpense = new Account(
				org,
				AccountConstants.ACC_CODE_PREP_EXPENSES,
				AccountConstants.ACC_NAME_PREP_EXPENSES,
				currentAsset,
				ASSET_CAT
		);
		preparedExpense.setDescription("Expenses paid in advance.");
		
		AccountType inventoryType = accountTypeRepository.save(new AccountType("Inventory", ""));
		Account inventoryAssetAccount = new Account(
				org,
				AccountConstants.ACC_CODE_INVENTORY,
				AccountConstants.ACC_NAME_INVENTORY,
				inventoryType,
				ASSET_CAT
		);
		inventoryAssetAccount.setDescription("Account for businesses that hold and track stock.");
		
		AccountType fixedAssetType = accountTypeRepository.save(new AccountType("Fixed Assets", ""));
		Account fixedAssetAccount = new Account(org, AccountConstants.ACC_CODE_FIXED_ASSET, "Fixed Asset", fixedAssetType, ASSET_CAT);
		fixedAssetAccount.setDescription("Accounts for long-term assets.");
		
		accountRepository.saveAll(List.of(accountReceivable, preparedExpense, inventoryAssetAccount, fixedAssetAccount));
		
		// Create liability accounts
		// current liabilities are short-term obligations
		AccountType currentLiabilityType = accountTypeRepository.save(new AccountType("Current Liability", ""));
		Account accountPayable = new Account(
				org,
				AccountConstants.ACC_CODE_ACC_PAYABLE,
				AccountConstants.ACC_NAME_ACC_PAYABLE,
				currentLiabilityType,
				LIABILITY_CAT
		);
		accountPayable.setDescription("Tracks money you owe to your suppliers.");
		
		AccountType liabilityType = accountTypeRepository.save(new AccountType("Liability", ""));
		Account loans = new Account(
				org,
				AccountConstants.ACC_CODE_LOANS_PAYABLE,
				AccountConstants.ACC_NAME_LOANS_PAYABLE,
				liabilityType,
				LIABILITY_CAT
		);
		loans.setDescription("Long-term debt.");
		
		Account taxPayable = new Account(
				org,
				AccountConstants.ACC_CODE_TAX_PAYABLE,
				AccountConstants.ACC_NAME_TAX_PAYABLE,
				currentLiabilityType,
				LIABILITY_CAT
				);
		taxPayable.setDescription("Tracks collected taxes.");
		
		accountRepository.saveAll(List.of(accountPayable, loans, taxPayable));
		
		// Create Equity accounts
		AccountType equityType = accountTypeRepository.save(new AccountType("Equity", ""));
		Account annualEarning = new Account(
				org,
				AccountConstants.ACC_CODE_RETAINED_EARNING,
				AccountConstants.ACC_NAME_RETAINED_EARNING,
				equityType,
				EQUITY_CAT
		);
		annualEarning.setDescription("Profits retained in the busines.");
		
		// This is the money (or assets) the owner takes out of the business for personal use e.g. money withdrawal.
		Account ownersDrawing = new Account(
				org,
				AccountConstants.ACC_CODE_OWNER_DRAWING,
				AccountConstants.ACC_NAME_OWNER_DRAWING,
				equityType,
				EQUITY_CAT
		);
		ownersDrawing.setDescription("Owner withdrawals.");
		
		Account ownerCapital = new Account(
				org,
				AccountConstants.ACC_CODE_OWNER_CAPITAL,
				AccountConstants.ACC_NAME_OWNER_CAPITAL,
				equityType,
				EQUITY_CAT
		);
		ownerCapital.setDescription("Money the owner puts into the business.");
		
		accountRepository.saveAll(List.of(annualEarning, ownersDrawing, ownerCapital));
		
		// Create revenue accounts
		AccountType revenueType = accountTypeRepository.save(new AccountType("Revenue", ""));
		Account salesRevenueAcc = new Account(
				org,
				AccountConstants.ACC_CODE_SALES_REVENUE,
				AccountConstants.ACC_NAME_SALES_REVENUE,
				revenueType,
				REVENUE_CAT
		);
		salesRevenueAcc.setDescription("Income from core operations.");
		
		Account serviceIncomeAcc = new Account(
				org,
				AccountConstants.ACC_CODE_SERVICE_INCOME,
				AccountConstants.ACC_NAME_SERVICE_INCOME,
				revenueType,
				REVENUE_CAT
		);
		serviceIncomeAcc.setDescription("Fees for services provided.");
		
		accountRepository.saveAll(List.of(salesRevenueAcc, serviceIncomeAcc));
		
		// Create expenses accounts
		AccountType expenseType = accountTypeRepository.save(new AccountType("Expense", ""));
		Account officeExpenses = new Account(
				org,
				AccountConstants.ACC_CODE_OFFICE_EXPENSES,
				AccountConstants.ACC_NAME_OFFICE_EXPENSES,
				expenseType,
				EXPENSE_CAT
		);
		officeExpenses.setDescription("Costs that a business incurs for the day-to-day operation and maintenance of its workspace.");
		
		Account advertisingExpenses = new Account(
				org,
				AccountConstants.ACC_CODE_MARKETING_EXPENSES,
				AccountConstants.ACC_NAME_MARKETING_EXPENSES,
				expenseType,
				EXPENSE_CAT
		);
		advertisingExpenses.setDescription("Costs a business incurs to promote its products, services, or brand to a target audience.");
		
		Account consultingAndAccountingExpenses = new Account(
				org,
				AccountConstants.ACC_CODE_CONSULTING_ACCOUNTING,
				AccountConstants.ACC_NAME_CONSULTING_ACCOUNTING,
				expenseType,
				EXPENSE_CAT
		);
		consultingAndAccountingExpenses.setDescription("Costs a business incurs for professional services from external experts.");
		
		AccountType directCost = accountTypeRepository.save(new AccountType("Direct Costs", ""));
		Account costOfGoodsSold = new Account(
				org,
				AccountConstants.ACC_CODE_COST_GOODS_SOLD,
				AccountConstants.ACC_NAME_COST_GOODS_SOLD,
				directCost,
				EXPENSE_CAT
		);
		costOfGoodsSold.setDescription("Cost of materials / production.");
		
		Account utilities = new Account(
				org,
				AccountConstants.ACC_CODE_UTILITIES,
				AccountConstants.ACC_NAME_UTILITIES,
				expenseType,
				EXPENSE_CAT
		);
		utilities.setDescription("Electricity, water, etc.");
		
		Account travelAndEntertainment = new Account(
				org,
				AccountConstants.ACC_CODE_TRAVEL_AND_ENTERTAINMENT,
				AccountConstants.ACC_NAME_TRAVEL_AND_ENTERTAINMENT,
				expenseType,
				EXPENSE_CAT
		);
		travelAndEntertainment.setDescription("Business travel, meals.");
		
		accountRepository.saveAll(List.of(
				officeExpenses, advertisingExpenses,
				consultingAndAccountingExpenses, costOfGoodsSold,
				utilities, travelAndEntertainment
		));
	}
	
	/**
	 * This method will filter account objects by organization id.
	 * @param organizationId - accepts {@linkplain java.util.UUID} object type.
	 * @return - {@linkplain java.util.Set} that holds {@linkplain AccountByOrganizationResponse} objects.
	 */
	public Set<AccountByOrganizationResponse> getAccountsByOrganization(@NotNull UUID organizationId) {
		Set<Account> getOrganizationAccounts = accountRepository.findAccountByOrganizationId(organizationId);
		return accountMapper.toAccountByOrganizationResponses(getOrganizationAccounts);
	}
}