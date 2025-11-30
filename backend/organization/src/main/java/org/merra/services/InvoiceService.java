package org.merra.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.merra.dto.CreateInvoiceRequest;
import org.merra.dto.InvoiceTaxEligibility;
import org.merra.dto.UpdateInvoiceResponse;
import org.merra.entities.Contact;
import org.merra.entities.Invoice;
import org.merra.entities.LineItem;
import org.merra.entities.embedded.InvoiceActions;
import org.merra.entities.embedded.InvoiceSettings;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.AccountRepository;
import org.merra.repositories.ContactRepository;
import org.merra.repositories.InvoiceRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.OrganizationSettingsRepository;
import org.merra.repositories.TaxRateRepository;
import org.merra.repositories.TaxTypeRepository;
import org.merra.repositories.projections.AccountLookup;
import org.merra.utilities.InvoiceConstants;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;

/**
 * When you select an AccountCode for a line item,
 * that account often has a default TaxType associated with it in Xero.
 * However, you can override this default by explicitly setting TaxType
 * in your API request.
 */
@Service
public class InvoiceService {

	private final OrganizationRepository organizationRepository;
	private final OrganizationSettingsRepository organizationSettingsRepository;
	private final InvoiceRepository invoiceRepository;
	private final ContactRepository contactRepository;
	private final ContactService contactService;
	private final JournalService journalService;
	private final AccountRepository accountRepository;
	private final TaxRateRepository taxRateRepository;
	private final TaxTypeRepository taxTypeRepository;

	public InvoiceService(
			OrganizationRepository organizationRepository,
			OrganizationSettingsRepository organizationSettingsRepository,
			InvoiceRepository invoiceRepository,
			ContactRepository contactRepository,
			ContactService contactService,
			JournalService journalService,
			AccountRepository accountRepository,
			TaxRateRepository taxRateRepository,
			TaxTypeRepository taxTypeRepository) {
		this.organizationRepository = organizationRepository;
		this.organizationSettingsRepository = organizationSettingsRepository;
		this.invoiceRepository = invoiceRepository;
		this.contactRepository = contactRepository;
		this.contactService = contactService;
		this.journalService = journalService;
		this.accountRepository = accountRepository;
		this.taxRateRepository = taxRateRepository;
		this.taxTypeRepository = taxTypeRepository;
	}

	/**
	 * When the user creates an invoice (e.g. clicks the button for creating
	 * new invoice) a request (GET) will be sent and this will be the response.
	 * This method checks if tax can be applied to the invoice base on the
	 * organization's country code.
	 * 
	 * @param organizationID - accepts {@linkplain java.util.UUID} object type.
	 * @return - {@linkplain InvoiceTaxEligibility} object type.
	 */
	public InvoiceTaxEligibility taxEligibility(@NotNull UUID organizationID) {
		Optional<String> countryOpt = organizationRepository
				.findCountryUsingOrganizationId(organizationID);
		Boolean existsByLabel = taxTypeRepository.existsByLabelIgnoreCase(countryOpt.get());

		if (existsByLabel) {
			return new InvoiceTaxEligibility(organizationID, existsByLabel, TaxTypeRepository.COUNTRY_ELIGIBLE_FOR_TAX);
		}

		return new InvoiceTaxEligibility(
				organizationID,
				existsByLabel,
				TaxTypeRepository.COUNTRY_INELIGIBLE_FOR_TAX);
	}

	/**
	 * This method will retrieve an invoice object
	 * 
	 * @param obj - accepts {@linkplain Object} type
	 *            If @param obj is null, return a new invoice object.
	 *            If @param obj is instance of {@linkplain java.util.UUID} fetch
	 *            invoice object
	 *            using it's ID
	 * @return - {@linkplain Invoice} object type.
	 */
	private Invoice retrieveInvoiceObject(Object obj) {
		Optional<Invoice> findInvoiceOpt = Optional.empty();
		if (obj == null) {
			findInvoiceOpt = Optional.of(new Invoice());
		} else if (obj instanceof UUID id) {
			findInvoiceOpt = invoiceRepository.findById(id);
			if (findInvoiceOpt.isEmpty()) {
				throw new NoSuchElementException(OrganizationExceptions.NOT_FOUND_INVOICE);
			}
		}

		return findInvoiceOpt.get();
	}

	public void createNewInvoiceObject(CreateInvoiceRequest request, UUID organizationId) {
		// Create new Invoice object
		Invoice invoice = retrieveInvoiceObject(null);

		// Set the invoice type
		invoice.setType(request.invoiceType());

		// Set invoice contact
		Contact getContact = contactRepository.findById(request.contact())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CONTACT_OBJ));
		invoice.setContact(getContact);

		Integer CONTACT_DEFAULT_DISCOUNT = getContact.getDefaultDiscount();
		setLineItems(
				invoice,
				request.lineItems(),
				request.lineAmountType(),
				CONTACT_DEFAULT_DISCOUNT,
				organizationId);
		calculateInvoice(invoice);

		invoice.setDate(request.date());
		invoice.setDueDate(request.dueDate());

		/**
		 * If status is not provided in the request.
		 * Use the organization's default invoice status set in organization's settings.
		 */
		Optional<String> statusOpt = Optional.empty();
		if (request.status().isBlank()) {
			InvoiceSettings invoiceSettings = organizationSettingsRepository
					.findSettingsByOrganizationId(organizationId);
			statusOpt = Optional.of(invoiceSettings.getStatus());
		} else {
			statusOpt = Optional.of(request.status());
		}
		invoice.setStatus(statusOpt.get());

		// set invoice actions
		setInvoiceActions(invoice, statusOpt.get());

		invoice.setReference(request.reference());

		this.save(invoice);
	}

	/**
	 * This method will set the invoice object's actions instance
	 * 
	 * @param invoice - accepts {@linkplain Invoice} object.
	 * @param status  - accepts {@linkplain java.util.String} object type.
	 */
	private void setInvoiceActions(Invoice invoice, String status) {
		InvoiceActions invoiceActions = new InvoiceActions();
		if (status.equalsIgnoreCase(InvoiceConstants.INVOICE_STATUS_DRAFT)) {
			invoiceActions.setDelete(true);
			invoiceActions.setEdit(true);
		}

		invoice.setActions(invoiceActions);
	}

	/**
	 * This method will persist the invoice object to the database.
	 * 
	 * @param invoice - accepts {@linkplain Invoice} object type.
	 */
	private void save(Invoice invoice) {
		invoiceRepository.save(invoice);
	}

	/**
	 * This method is used to set the lineAmount type and LineItems of an invoice.
	 * 
	 * @param invoice               - accepts {@linkplain Invoice} object type.
	 * @param lineItemsSet          - {@linkplain java.util.Set} object that holds
	 *                              {@linkplain CreateInvoiceRequest.LineItems}
	 *                              objects.
	 * @param lineAmountTypeRequest - {@linkplain java.util.String} object type.
	 * @return - modified {@linkplain Invoice} object
	 */
	private Invoice setLineItems(
			Invoice invoice,
			Set<CreateInvoiceRequest.LineItems> lineItemsSet,
			String lineAmountTypeRequest,
			Integer customerDefaultDiscount,
			UUID organizationId) {
		/**
		 * Set lineAmountTypeRequest.
		 * If lineAmountTypeRequest is not specified then use the organization's
		 * DefaultPurchasesTax (If specified)
		 */
		Optional<String> lineAmountTypeOpt = Optional.empty();
		Optional<String> organizationDefaultTaxPurchaseOpt = organizationRepository.findLineAmountType(organizationId);

		// Set line amount type
		if (!lineAmountTypeRequest.isBlank()) {
			lineAmountTypeOpt = Optional.of(lineAmountTypeRequest);
		} else if (lineAmountTypeRequest.isBlank()) {
			if (organizationDefaultTaxPurchaseOpt.isPresent()) {
				lineAmountTypeOpt = Optional.of(organizationDefaultTaxPurchaseOpt.get());
			} else {
				// Type EXCLUSIVE is the default if both lineAmountTypeRequest and
				// organizationDefaultTaxPurchase is not specified
				lineAmountTypeOpt = Optional.of(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE);
			}
		}
		invoice.setLineAmountTypes(lineAmountTypeOpt.get());

		Set<LineItem> lineItems = lineItemsSet
				.stream()
				.map(lineItem -> {
					LineItem createLineItem = new LineItem();

					/**
					 * Set the tax type.
					 * If overrideTaxType() isn't provided, then get tax type by account code.
					 */
					String taxType = null;
					if (lineItem.overrideTaxType().isBlank()) {
						Optional<AccountLookup> accountLookupOpt = accountRepository
								.findAccountByCodeAndOrganization(lineItem.accountCode(), organizationId);
						if (accountLookupOpt.isEmpty()) {
							throw new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ACCOUNT_LOOKUP);
						}
						taxType = accountLookupOpt.get().getAccountCode();
					} else {
						taxType = lineItem.overrideTaxType();
					}

					// Check if line item discount rate is specified.
					// If not, check if customer's default discount rate is specified.
					Integer discountRateIfExists = lineItem.discountRate() != null
							|| lineItem.discountRate() != 0 ? lineItem.discountRate()
									: customerDefaultDiscount != null ? customerDefaultDiscount : null;

					// Calculate the line amount
					Double calculateLineAmount = null;
					calculateLineAmount = discountRateIfExists != null
							? lineItem.quantity() * lineItem.unitAmount() * ((100 - discountRateIfExists) / 100)
							: lineItem.quantity() * lineItem.unitAmount();

					if (calculateLineAmount != null) {
						createLineItem.setDiscountRate(discountRateIfExists);
					}

					/**
					 * Calculate tax amount by:
					 * - calculate net line amount
					 * - get the tax type rate
					 */
					BigDecimal netLineAmount = new BigDecimal(lineItem.quantity() * lineItem.unitAmount());
					BigDecimal effectiveRate = taxRateRepository.findEffectiveRateByOrganziationId(
							organizationId, taxType).get();

					BigDecimal calculateTaxAmount = BigDecimal.ZERO;
					BigDecimal lineItemTotal = BigDecimal.ZERO;

					if (lineAmountTypeRequest
							.compareToIgnoreCase(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE) == 0) {
						// LineAmountTypes: "Exclusive"
						calculateTaxAmount = netLineAmount.multiply(effectiveRate);
						lineItemTotal = new BigDecimal(lineItem.unitAmount()).add(effectiveRate);

					} else if (lineAmountTypeRequest
							.compareToIgnoreCase(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_INCLUSIVE) == 0) {
						// LineAmountTypes: "Inclusive"
						BigDecimal grossPrice = new BigDecimal(lineItem.unitAmount());
						BigDecimal taxRate = effectiveRate.divide(new BigDecimal("100"), 2, RoundingMode.HALF_DOWN);

						// We should first add 1 to the effective rate before dividing.
						BigDecimal one = new BigDecimal("1");
						BigDecimal onePlusTaxRate = one.add(taxRate);
						BigDecimal netPrice = grossPrice.divide(onePlusTaxRate);
						calculateTaxAmount = grossPrice.subtract(netPrice);
						lineItemTotal = new BigDecimal(lineItem.unitAmount());

					} else { // LineAmountTypes: "NoTax"
						calculateTaxAmount = new BigDecimal("0.00");
						lineItemTotal = new BigDecimal(lineItem.unitAmount());
					}

					createLineItem.setDescription(lineItem.description());
					createLineItem.setQuantity(lineItem.quantity());
					createLineItem.setUnitAmount(lineItem.unitAmount());
					createLineItem.setLineAmount(calculateLineAmount);
					createLineItem.setAccountCode(lineItem.accountCode());
					createLineItem.setTaxAmount(calculateTaxAmount);
					createLineItem.setTaxType(taxType);
					createLineItem.setTotal(lineItemTotal);

					return createLineItem;
				})
				.collect(Collectors.toSet());

		invoice.setLineItems(lineItems);

		return invoice;
	}

	/**
	 * This method will calculate the invoice's subTotal,
	 * totalTax, and grandTotal
	 * 
	 * @param invoice - accepts {@linkplain Invoice} object type
	 * @return - returns modified {@linkplain Invoice} object
	 */
	private Invoice calculateInvoice(Invoice invoice) {
		/**
		 * This is the sum of all LineAmount values across all LineItems on the invoice,
		 * before any taxes are applied.
		 */
		Double subTotal = invoice.getLineItems().stream()
				.mapToDouble(lineAmount -> lineAmount.getLineAmount())
				.sum();

		invoice.setSubTotal(subTotal);

		// Calculate and set total tax
		BigDecimal totalTax = invoice.getLineItems().stream()
				.map(tx -> tx.getTaxAmount())
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		invoice.setTotalTax(totalTax);

		// Calculate and set grand total
		BigDecimal grandTotal = new BigDecimal(subTotal).add(totalTax);
		invoice.setGrandTotal(grandTotal);

		return invoice;
	}

	/**
	 * This method will update the invoice's status.
	 * 
	 * @param invoiceId - accepts {@linkplain java.util.UUID} object type.
	 * @param status    - accepts {@linkplain java.util.String} object type.
	 * @return - {@linkplain UpdateInvoiceResponse} object type.
	 */
	@Transactional
	public UpdateInvoiceResponse updateInvoiceStatus(
			@NotNull UUID invoiceId,
			@NotNull String status) {
		Invoice findInvoiceById = invoiceRepository.findById(invoiceId)
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE));
		String formerStatus = findInvoiceById.getStatus();

		findInvoiceById.setStatus(status);
		invoiceRepository.save(findInvoiceById);

		/**
		 * If the status is updated to @AUTHORISED
		 * create a journal entry for this.
		 */
		if (status.equals(InvoiceConstants.INVOICE_STATUS_AUTHORISED)) {
			journalService.entry(
					findInvoiceById.getLineItems(),
					findInvoiceById.getOrganization(),
					findInvoiceById);
		}

		String currentStatus = findInvoiceById.getStatus();

		return new UpdateInvoiceResponse(
				findInvoiceById.getInvoiceId(),
				formerStatus,
				currentStatus);
	}

}
