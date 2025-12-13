package org.merra.services;

import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.OrganizationDetailsResponse;
import org.merra.dto.OrganizationMetaDataResponse;
import org.merra.dto.OrganziationSelectionResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationSettings;
import org.merra.entities.OrganizationType;
import org.merra.entities.embedded.FinancialYearEmb;
import org.merra.entities.embedded.InvoiceSettingsEmb;
import org.merra.entities.embedded.LineItemSettings;
import org.merra.enums.AddressEn;
import org.merra.enums.PaymentTermTypes;
import org.merra.enums.PaymentTermsEn;
import org.merra.mapper.OrganizationMapper;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.OrganizationSettingsRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.services.phone.PhoneService;
import org.merra.utilities.InvoiceConstants;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrganizationService {
	private final OrganizationRepository organizationRepository;
	private final OrganizationSettingsRepository organizationSettingsRepo;
	private final OrganizationTypeRepository organizationTypeRepository;
	private final AccountService accountService;
	private final OrganizationMapper organizationMapper;

	public OrganizationService(
			OrganizationRepository organizationRepository,
			OrganizationSettingsRepository organizationSettingsRepo,
			OrganizationTypeRepository organizationTypeRepository,
			AccountService accountService,
			PhoneService phoneService,
			OrganizationMapper organizationMapper) {
		this.organizationRepository = organizationRepository;
		this.organizationSettingsRepo = organizationSettingsRepo;
		this.organizationTypeRepository = organizationTypeRepository;
		this.accountService = accountService;
		this.organizationMapper = organizationMapper;
	}

	/**
	 * This method will retrieve an organization entity.
	 * If @param obj is null, return a new Organization object.
	 * If @param obj is instance of UUID, retrieve the organization object using
	 * it's ID.
	 * 
	 * @param obj - accepts {@linkplain Object} type.
	 * @return - {@linkplain Organization} object type.
	 */
	protected Organization getOrganizationObject(Object obj) {
		Optional<Organization> findOrganizationOpt = Optional.empty();

		if (obj == null) {
			findOrganizationOpt = Optional.of(new Organization());
		} else if (obj instanceof UUID id) {
			findOrganizationOpt = organizationRepository
					.findById(id);

			if (findOrganizationOpt.isEmpty()) {
				throw new NoSuchElementException("Organization entity cannot be found.");
			}
		}

		return findOrganizationOpt.get();
	}

	public OrganizationMetaDataResponse returnOrganizationMetaData() {
		// Get organization types
		Set<OrganizationMetaDataResponse.OrganizationTypesMetaData> organizationTypes = organizationTypeRepository
				.findAll()
				.stream()
				.map(type -> new OrganizationMetaDataResponse.OrganizationTypesMetaData(
						type.getId(),
						type.getName().contains("_") ? type.getName().replace("_", " ") : type.getName()))
				.collect(java.util.stream.Collectors.toSet());
		final String[] addresses = {
			AddressEn.ADDRESS1.name(),
			AddressEn.ADDRESS2.name(),
			AddressEn.ADDRESS3.name(),
			AddressEn.ADDRESS4.name()
		}; // Placeholder for addresses
		// For Payment terms
		final String[] subElements = { PaymentTermsEn.BILLS.name(), PaymentTermsEn.SALES.name() };
		final String[] types = {
			PaymentTermTypes.DAYSAFTERBILLDATE.name(),
			PaymentTermTypes.DAYSAFTERBILLMONTH.name(),
			PaymentTermTypes.OFCURRENTMONTH.name(),
			PaymentTermTypes.OFFOLLOWINGMONTH.name()
		};
		return new OrganizationMetaDataResponse(organizationTypes, addresses,
				new OrganizationMetaDataResponse.PaymentTermsMetaData(subElements, types));
	}

	// This method will create the organization settings after creating the new
	// organization
	private void createOrganizationSettings(@NotNull Organization org) {
		OrganizationSettings settings = new OrganizationSettings();
		settings.setOrganization(org);

		InvoiceSettingsEmb invoiceSettings = new InvoiceSettingsEmb();
		invoiceSettings.setStatus(InvoiceConstants.INVOICE_STATUS_DRAFT);
		settings.setInvoiceSettings(invoiceSettings);

		LineItemSettings lineItemSetting = new LineItemSettings();
		lineItemSetting.setDefaultQuantity(0.00);
		settings.setLineItemSettings(lineItemSetting);

		organizationSettingsRepo.save(settings);
	}

	/**
	 * This will persist the organization object to database (the actual creation of
	 * the entity
	 * to the database)
	 * 
	 * @param organization - accepts {@linkplain Organization} object type.
	 * @return - {@linkplain OrganizationDetailsResponse} object type.
	 */
	private OrganizationDetailsResponse save(Organization organization) {
		Organization newOrganization = organizationRepository.save(organization);
		// create organization's default settings
		this.createOrganizationSettings(organization);
		// create organization's default ledger accounts
		accountService.createDefaultAccounts(newOrganization);

		return organizationMapper.toOrganizationResponse(newOrganization);
	}

	public OrganizationDetailsResponse createNewOrganization(CreateOrganizationRequest req) {
		Organization org = getOrganizationObject(null); // New organization object

		// FIXME: set a default profile image for organization
		org.setProfileImage("sample_image_url");

		OrganizationType organizationType = getOrganizationType(req.type());
		FinancialYearEmb financialYearEmb = new FinancialYearEmb(
				req.financialYear().yearEndDay(),
				req.financialYear().yearEndMonth());

		// Set organization basic information
		org.setBasicInformation(req.displayName(), organizationType, req.email(), req.country(), financialYearEmb,
				req.currency());

		return save(org);

	}

	/**
	 * This method will check existing organization entity by
	 * {@linkplain java.util.UUID} id
	 * 
	 * @param id - accepts {@linkplain java.util.UUID} type of ID
	 * @return - returns {@linkplain OrganizationDetailsResponse} object type.
	 */
	public OrganizationDetailsResponse retrieveOrganizationById(UUID id) {
		Organization getOrganization = organizationRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Organization object not found."));
		return organizationMapper.toOrganizationResponse(getOrganization);
	}

	/**
	 * This method will retrieve the industry type
	 * 
	 * @param type - the id of type java.util.UUID
	 * @return OrganizationType object
	 */
	private OrganizationType getOrganizationType(UUID type) {
		OrganizationType getOrganizationType = organizationTypeRepository.findById(type)
				.orElseThrow(() -> new EntityNotFoundException("Organization type not found"));

		return getOrganizationType;
	}

	/*
	 * This method will retrieve the list of organizations that a user belongs to.
	 * 
	 * @param userId - accepts {@linkplain java.util.UUID} object type.
	 * 
	 * @return - returns a set of {@linkplain OrganziationSelectionResponse} object
	 * type.
	 */
	public Set<OrganziationSelectionResponse> getUserOrganizations(@NotNull UUID userId) {
		Set<Organization> organizations = organizationRepository.findOrganizationsByUserId(userId);
		return organizationMapper.toOrganizationSelectionResponses(organizations);
	}
}
