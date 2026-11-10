package org.merra.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.merra.dto.CreateInvoiceRequest;
import org.merra.dto.InvoiceDetailResponse;
import org.merra.dto.InvoiceListResponse;
import org.merra.dto.InvoiceMetaDataResponse;
import org.merra.dto.UpdateInvoiceResponse;
import org.merra.entities.Contact;
import org.merra.entities.Invoice;
import org.merra.entities.InvoiceType;
import org.merra.entities.LineItem;
import org.merra.entities.Organization;
import org.merra.entities.embedded.InvoiceActionsEmb;
import org.merra.exception.ResourceAlreadyExistsException;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.AccountRepository;
import org.merra.repositories.ContactRepository;
import org.merra.repositories.InvoiceRepository;
import org.merra.repositories.InvoiceStatusCodeRepository;
import org.merra.repositories.InvoiceTypeRepository;
import org.merra.repositories.LineAmountTypeRepository;
import org.merra.repositories.TaxRateRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.repositories.projections.AccountLookup;
import org.merra.utilities.InvoiceConstants;
import org.merra.utilities.RedisKeys;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;

/**
 * When you select an AccountCode for a line item,
 * that account often has a default TaxType associated with it in Xero.
 * However, you can override this default by explicitly setting TaxType
 * in your API request.
 */
@Service
@Validated
public class InvoiceService {
	private final InvoiceRepository invoiceRepository;
	private final ContactRepository contactRepository;
	private final JournalService journalService;
	private final AccountRepository accountRepository;
	private final TaxRateRepository taxRateRepository;
	private final InvoiceTypeRepository invoiceTypeRepository;
	private final InvoiceStatusCodeRepository invoiceStatusCodeRepository;
	private final LineAmountTypeRepository lineAmountTypeRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;
	private final RedisTemplate<String, Object> redisTemplate;
	private final NetworkKeyService networkKeyService;

	public InvoiceService(
			InvoiceRepository invoiceRepository,
			ContactRepository contactRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			JournalService journalService,
			AccountRepository accountRepository,
			TaxRateRepository taxRateRepository,
			InvoiceTypeRepository invoiceTypeRepository,
			InvoiceStatusCodeRepository invoiceStatusCodeRepository,
			LineAmountTypeRepository lineAmountTypeRepository,
			RedisTemplate<String, Object> redisTemplate,
			NetworkKeyService networkKeyService) {
		this.redisTemplate = redisTemplate;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
		this.invoiceRepository = invoiceRepository;
		this.contactRepository = contactRepository;
		this.journalService = journalService;
		this.accountRepository = accountRepository;
		this.taxRateRepository = taxRateRepository;
		this.invoiceTypeRepository = invoiceTypeRepository;
		this.invoiceStatusCodeRepository = invoiceStatusCodeRepository;
		this.lineAmountTypeRepository = lineAmountTypeRepository;
		this.networkKeyService = networkKeyService;
	}

	/**
	 * Creates a new invoice object from the provided request data.
	 * 
	 * This method performs the following operations:
	 * - Creates a new Invoice entity instance
	 * - Validates that the organization exists in the current tenant context
	 * - Sets the invoice type from the request
	 * - Retrieves and assigns the contact entity, applying default discount if
	 * available
	 * - Processes and sets line items with discount calculations
	 * - Calculates total invoice amounts including taxes and discounts
	 * - Sets invoice dates (issue date and due date)
	 * - Sets invoice status (defaults to "DRAFT" if not provided)
	 * - Configures invoice actions based on the status
	 * - Sets the invoice reference number
	 * - Persists the invoice to the database
	 * 
	 * @param request The CreateInvoiceRequest containing all invoice data including
	 *                type, contact, line items, dates, status, and reference
	 * @throws EntityNotFoundException if organization or contact is not found
	 */
	@Transactional
	public void createNewInvoiceObject(@NotNull CreateInvoiceRequest request) {
		// Create new Invoice object
		Invoice invoice = new Invoice();

		// Get current organization
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
		invoice.setOrganization(currentOrganization);

		// Set the invoice type
		final InvoiceType invoiceType = invoiceTypeRepository.findById(request.invoiceType())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE_TYPE));
		invoice.setType(invoiceType);

		// Set invoice contact
		Contact getContact = contactRepository.findById(request.contact())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CONTACT_OBJ));
		invoice.setContact(getContact);

		// Validate Merra Network subscription key if contact is a network tenant
		networkKeyService.validateSubscription(getContact);

		// Validate contact type constraint with invoice type
		boolean isCustomerInvoice = invoiceType.getType().equalsIgnoreCase(InvoiceConstants.INVOICE_TYPE_CUSTOMER_INVOICE)
				|| invoiceType.getType().toUpperCase().contains("RECEIVABLE");
		boolean isSupplierInvoice = invoiceType.getType().equalsIgnoreCase(InvoiceConstants.INVOICE_TYPE_SUPPLIER_INVOICE)
				|| invoiceType.getType().toUpperCase().contains("PAYABLE");

		boolean contactIsCustomer = Boolean.TRUE.equals(getContact.getIsCustomer());
		boolean contactIsSupplier = Boolean.TRUE.equals(getContact.getIsSupplier());

		if (isCustomerInvoice && !contactIsCustomer) {
			throw new IllegalArgumentException("Cannot create a customer invoice for a contact that is not a customer");
		}
		if (isSupplierInvoice && !contactIsSupplier) {
			throw new IllegalArgumentException("Cannot create a supplier invoice for a contact that is not a supplier");
		}

		final Integer contactDefaultDiscount = getContact.getDefaultDiscount();

		setLineItems(invoice, request.lineItems(), request.lineAmountType(), contactDefaultDiscount,
				currentOrganization.getId());
		calculateInvoice(invoice);

		invoice.setDate(request.date());
		invoice.setDueDate(request.dueDate());

		final String status = request.status();
		invoice.setStatus(status);

		// set invoice actions
		setInvoiceActions(invoice, status);

		// Resolve invoice number according to invoice type constraints
		String invoiceNumber = request.invoiceNumber();
		if (invoiceNumber != null) {
			invoiceNumber = invoiceNumber.trim();
		}

		if (isCustomerInvoice) {
			if (invoiceNumber == null || invoiceNumber.isBlank()) {
				invoiceNumber = generateUniqueCustomerInvoiceNumber(currentOrganization.getId());
			} else {
				if (!invoiceNumber.toUpperCase().startsWith("INV-")) {
					throw new IllegalArgumentException("Customer invoice number must be prefixed with 'INV-'");
				}
				if (invoiceNumber.length() > 13) {
					throw new IllegalArgumentException("Customer invoice number cannot exceed 13 characters");
				}
				if (invoiceRepository.existsByInvoiceNumberAndOrganizationId(invoiceNumber, currentOrganization.getId())) {
					throw new ResourceAlreadyExistsException(
							"Customer invoice number '" + invoiceNumber + "' already exists for this organization");
				}
			}
		} else if (isSupplierInvoice) {
			if (invoiceNumber == null || invoiceNumber.isBlank()) {
				throw new IllegalArgumentException("Invoice number is required for supplier invoices");
			}
			if (invoiceNumber.length() > 13) {
				throw new IllegalArgumentException("Supplier invoice number cannot exceed 13 characters");
			}
			// Supplier invoice numbers are non-unique and not forced to be prefixed with "INV-"
		} else {
			if (invoiceNumber == null || invoiceNumber.isBlank()) {
				invoiceNumber = generateUniqueCustomerInvoiceNumber(currentOrganization.getId());
			} else if (invoiceNumber.length() > 13) {
				throw new IllegalArgumentException("Invoice number cannot exceed 13 characters");
			}
		}

		invoice.setInvoiceNumber(invoiceNumber);
		invoice.setReference(request.reference());

		Invoice savedInvoice = invoiceRepository.save(invoice);

		if (InvoiceConstants.INVOICE_STATUS_AUTHORISED.equalsIgnoreCase(status)) {
			journalService.entry(
					savedInvoice.getLineItems(),
					currentOrganization,
					savedInvoice);
		}
	}

	/**
	 * Configures the available actions for an invoice based on its current status.
	 * 
	 * This method determines what operations can be performed on an invoice by
	 * setting
	 * action flags in the InvoiceActionsEmb embedded object. Currently, only
	 * invoices
	 * with "DRAFT" status can be edited or deleted.
	 * 
	 * Action rules:
	 * - DRAFT status: Edit and Delete actions are enabled
	 * - Other statuses: No actions enabled (default behavior)
	 * 
	 * @param invoice The Invoice entity to configure actions for
	 * @param status  The current status of the invoice (e.g., "DRAFT", "SENT",
	 *                "PAID")
	 */
	private void setInvoiceActions(Invoice invoice, @NotNull String status) {
		InvoiceActionsEmb invoiceActions = new InvoiceActionsEmb();
		if (status.equalsIgnoreCase(InvoiceConstants.INVOICE_STATUS_DRAFT)) {
			invoiceActions.setDelete(true);
			invoiceActions.setEdit(true);
		}

		invoice.setActions(invoiceActions);
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
			@NotNull Invoice invoice,
			@NotNull Set<CreateInvoiceRequest.LineItems> lineItemsSet,
			String lineAmountTypeRequest, // could be null or blank if not provided in the request
			Integer customerDefaultDiscount,
			@NotNull UUID organizationId) {
		/**
		 * Determine the line amount type (tax inclusive vs exclusive) for the invoice.
		 * 
		 * Priority order:
		 * 1. Use the lineAmountTypeRequest parameter if provided (not blank)
		 * 2. Default to "EXCLUSIVE" if not specified
		 * 
		 * This determines whether line item amounts include tax (INCLUSIVE) or exclude
		 * tax (EXCLUSIVE).
		 */
		final String getLineAmountType = (lineAmountTypeRequest != null && !lineAmountTypeRequest.isBlank())
				? lineAmountTypeRequest
				: InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE;

		// Apply the determined line amount type to the invoice
		invoice.setLineAmountTypes(getLineAmountType);

		Set<LineItem> lineItems = lineItemsSet
				.stream()
				.map(lineItem -> {
					LineItem createLineItem = new LineItem();
					createLineItem.setLineItemId(UUID.randomUUID().toString());
					createLineItem.setInvoice(invoice);

					/**
					 * Resolve the tax type for the line item.
					 * Priority:
					 * 1) Use overrideTaxType when explicitly provided in the request.
					 * 2) Otherwise, derive the tax type from the selected account code within
					 * the current organization.
					 * 3) If not found, default to "NONE".
					 */
					String taxType = null;
					if (lineItem.overrideTaxType() == null || lineItem.overrideTaxType().isBlank()) {
						Optional<AccountLookup> accountLookupOpt = accountRepository
								.findAccountByCodeAndOrganization(lineItem.accountCode(), organizationId);
						if (accountLookupOpt.isPresent() && accountLookupOpt.get().getTaxType() != null
								&& !accountLookupOpt.get().getTaxType().isBlank()) {
							taxType = accountLookupOpt.get().getTaxType();
						} else {
							taxType = "NONE";
						}
					} else {
						taxType = lineItem.overrideTaxType();
					}

					// Check if line item discount rate is specified.
					// If not, check if customer's default discount rate is specified.
					Integer discountRate = lineItem.discountRate() != null && lineItem.discountRate() > 0
							? lineItem.discountRate()
							: (customerDefaultDiscount != null && customerDefaultDiscount > 0 ? customerDefaultDiscount : null);

					// Calculate the line amount
					Double calculateLineAmount = null;
					calculateLineAmount = discountRate != null
							? lineItem.quantity() * lineItem.unitAmount() * ((100.0 - discountRate) / 100.0)
							: lineItem.quantity() * lineItem.unitAmount();

					if (discountRate != null) {
						createLineItem.setDiscountRate(discountRate);
					}

					/**
					 * Calculate tax amount by:
					 * - calculate net line amount
					 * - get the tax type rate
					 */
					BigDecimal netLineAmount = BigDecimal.valueOf(calculateLineAmount != null ? calculateLineAmount : (lineItem.quantity() * lineItem.unitAmount()));

					BigDecimal effectiveRate = BigDecimal.ZERO;
					if (taxType != null && !taxType.isBlank() && !taxType.equalsIgnoreCase("NONE")) {
						effectiveRate = taxRateRepository.findEffectiveRateByOrganziationId(
								organizationId, taxType).orElse(BigDecimal.ZERO);
					}

					BigDecimal taxRate = effectiveRate.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
					BigDecimal calculateTaxAmount = BigDecimal.ZERO;
					BigDecimal lineItemTotal = BigDecimal.ZERO;

					if (getLineAmountType
							.compareToIgnoreCase(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_EXCLUSIVE) == 0) {
						// Exclusive mode: line amounts are net, so tax is added on top.
						calculateTaxAmount = netLineAmount.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
						lineItemTotal = netLineAmount.add(calculateTaxAmount).setScale(2, RoundingMode.HALF_UP);

					} else if (getLineAmountType
							.compareToIgnoreCase(InvoiceConstants.INVOICE_LINE_AMOUNT_TYPE_INCLUSIVE) == 0) {
						// Inclusive mode: unit amount already includes tax, so extract the tax portion.
						BigDecimal onePlusTaxRate = BigDecimal.ONE.add(taxRate);
						BigDecimal netPrice = netLineAmount.divide(onePlusTaxRate, 4, RoundingMode.HALF_UP);
						calculateTaxAmount = netLineAmount.subtract(netPrice).setScale(2, RoundingMode.HALF_UP);
						lineItemTotal = netLineAmount.setScale(2, RoundingMode.HALF_UP);
						calculateLineAmount = lineItemTotal.subtract(calculateTaxAmount).doubleValue();

					} else { // NoTax mode: tax is explicitly zero and total equals unit amount.
						calculateTaxAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
						lineItemTotal = netLineAmount.setScale(2, RoundingMode.HALF_UP);
					}

					createLineItem.setDescription(lineItem.description());
					createLineItem.setQuantity(lineItem.quantity());
					createLineItem.setUnitAmount(lineItem.unitAmount());
					createLineItem.setLineAmount(calculateLineAmount != null ? calculateLineAmount : netLineAmount.doubleValue());
					createLineItem.setAccountCode(lineItem.accountCode());
					createLineItem.setTaxAmount(calculateTaxAmount);
					createLineItem.setTaxType(taxType != null && !taxType.isBlank() ? taxType : "NONE");
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
				.map(LineItem::getTaxAmount)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		invoice.setTotalTax(totalTax);

		// Calculate and set grand total
		BigDecimal grandTotal = BigDecimal.valueOf(subTotal).add(totalTax);
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
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

		Invoice findInvoiceById = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, currentOrganization.getId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE));
		final String formerStatus = findInvoiceById.getStatus();

		findInvoiceById.setStatus(status);
		setInvoiceActions(findInvoiceById, status);
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

	/**
	 * Updates an existing invoice with new header, contact, dates, status, and line items.
	 *
	 * @param invoiceId The invoice UUID
	 * @param request   The update data
	 * @return The updated InvoiceDetailResponse
	 */
	@Transactional
	public InvoiceDetailResponse updateInvoice(@NotNull UUID invoiceId, @NotNull CreateInvoiceRequest request) {
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

		Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, currentOrganization.getId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE));

		// Set the invoice type
		final InvoiceType invoiceType = invoiceTypeRepository.findById(request.invoiceType())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE_TYPE));
		invoice.setType(invoiceType);

		// Set invoice contact
		Contact getContact = contactRepository.findById(request.contact())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CONTACT_OBJ));
		invoice.setContact(getContact);

		// Validate Merra Network subscription key if contact is a network tenant
		networkKeyService.validateSubscription(getContact);

		// Validate contact type constraint with invoice type
		boolean isCustomerInvoice = invoiceType.getType().equalsIgnoreCase(InvoiceConstants.INVOICE_TYPE_CUSTOMER_INVOICE)
				|| invoiceType.getType().toUpperCase().contains("RECEIVABLE");
		boolean isSupplierInvoice = invoiceType.getType().equalsIgnoreCase(InvoiceConstants.INVOICE_TYPE_SUPPLIER_INVOICE)
				|| invoiceType.getType().toUpperCase().contains("PAYABLE");

		boolean contactIsCustomer = Boolean.TRUE.equals(getContact.getIsCustomer());
		boolean contactIsSupplier = Boolean.TRUE.equals(getContact.getIsSupplier());

		if (isCustomerInvoice && !contactIsCustomer) {
			throw new IllegalArgumentException("Cannot create a customer invoice for a contact that is not a customer");
		}
		if (isSupplierInvoice && !contactIsSupplier) {
			throw new IllegalArgumentException("Cannot create a supplier invoice for a contact that is not a supplier");
		}

		final Integer contactDefaultDiscount = getContact.getDefaultDiscount();

		setLineItems(invoice, request.lineItems(), request.lineAmountType(), contactDefaultDiscount,
				currentOrganization.getId());
		calculateInvoice(invoice);

		invoice.setDate(request.date());
		invoice.setDueDate(request.dueDate());

		final String formerStatus = invoice.getStatus();
		final String status = request.status();
		invoice.setStatus(status);
		setInvoiceActions(invoice, status);

		if (request.reference() != null) {
			invoice.setReference(request.reference());
		}

		// If transitioning to AUTHORISED, create journal entry
		if (!formerStatus.equalsIgnoreCase(InvoiceConstants.INVOICE_STATUS_AUTHORISED)
				&& status.equalsIgnoreCase(InvoiceConstants.INVOICE_STATUS_AUTHORISED)) {
			journalService.entry(
					invoice.getLineItems(),
					invoice.getOrganization(),
					invoice);
		}

		invoiceRepository.save(invoice);
		return getInvoiceDetail(invoiceId);
	}

	/**
	 * Deletes an invoice from the current organization.
	 *
	 * @param invoiceId The invoice UUID
	 */
	@Transactional
	public void deleteInvoice(@NotNull UUID invoiceId) {
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

		Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, currentOrganization.getId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE));

		if (InvoiceConstants.INVOICE_STATUS_PAID.equalsIgnoreCase(invoice.getStatus())) {
			throw new IllegalStateException("Paid invoices cannot be deleted. You can mark it as voided instead.");
		}

		invoiceRepository.delete(invoice);
	}

	/**
	 * Generates a unique customer invoice number using the invoice sequence and current year.
	 * Guarantees uniqueness within the organization.
	 *
	 * @param organizationId The organization UUID
	 * @return A unique, formatted invoice number in the pattern INV-YYYY-NNNN.
	 */
	private String generateUniqueCustomerInvoiceNumber(UUID organizationId) {
		int year = LocalDate.now().getYear();
		String invoiceNumber;
		do {
			Long nextVal = invoiceRepository.getNextInvoiceSequence();
			invoiceNumber = String.format("INV-%d-%04d", year, nextVal);
		} while (invoiceRepository.existsByInvoiceNumberAndOrganizationId(invoiceNumber, organizationId));

		return invoiceNumber;
	}

	public boolean checkInvoiceNumberExists(String invoiceNumber) {
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
		return invoiceRepository.existsByInvoiceNumberAndOrganizationId(invoiceNumber, currentOrganization.getId());
	}

	/**
	 * Retrieves the invoice metadata, including status codes, types, and line
	 * amount types.
	 * The metadata is retrieved from Redis cache if present; otherwise, it is
	 * queried from the
	 * database, cached for a constant duration, and returned.
	 *
	 * @return The InvoiceMetaDataResponse containing the sets of status codes,
	 *         types, and line amount types.
	 */
	private String toTitleCase(String input) {
		if (input == null || input.isEmpty()) {
			return input;
		}
		StringBuilder titleCase = new StringBuilder();
		boolean nextTitleCase = true;

		for (char c : input.toCharArray()) {
			if (c == '_' || c == ' ' || c == '-') {
				titleCase.append(' ');
				nextTitleCase = true;
			} else if (nextTitleCase) {
				titleCase.append(Character.toTitleCase(c));
				nextTitleCase = false;
			} else {
				titleCase.append(Character.toLowerCase(c));
			}
		}

		return titleCase.toString().trim();
	}

	public InvoiceMetaDataResponse metadata() {
		InvoiceMetaDataResponse metaDataCache = (InvoiceMetaDataResponse) redisTemplate.opsForValue()
				.get(RedisKeys.INVOICE_METADATA);

		if (metaDataCache == null) {
			Set<InvoiceMetaDataResponse.InvoiceStatusCode> statusCodes = invoiceStatusCodeRepository.findAll().stream()
					.map(s -> new InvoiceMetaDataResponse.InvoiceStatusCode(s.getId(), s.getCode()))
					.collect(Collectors.toSet());

			Set<InvoiceMetaDataResponse.InvoiceType> invoiceTypes = invoiceTypeRepository.findAll().stream()
					.map(t -> new InvoiceMetaDataResponse.InvoiceType(t.getId(), toTitleCase(t.getType())))
					.collect(Collectors.toSet());

			Set<InvoiceMetaDataResponse.LineAmountType> lineAmountTypes = lineAmountTypeRepository.findAll().stream()
					.map(t -> new InvoiceMetaDataResponse.LineAmountType(t.getId(), toTitleCase(t.getType())))
					.collect(Collectors.toSet());

			metaDataCache = new InvoiceMetaDataResponse(invoiceTypes, statusCodes, lineAmountTypes);

			redisTemplate.opsForValue().set(RedisKeys.INVOICE_METADATA, metaDataCache, RedisKeys.CONSTANT_DURATION);
		}

		return metaDataCache;
	}

	/**
	 * Retrieves all invoices for the current organization.
	 *
	 * @return A list of {@link InvoiceListResponse}
	 */
	public List<InvoiceListResponse> getAllInvoicesByCurrentOrganization() {
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

		List<Invoice> invoices = invoiceRepository.findAllByOrganizationId(currentOrganization.getId());

		return invoices.stream().map(inv -> {
			Contact c = inv.getContact();
			boolean isCust = c != null && Boolean.TRUE.equals(c.getIsCustomer());
			boolean isSupp = c != null && Boolean.TRUE.equals(c.getIsSupplier());
			String contactType = isCust && isSupp ? "BT" : isCust ? "CT" : isSupp ? "SP" : null;

			String typeRaw = inv.getType() != null ? inv.getType().getType().toUpperCase() : "";
			String type = (typeRaw.contains("SUPPLIER") || typeRaw.contains("PAYABLE") || typeRaw.contains("BILL"))
					? "SUPPLIER"
					: "CUSTOMER";
			String typeName = type.equals("SUPPLIER") ? "Supplier Invoice" : "Customer Invoice";

			return new InvoiceListResponse(
					inv.getInvoiceId(),
					inv.getInvoiceNumber(),
					type,
					typeName,
					c != null ? c.getName() : "Unknown Contact",
					contactType,
					inv.getDate(),
					inv.getDueDate(),
					inv.getStatus(),
					inv.getGrandTotal(),
					inv.getReference());
		}).collect(Collectors.toList());
	}

	/**
	 * Retrieves detailed information for a single invoice belonging to the current organization.
	 *
	 * @param invoiceId The invoice UUID
	 * @return The detailed {@link InvoiceDetailResponse}
	 */
	public InvoiceDetailResponse getInvoiceDetail(UUID invoiceId) {
		final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

		Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, currentOrganization.getId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_INVOICE));

		Contact c = invoice.getContact();
		boolean isCust = c != null && Boolean.TRUE.equals(c.getIsCustomer());
		boolean isSupp = c != null && Boolean.TRUE.equals(c.getIsSupplier());
		String contactType = isCust && isSupp ? "BT" : isCust ? "CT" : isSupp ? "SP" : null;

		String typeRaw = invoice.getType() != null ? invoice.getType().getType().toUpperCase() : "";
		String type = (typeRaw.contains("SUPPLIER") || typeRaw.contains("PAYABLE") || typeRaw.contains("BILL"))
				? "SUPPLIER"
				: "CUSTOMER";
		String typeName = type.equals("SUPPLIER") ? "Supplier Invoice" : "Customer Invoice";

		List<InvoiceDetailResponse.LineItemDetail> lineItems = new ArrayList<>();
		if (invoice.getLineItems() != null) {
			lineItems = invoice.getLineItems().stream().map(li -> new InvoiceDetailResponse.LineItemDetail(
					li.getId(),
					li.getLineItemId(),
					li.getDescription(),
					li.getQuantity(),
					li.getUnitAmount(),
					li.getLineAmount(),
					li.getAccountCode(),
					li.getTaxType(),
					li.getTaxAmount(),
					li.getDiscountRate(),
					li.getTotal())).collect(Collectors.toList());
		}

		String orgName = currentOrganization.getDisplayName() != null ? currentOrganization.getDisplayName() : currentOrganization.getLegalName();

		return new InvoiceDetailResponse(
				invoice.getInvoiceId(),
				invoice.getInvoiceNumber(),
				type,
				typeName,
				orgName,
				currentOrganization.getEmail(),
				null,
				null,
				null,
				c != null ? c.getId() : null,
				c != null ? c.getName() : "Unknown Contact",
				c != null ? c.getEmailAddress() : null,
				null,
				null,
				c != null ? c.getAccountNumber() : null,
				contactType,
				invoice.getDate(),
				invoice.getDueDate(),
				invoice.getLineAmountTypes(),
				invoice.getStatus(),
				invoice.getReference(),
				invoice.getSubTotal(),
				invoice.getTotalTax(),
				invoice.getGrandTotal(),
				lineItems);
	}
}
