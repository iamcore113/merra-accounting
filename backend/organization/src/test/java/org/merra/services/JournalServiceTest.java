package org.merra.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.merra.dto.JournalResponse;
import org.merra.entities.Account;
import org.merra.entities.AccountCategory;
import org.merra.entities.AccountType;
import org.merra.entities.Contact;
import org.merra.entities.Invoice;
import org.merra.entities.InvoiceType;
import org.merra.entities.Journal;
import org.merra.entities.JournalLine;
import org.merra.entities.LineItem;
import org.merra.entities.Organization;
import org.merra.repositories.AccountRepository;
import org.merra.repositories.JournalRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.repositories.projections.AccountLookup;
import org.merra.utilities.AccountConstants;
import org.merra.utilities.InvoiceConstants;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.MockMakers;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JournalServiceTest {

	static {
		// Ensure projection interface is loaded before Mockito inline agent transforms AccountRepository on Java 25
		@SuppressWarnings("unused")
		Class<?> preload = AccountLookup.class;
	}

	@Mock
	private AccountRepository accountRepository;

	@Mock
	private JournalRepository journalRepository;

	@Mock
	private UserWorkspaceStateRepository userWorkspaceStateRepository;

	private JournalService journalService;

	@Captor
	private ArgumentCaptor<Journal> journalCaptor;

	private Organization organization;
	private UUID orgId;
	private Account accReceivable;
	private Account accPayable;
	private Account accSalesRevenue;
	private Account accOfficeExpense;
	private Account accTaxPayable;

	@BeforeEach
	void setUp() {
		journalService = new JournalService(accountRepository, journalRepository, userWorkspaceStateRepository);

		orgId = UUID.randomUUID();
		organization = new Organization();
		organization.setId(orgId);
		organization.setDisplayName("Merra Test Corp");

		AccountCategory assetCat = new AccountCategory(AccountConstants.ACCOUNT_CATEGORY_ASSET);
		AccountCategory liabilityCat = new AccountCategory(AccountConstants.ACCOUNT_CATEGORY_LIABILITY);
		AccountCategory revenueCat = new AccountCategory(AccountConstants.ACCOUNT_CATEGORY_REVENUE);
		AccountCategory expenseCat = new AccountCategory(AccountConstants.ACCOUNT_CATEGORY_EXPENSE);

		accReceivable = new Account(
				organization,
				AccountConstants.ACCOUNT_CODE_ACC_RECEIVABLE,
				AccountConstants.ACCOUNT_NAME_ACC_RECEIVABLE,
				new AccountType("Current Asset", ""),
				assetCat);
		accReceivable.setDescription("Money owed to the business.");

		accPayable = new Account(
				organization,
				AccountConstants.ACCOUNT_CODE_ACC_PAYABLE,
				AccountConstants.ACCOUNT_NAME_ACC_PAYABLE,
				new AccountType("Current Liability", ""),
				liabilityCat);
		accPayable.setDescription("Tracks money you owe to your suppliers.");

		accSalesRevenue = new Account(
				organization,
				AccountConstants.ACCOUNT_CODE_SALES_REVENUE,
				AccountConstants.ACCOUNT_NAME_SALES_REVENUE,
				new AccountType("Revenue", ""),
				revenueCat);
		accSalesRevenue.setDescription("Income from core operations.");

		accOfficeExpense = new Account(
				organization,
				AccountConstants.ACCOUNT_CODE_OFFICE_EXPENSES,
				AccountConstants.ACCOUNT_NAME_OFFICE_EXPENSES,
				new AccountType("Expense", ""),
				expenseCat);
		accOfficeExpense.setDescription("Office expenses.");

		accTaxPayable = new Account(
				organization,
				AccountConstants.ACCOUNT_CODE_TAX_PAYABLE,
				AccountConstants.ACCOUNT_NAME_TAX_PAYABLE,
				new AccountType("Current Liability", ""),
				liabilityCat);
		accTaxPayable.setDescription("Tracks collected taxes.");
	}

	@Test
	@DisplayName("Customer invoice creates balanced journal entry debiting Accounts Receivable and crediting Sales Revenue & Tax Payable")
	void entry_customerInvoiceWithTax_recordsBalancedJournal() {
		Invoice invoice = new Invoice();
		invoice.setOrganization(organization);
		invoice.setInvoiceNumber("INV-2026-0001");
		invoice.setDate(LocalDate.of(2026, 11, 9));
		invoice.setType(new InvoiceType(InvoiceConstants.INVOICE_TYPE_CUSTOMER_INVOICE));
		invoice.setContact(new Contact("Acme Customer", organization));
		invoice.setLineAmountTypes(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE);
		invoice.setSubTotal(5000.00);
		invoice.setTotalTax(new BigDecimal("750.00"));
		invoice.setGrandTotal(new BigDecimal("5750.00"));

		LineItem item1 = new LineItem(
				invoice,
				"Web Design Package",
				UUID.randomUUID().toString(),
				1.0,
				3000.00,
				AccountConstants.ACCOUNT_CODE_SALES_REVENUE,
				3000.00,
				"OUTPUT",
				new BigDecimal("450.00"),
				0,
				new BigDecimal("3450.00"));

		LineItem item2 = new LineItem(
				invoice,
				"SEO Setup",
				UUID.randomUUID().toString(),
				1.0,
				2000.00,
				AccountConstants.ACCOUNT_CODE_SALES_REVENUE,
				2000.00,
				"OUTPUT",
				new BigDecimal("300.00"),
				0,
				new BigDecimal("2300.00"));

		Set<LineItem> lineItems = new LinkedHashSet<>(List.of(item1, item2));

		when(accountRepository.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_ACC_RECEIVABLE, orgId))
				.thenReturn(Optional.of(accReceivable));
		when(accountRepository.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_SALES_REVENUE, orgId))
				.thenReturn(Optional.of(accSalesRevenue));
		when(accountRepository.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_TAX_PAYABLE, orgId))
				.thenReturn(Optional.of(accTaxPayable));

		journalService.entry(lineItems, organization, invoice);

		verify(journalRepository).save(journalCaptor.capture());
		Journal savedJournal = journalCaptor.getValue();

		assertThat(savedJournal.getOrganization()).isEqualTo(organization);
		assertThat(savedJournal.getInvoice()).isEqualTo(invoice);
		assertThat(savedJournal.getJournalDate()).isEqualTo(LocalDate.of(2026, 11, 9));
		assertThat(savedJournal.getNarration()).contains("INV-2026-0001");
		assertThat(savedJournal.getTotal().getTotalDebit()).isEqualByComparingTo("5750.00");
		assertThat(savedJournal.getTotal().getTotalCredit()).isEqualByComparingTo("5750.00");
		assertThat(savedJournal.getJournalLines()).hasSize(3);

		JournalLine arLine = savedJournal.getJournalLines().stream()
				.filter(l -> "100".equals(l.getAccountDetails().getAccountCode()))
				.findFirst()
				.orElseThrow();
		assertThat(arLine.getDebit()).isEqualByComparingTo("5750.00");
		assertThat(arLine.getCredit()).isNull();

		JournalLine salesLine = savedJournal.getJournalLines().stream()
				.filter(l -> "400".equals(l.getAccountDetails().getAccountCode()))
				.findFirst()
				.orElseThrow();
		assertThat(salesLine.getCredit()).isEqualByComparingTo("5000.00");
		assertThat(salesLine.getDebit()).isNull();

		JournalLine taxLine = savedJournal.getJournalLines().stream()
				.filter(l -> "230".equals(l.getAccountDetails().getAccountCode()))
				.findFirst()
				.orElseThrow();
		assertThat(taxLine.getCredit()).isEqualByComparingTo("750.00");
		assertThat(taxLine.getDebit()).isNull();
	}

	@Test
	@DisplayName("Supplier invoice creates balanced journal entry crediting Accounts Payable and debiting Office Expenses & Tax Payable")
	void entry_supplierInvoiceWithTax_recordsBalancedJournal() {
		Invoice invoice = new Invoice();
		invoice.setOrganization(organization);
		invoice.setInvoiceNumber("BILL-1099");
		invoice.setDate(LocalDate.of(2026, 11, 9));
		invoice.setType(new InvoiceType(InvoiceConstants.INVOICE_TYPE_SUPPLIER_INVOICE));
		invoice.setContact(new Contact("Office Depot Supplier", organization));
		invoice.setLineAmountTypes(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE);
		invoice.setSubTotal(1000.00);
		invoice.setTotalTax(new BigDecimal("150.00"));
		invoice.setGrandTotal(new BigDecimal("1150.00"));

		LineItem item = new LineItem(
				invoice,
				"Office Chairs",
				UUID.randomUUID().toString(),
				2.0,
				500.00,
				AccountConstants.ACCOUNT_CODE_OFFICE_EXPENSES,
				1000.00,
				"INPUT",
				new BigDecimal("150.00"),
				0,
				new BigDecimal("1150.00"));

		Set<LineItem> lineItems = Set.of(item);

		when(accountRepository.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_ACC_PAYABLE, orgId))
				.thenReturn(Optional.of(accPayable));
		when(accountRepository.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_OFFICE_EXPENSES, orgId))
				.thenReturn(Optional.of(accOfficeExpense));
		when(accountRepository.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_TAX_PAYABLE, orgId))
				.thenReturn(Optional.of(accTaxPayable));

		journalService.entry(lineItems, organization, invoice);

		verify(journalRepository).save(journalCaptor.capture());
		Journal savedJournal = journalCaptor.getValue();

		assertThat(savedJournal.getTotal().getTotalDebit()).isEqualByComparingTo("1150.00");
		assertThat(savedJournal.getTotal().getTotalCredit()).isEqualByComparingTo("1150.00");
		assertThat(savedJournal.getJournalLines()).hasSize(3);

		JournalLine apLine = savedJournal.getJournalLines().stream()
				.filter(l -> "200".equals(l.getAccountDetails().getAccountCode()))
				.findFirst()
				.orElseThrow();
		assertThat(apLine.getCredit()).isEqualByComparingTo("1150.00");
		assertThat(apLine.getDebit()).isNull();

		JournalLine expLine = savedJournal.getJournalLines().stream()
				.filter(l -> "500".equals(l.getAccountDetails().getAccountCode()))
				.findFirst()
				.orElseThrow();
		assertThat(expLine.getDebit()).isEqualByComparingTo("1000.00");
		assertThat(expLine.getCredit()).isNull();

		JournalLine taxLine = savedJournal.getJournalLines().stream()
				.filter(l -> "230".equals(l.getAccountDetails().getAccountCode()))
				.findFirst()
				.orElseThrow();
		assertThat(taxLine.getDebit()).isEqualByComparingTo("150.00");
		assertThat(taxLine.getCredit()).isNull();
	}

	@Test
	@DisplayName("getAllJournalsByCurrentOrganization maps journal and lines to read-only JournalResponse")
	void getAllJournalsByCurrentOrganization_returnsMappedDtos() {
		Invoice invoice = new Invoice();
		invoice.setInvoiceNumber("INV-2026-0005");
		invoice.setType(new InvoiceType(InvoiceConstants.INVOICE_TYPE_CUSTOMER_INVOICE));
		invoice.setContact(new Contact("Stark Industries", organization));
		invoice.setStatus("AUTHORISED");

		Journal journal = new Journal();
		journal.setJournalId(UUID.randomUUID());
		journal.setOrganization(organization);
		journal.setInvoice(invoice);
		journal.setJournalDate(LocalDate.of(2026, 11, 9));
		journal.setNarration("Customer Invoice INV-2026-0005 — Stark Industries");
		journal.setTotal(new org.merra.entities.embedded.JournalTotalAmountEntryEmb(
				new BigDecimal("5000.00"),
				new BigDecimal("5000.00")));
		journal.setJournalLines(List.of());

		when(userWorkspaceStateRepository.findCurrentOrganizationByPrincipal())
				.thenReturn(Optional.of(organization));
		when(journalRepository.findAllByOrganizationIdOrderByDateDesc(orgId))
				.thenReturn(List.of(journal));

		List<JournalResponse> responses = journalService.getAllJournalsByCurrentOrganization();

		assertThat(responses).hasSize(1);
		JournalResponse res = responses.get(0);
		assertThat(res.invoiceNumber()).isEqualTo("INV-2026-0005");
		assertThat(res.contactName()).isEqualTo("Stark Industries");
		assertThat(res.totalDebit()).isEqualByComparingTo("5000.00");
		assertThat(res.totalCredit()).isEqualByComparingTo("5000.00");
	}
}
