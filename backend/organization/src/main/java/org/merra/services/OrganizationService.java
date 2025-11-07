package org.merra.services;

import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.OrganizationDetailsResponse;
import org.merra.dto.OrganziationSelectionResponse;
import org.merra.embedded.PhoneDetails;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationSettings;
import org.merra.entities.OrganizationType;
import org.merra.entities.embedded.InvoiceSettings;
import org.merra.entities.embedded.LineItemSettings;
import org.merra.mapper.OrganizationMapper;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.OrganizationSettingsRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.services.phone.PhoneService;
import org.merra.utilities.InvoiceConstants;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;

import java.util.LinkedHashSet;
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
	private final OrganizationMemberService organizationMemberService;
	private final PhoneService phoneService;
	private final OrganizationMapper organizationMapper;

	public OrganizationService(
			OrganizationRepository organizationRepository,
			OrganizationSettingsRepository organizationSettingsRepo,
			OrganizationTypeRepository organizationTypeRepository,
			AccountService accountService,
			OrganizationMemberService organizationMemberService,
			PhoneService phoneService,
			OrganizationMapper organizationMapper) {
		this.organizationRepository = organizationRepository;
		this.organizationSettingsRepo = organizationSettingsRepo;
		this.organizationTypeRepository = organizationTypeRepository;
		this.accountService = accountService;
		this.organizationMemberService = organizationMemberService;
		this.phoneService = phoneService;
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
		Optional<Organization> findOrganization = Optional.empty();

		if (obj == null) {
			findOrganization = Optional.of(new Organization());
		} else if (obj instanceof UUID id) {
			findOrganization = organizationRepository
					.findById(id);

			if (findOrganization.isEmpty()) {
				throw new NoSuchElementException("Organization entity cannot be found.");
			}
		}

		return findOrganization.get();
	}

	// This method will create the organization settings after creating the new
	// organization
	private void createOrganizationSettings(@NotNull Organization org) {
		OrganizationSettings settings = new OrganizationSettings();
		settings.setOrganization(org);

		InvoiceSettings invoiceSettings = new InvoiceSettings();
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

	/**
	 * This method will create new organization object
	 * 
	 * @param - {@linkplain CreateOrganizationRequest} object type of data
	 * @return - {@linkplain OrganizationDetailsResponse} object type of data
	 */
	@Transactional
	public OrganizationDetailsResponse createNewOrganizationObject(CreateOrganizationRequest data) {
		Organization org = getOrganizationObject(null); // New organization object
		// TODO - For now set this as organization's profile picture
		org.setProfileImage("sample_image_url");

		// Set organization basic information
		setBasicInformation(data.basicInformation(), org);

		// Set organization contact details
		setContactDetails(data.contactDetails(), org);

		// Set the creator if the organization as the advisor.
		organizationMemberService.addAdvisor(org);

		// Set organization invited users
		organizationMemberService.addInvitedUsers(data.inviteOtherUser(), org);

		return save(org);

	}

	/**
	 * The following fields are part of organization's basic informations:
	 * - displayName
	 * - legalName,
	 * - organizationType
	 * - organizationDescription
	 * 
	 * @param info         - accepts
	 *                     {@linkplain CreateOrganizationRequest.BasicInformation}
	 *                     object type.
	 * @param organization - accepts {@linkplain Organization} object type.
	 */
	private void setBasicInformation(
			CreateOrganizationRequest.BasicInformation info,
			Organization organization) {
		OrganizationType type = getOrganizationType(info.organizationType());
		organization.setBasicInformation(
				info.displayName(),
				info.legalName(),
				type,
				info.organizationDescription());
	}

	/**
	 * This method will set the organization's contact details.
	 * Contact details include:
	 * - countryCode
	 * - addresses
	 * - phone details
	 * - email
	 * - web-site
	 * - externalLinks
	 * 
	 * @param contacts     - accepts
	 *                     {@linkplain CreateOrganizationRequest.ContactDetails}
	 *                     object type
	 * @param organization - accepts {@linkplain Organization} object type.
	 */
	private void setContactDetails(
			CreateOrganizationRequest.ContactDetails contacts,
			Organization organization) {

		// Validate phone numbers
		LinkedHashSet<PhoneDetails> validatePhoneDetails = phoneService.validatePhones(contacts.phoneNo(),
				Optional.of(organization.getCountry()));

		organization.setContactDetails(
				contacts.countryCode(),
				contacts.countryCode(),
				contacts.address(),
				validatePhoneDetails,
				contacts.email(),
				contacts.website(),
				contacts.externalLinks());
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
