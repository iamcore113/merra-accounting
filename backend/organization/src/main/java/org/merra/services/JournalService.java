package org.merra.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.merra.dto.JournalResponse;
import org.merra.entities.Account;
import org.merra.entities.Contact;
import org.merra.entities.Invoice;
import org.merra.entities.Journal;
import org.merra.entities.JournalLine;
import org.merra.entities.LineItem;
import org.merra.entities.Organization;
import org.merra.entities.embedded.AccountDetailEmb;
import org.merra.entities.embedded.JournalTotalAmountEntryEmb;
import org.merra.entities.embedded.LineItemByAccountCodeEmb;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.AccountRepository;
import org.merra.repositories.JournalRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.utilities.AccountConstants;
import org.merra.utilities.InvoiceConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Service
@Validated
public class JournalService {
	private final AccountRepository accountRepository;
	private final JournalRepository journalRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;

	public JournalService(
			AccountRepository accountRepository,
			JournalRepository journalRepository) {
		this(accountRepository, journalRepository, null);
	}

	@Autowired
	public JournalService(
			AccountRepository accountRepository,
			JournalRepository journalRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository) {
		this.accountRepository = accountRepository;
		this.journalRepository = journalRepository;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
	}

	/**
	 * Records a balanced double-entry accounting journal for an authorised invoice.
	 *
	 * @param lineItems       The set of invoice line items.
	 * @param org             The organization owning the transaction.
	 * @param findInvoiceById The authorised invoice transaction.
	 */
	@Transactional
	public void entry(
			@NotEmpty Set<LineItem> lineItems,
			Organization org,
			@NotNull Invoice findInvoiceById) {
		if (findInvoiceById.getInvoiceId() != null && journalRepository.existsByInvoiceId(findInvoiceById.getInvoiceId())) {
			return;
		}

		List<LineItemByAccountCodeEmb> lineItemsByAccountCode = LineItem.getLineItemByAccountCode(lineItems);

		Journal createJournal = new Journal();
		createJournal.setOrganization(org);
		createJournal.setInvoice(findInvoiceById);
		createJournal.setJournalDate(findInvoiceById.getDate() != null ? findInvoiceById.getDate() : LocalDate.now());

		String invNum = findInvoiceById.getInvoiceNumber() != null ? findInvoiceById.getInvoiceNumber() : "Invoice";
		String contactName = findInvoiceById.getContact() != null && findInvoiceById.getContact().getName() != null
				? findInvoiceById.getContact().getName()
				: "Contact";

		String typeRaw = findInvoiceById.getType() != null && findInvoiceById.getType().getType() != null
				? findInvoiceById.getType().getType().toUpperCase()
				: InvoiceConstants.INVOICE_TYPE_CUSTOMER_INVOICE;

		boolean isSupplierInvoice = typeRaw.contains("SUPPLIER")
				|| typeRaw.contains("PAYABLE")
				|| typeRaw.contains("BILL");

		String narrationPrefix = isSupplierInvoice ? "Supplier Invoice " : "Customer Invoice ";
		createJournal.setNarration(narrationPrefix + invNum + " — " + contactName);

		List<JournalLine> journalLines = new ArrayList<>();

		BigDecimal grandTotal = findInvoiceById.getGrandTotal() != null
				? findInvoiceById.getGrandTotal().setScale(2, RoundingMode.HALF_UP)
				: BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

		// 1. Control Account Line (Accounts Receivable for Customer Invoice, Accounts Payable for Supplier Invoice)
		if (isSupplierInvoice) {
			Account getAccPayable = accountRepository
					.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_ACC_PAYABLE, org.getId())
					.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ACCOUNT));

			JournalLine payableLine = buildJournalLineWithEntryType(
					createJournal,
					getAccPayable,
					grandTotal,
					AccountConstants.ACCOUNT_ENTRY_CREDIT,
					"Accounts Payable — " + invNum);
			journalLines.add(payableLine);
		} else {
			Account getAccReceivable = accountRepository
					.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_ACC_RECEIVABLE, org.getId())
					.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ACCOUNT));

			JournalLine receivableLine = buildJournalLineWithEntryType(
					createJournal,
					getAccReceivable,
					grandTotal,
					AccountConstants.ACCOUNT_ENTRY_DEBIT,
					"Accounts Receivable — " + invNum);
			journalLines.add(receivableLine);
		}

		// 2. Line Item Accounts (Revenue / Expense / Asset lines grouped by account code)
		String lineEntryType = isSupplierInvoice
				? AccountConstants.ACCOUNT_ENTRY_DEBIT
				: AccountConstants.ACCOUNT_ENTRY_CREDIT;

		for (LineItemByAccountCodeEmb lt : lineItemsByAccountCode) {
			Account account = accountRepository
					.findByAccountCodeAndOrganizationId(lt.getAccountCode(), org.getId())
					.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ACCOUNT));

			double sumLineAmount = lt.getLineItems().stream()
					.mapToDouble(item -> item.getLineAmount() != null ? item.getLineAmount() : 0.0)
					.sum();

			BigDecimal netAccountAmount = BigDecimal.valueOf(sumLineAmount).setScale(2, RoundingMode.HALF_UP);

			String lineDescription = lt.getLineItems().stream()
					.map(LineItem::getDescription)
					.filter(d -> d != null && !d.isBlank())
					.distinct()
					.reduce((a, b) -> a + "; " + b)
					.orElse(account.getDescription());

			journalLines.add(buildJournalLineWithEntryType(
					createJournal,
					account,
					netAccountAmount,
					lineEntryType,
					lineDescription));
		}

		// 3. Tax Account Line (if applicable and totalTax > 0)
		BigDecimal totalTax = findInvoiceById.getTotalTax() != null
				? findInvoiceById.getTotalTax().setScale(2, RoundingMode.HALF_UP)
				: BigDecimal.ZERO;

		boolean hasTax = !InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_NOTAX
				.equalsIgnoreCase(findInvoiceById.getLineAmountTypes())
				&& totalTax.compareTo(BigDecimal.ZERO) > 0;

		if (hasTax) {
			Account getTaxPayableAcc = accountRepository
					.findByAccountCodeAndOrganizationId(AccountConstants.ACCOUNT_CODE_TAX_PAYABLE, org.getId())
					.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ACCOUNT));

			String taxEntryType = isSupplierInvoice
					? AccountConstants.ACCOUNT_ENTRY_DEBIT
					: AccountConstants.ACCOUNT_ENTRY_CREDIT;

			JournalLine taxJournalLine = buildJournalLineWithEntryType(
					createJournal,
					getTaxPayableAcc,
					totalTax,
					taxEntryType,
					"Tax on " + invNum);
			journalLines.add(taxJournalLine);
		}

		createJournal.setJournalLines(journalLines);

		// Total debit amount
		BigDecimal totalDebit = journalLines.stream()
				.filter(td -> td.getDebit() != null)
				.map(JournalLine::getDebit)
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(2, RoundingMode.HALF_UP);

		// Total credit amount
		BigDecimal totalCredit = journalLines.stream()
				.filter(tc -> tc.getCredit() != null)
				.map(JournalLine::getCredit)
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(2, RoundingMode.HALF_UP);

		JournalTotalAmountEntryEmb total = new JournalTotalAmountEntryEmb(totalDebit, totalCredit);
		createJournal.setTotal(total);

		journalRepository.save(createJournal);
	}

	/**
	 * Retrieves all journal entries recorded for the current organization (read-only).
	 *
	 * @return List of {@link JournalResponse}
	 */
	public List<JournalResponse> getAllJournalsByCurrentOrganization() {
		Organization currentOrg = getCurrentOrganizationOrThrow();
		List<Journal> journals = journalRepository.findAllByOrganizationIdOrderByDateDesc(currentOrg.getId());
		return journals.stream()
				.map(this::toJournalResponse)
				.toList();
	}

	/**
	 * Retrieves a single journal entry by ID for the current organization (read-only).
	 *
	 * @param journalId The journal UUID
	 * @return {@link JournalResponse}
	 */
	public JournalResponse getJournalById(@NotNull UUID journalId) {
		Organization currentOrg = getCurrentOrganizationOrThrow();
		Journal journal = journalRepository.findByJournalIdAndOrganizationId(journalId, currentOrg.getId())
				.orElseThrow(() -> new EntityNotFoundException("Journal entry not found."));
		return toJournalResponse(journal);
	}

	/**
	 * Retrieves all journal entries associated with a specific invoice for the current organization (read-only).
	 *
	 * @param invoiceId The invoice UUID
	 * @return List of {@link JournalResponse}
	 */
	public List<JournalResponse> getJournalsByInvoiceId(@NotNull UUID invoiceId) {
		Organization currentOrg = getCurrentOrganizationOrThrow();
		List<Journal> journals = journalRepository.findByInvoiceIdAndOrganizationId(invoiceId, currentOrg.getId());
		return journals.stream()
				.map(this::toJournalResponse)
				.toList();
	}

	private Organization getCurrentOrganizationOrThrow() {
		if (userWorkspaceStateRepository == null) {
			throw new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION);
		}
		return userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
	}

	private JournalResponse toJournalResponse(Journal journal) {
		Invoice inv = journal.getInvoice();
		UUID invoiceId = inv != null ? inv.getInvoiceId() : null;
		String invoiceNumber = inv != null ? inv.getInvoiceNumber() : null;
		String invoiceStatus = inv != null ? inv.getStatus() : null;
		String reference = inv != null ? inv.getReference() : null;

		Contact contact = inv != null ? inv.getContact() : null;
		String contactName = contact != null ? contact.getName() : null;

		String typeRaw = inv != null && inv.getType() != null && inv.getType().getType() != null
				? inv.getType().getType().toUpperCase()
				: "";
		String invoiceType = (typeRaw.contains("SUPPLIER") || typeRaw.contains("PAYABLE") || typeRaw.contains("BILL"))
				? "SUPPLIER"
				: (inv != null ? "CUSTOMER" : null);
		String invoiceTypeName = "SUPPLIER".equals(invoiceType)
				? "Supplier Invoice"
				: ("CUSTOMER".equals(invoiceType) ? "Customer Invoice" : "Invoice");

		BigDecimal totalDebit = journal.getTotal() != null && journal.getTotal().getTotalDebit() != null
				? journal.getTotal().getTotalDebit()
				: BigDecimal.ZERO;
		BigDecimal totalCredit = journal.getTotal() != null && journal.getTotal().getTotalCredit() != null
				? journal.getTotal().getTotalCredit()
				: BigDecimal.ZERO;

		List<JournalResponse.JournalLineItem> lineDtos = journal.getJournalLines() == null
				? Collections.emptyList()
				: journal.getJournalLines().stream()
						.map(line -> {
							AccountDetailEmb ad = line.getAccountDetails();
							return new JournalResponse.JournalLineItem(
									line.getId(),
									ad != null ? ad.getAccountId() : null,
									ad != null ? ad.getAccountCode() : null,
									ad != null ? ad.getAccountName() : null,
									ad != null ? ad.getAccountType() : null,
									line.getDescription(),
									line.getDebit(),
									line.getCredit());
						})
						.toList();

		String narration = journal.getNarration();
		if ((narration == null || narration.isBlank()) && invoiceNumber != null) {
			narration = invoiceTypeName + " " + invoiceNumber + (contactName != null ? " — " + contactName : "");
		}

		return new JournalResponse(
				journal.getJournalId(),
				journal.getJournalNumber(),
				journal.getJournalDate(),
				narration,
				"INVOICE",
				invoiceId,
				invoiceNumber,
				invoiceType,
				invoiceTypeName,
				invoiceStatus,
				contactName,
				reference,
				totalDebit,
				totalCredit,
				lineDtos);
	}

	private JournalLine buildJournalLineWithEntryType(
			Journal journal,
			@NotNull Account account,
			BigDecimal amount,
			String entryType,
			String customDescription) {
		JournalLine jl = new JournalLine();
		jl.setJournal(journal);
		jl.setAccountDetails(new AccountDetailEmb(
				account.getAccountId(),
				account.getCode(),
				account.getAccountType() != null ? account.getAccountType().getName() : "General",
				account.getAccountName()));
		jl.setDescription(customDescription != null && !customDescription.isBlank()
				? customDescription
				: account.getDescription());

		String resolvedEntryType = entryType;
		if (resolvedEntryType == null && account.getCategory() != null) {
			resolvedEntryType = Account.checkEntryType(account.getCategory().getName());
		}

		if (AccountConstants.ACCOUNT_ENTRY_DEBIT.equalsIgnoreCase(resolvedEntryType)) {
			jl.setDebit(amount);
		} else {
			jl.setCredit(amount);
		}

		return jl;
	}
}
