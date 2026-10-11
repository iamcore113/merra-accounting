package org.merra.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.merra.dto.AccountCodeExistsResponse;
import org.merra.entities.Account;
import org.merra.entities.AccountCategory;
import org.merra.entities.AccountType;
import org.merra.entities.Organization;
import org.merra.mapper.AccountMapper;
import org.merra.repositories.AccountCategoryRepository;
import org.merra.repositories.AccountRepository;
import org.merra.repositories.AccountTypeRepository;
import org.merra.utilities.AccountConstants;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

	@Mock
	private AccountMapper accountMapper;

	@Mock
	private AccountCategoryRepository accountCategoryRepository;

	@Mock
	private AccountRepository accountRepository;

	@Mock
	private AccountTypeRepository accountTypeRepository;

	@InjectMocks
	private AccountService accountService;

	@Captor
	private ArgumentCaptor<List<Account>> accountsCaptor;

	private Organization organization;
	private AccountCategory assetCategory;
	private AccountCategory liabilityCategory;
	private AccountCategory revenueCategory;
	private AccountCategory equityCategory;
	private AccountCategory expenseCategory;

	@BeforeEach
	void setUp() {
		organization = new Organization();
		organization.setDisplayName("Acme Corp");

		assetCategory = new AccountCategory(AccountConstants.ACC_CATEGORY_ASSET);
		liabilityCategory = new AccountCategory(AccountConstants.ACC_CATEGORY_LIABILITY);
		revenueCategory = new AccountCategory(AccountConstants.ACC_CATEGORY_REVENUE);
		equityCategory = new AccountCategory(AccountConstants.ACC_CATEGORY_EQUITY);
		expenseCategory = new AccountCategory(AccountConstants.ACC_CATEGORY_EXPENSE);
	}

	@Test
	@DisplayName("createDefaultAccounts creates and persists all 18 standard accounts with active status and descriptions")
	void createDefaultAccounts_success() {
		when(accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_ASSET))
				.thenReturn(Optional.of(assetCategory));
		when(accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_LIABILITY))
				.thenReturn(Optional.of(liabilityCategory));
		when(accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_REVENUE))
				.thenReturn(Optional.of(revenueCategory));
		when(accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_EQUITY))
				.thenReturn(Optional.of(equityCategory));
		when(accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_EXPENSE))
				.thenReturn(Optional.of(expenseCategory));

		when(accountTypeRepository.findByNameIgnoreCase(anyString()))
				.thenAnswer(invocation -> {
					String name = invocation.getArgument(0);
					return Optional.of(new AccountType(name, ""));
				});

		accountService.createDefaultAccounts(organization);

		verify(accountRepository).saveAll(accountsCaptor.capture());
		List<Account> createdAccounts = accountsCaptor.getValue();

		assertThat(createdAccounts).hasSize(18);

		for (Account account : createdAccounts) {
			assertThat(account.getOrganization()).isEqualTo(organization);
			assertThat(account.getStatus()).isEqualTo(AccountConstants.ACCOUNT_STATUS_ACTIVE);
			assertThat(account.getDescription()).isNotBlank();
			assertThat(account.getCode()).isNotBlank();
			assertThat(account.getAccountName()).isNotBlank();
			assertThat(account.getCategory()).isNotNull();
			assertThat(account.getAccountType()).isNotNull();
		}

		List<String> codes = createdAccounts.stream().map(Account::getCode).toList();
		assertThat(codes).containsExactlyInAnyOrder(
				AccountConstants.ACC_CODE_ACC_RECEIVABLE,
				AccountConstants.ACC_CODE_PREP_EXPENSES,
				AccountConstants.ACC_CODE_INVENTORY,
				AccountConstants.ACC_CODE_FIXED_ASSET,
				AccountConstants.ACC_CODE_ACC_PAYABLE,
				AccountConstants.ACC_CODE_LOANS_PAYABLE,
				AccountConstants.ACC_CODE_TAX_PAYABLE,
				AccountConstants.ACC_CODE_RETAINED_EARNING,
				AccountConstants.ACC_CODE_OWNER_DRAWING,
				AccountConstants.ACC_CODE_OWNER_CAPITAL,
				AccountConstants.ACC_CODE_SALES_REVENUE,
				AccountConstants.ACC_CODE_SERVICE_INCOME,
				AccountConstants.ACC_CODE_OFFICE_EXPENSES,
				AccountConstants.ACC_CODE_MARKETING_EXPENSES,
				AccountConstants.ACC_CODE_CONSULTING_ACCOUNTING,
				AccountConstants.ACC_CODE_COST_GOODS_SOLD,
				AccountConstants.ACC_CODE_UTILITIES,
				AccountConstants.ACC_CODE_TRAVEL_AND_ENTERTAINMENT);
	}

	@Test
	@DisplayName("createDefaultAccounts throws IllegalStateException when required category is missing")
	void createDefaultAccounts_missingCategory_throwsException() {
		when(accountCategoryRepository.findByNameIgnoreCase(AccountConstants.ACC_CATEGORY_ASSET))
				.thenReturn(Optional.empty());

		assertThatThrownBy(() -> accountService.createDefaultAccounts(organization))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("Account category not found: ASSET");
	}

	@Test
	@DisplayName("checkIfCodeExists scoped by organization delegates to organization-aware repository query")
	void checkIfCodeExists_scopedByOrganization() {
		UUID orgId = UUID.randomUUID();
		when(accountRepository.existsByCodeIgnoreCaseAndOrganizationId("100", orgId))
				.thenReturn(true);
		when(accountRepository.existsByCodeIgnoreCaseAndOrganizationId("999", orgId))
				.thenReturn(false);

		AccountCodeExistsResponse existing = accountService.checkIfCodeExists("100", orgId);
		assertThat(existing.code()).isEqualTo("100");
		assertThat(existing.exists()).isTrue();

		AccountCodeExistsResponse nonExisting = accountService.checkIfCodeExists("999", orgId);
		assertThat(nonExisting.code()).isEqualTo("999");
		assertThat(nonExisting.exists()).isFalse();
	}
}

