package org.merra.services;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.merra.dto.CountriesCache;
import org.merra.dto.CountriesResponse;
import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.CurrentOrganizationResponse;
import org.merra.dto.NewOrganizationResponse;
import org.merra.dto.OrganizationDashboardResponse;
import org.merra.dto.OrganizationMetaDataResponse;
import org.merra.dto.UserOrganizationAffiliation;
import org.merra.entities.AddressType;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationAddresses;
import org.merra.entities.OrganizationMembers;
import org.merra.entities.OrganizationType;
import org.merra.entities.UserAccount;
import org.merra.entities.UserWorkspaceState;
import org.merra.entities.embedded.FinancialYearEmb;
import org.merra.entities.embedded.PaymentTermsEmb;
import org.merra.enums.AddressEn;
import org.merra.enums.PaymentTermTypes;
import org.merra.enums.PaymentTermsEn;
import org.merra.enums.UserAccountStatusEn;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.mapper.OrganizationAffiliationMapper;
import org.merra.mapper.OrganizationMapper;
import org.merra.repositories.AddressTypeRepository;
import org.merra.repositories.CountryRepository;
import org.merra.repositories.InvoiceRepository;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.repositories.projections.UserOrganizationAffiliations;
import org.merra.service.AuthService;
import org.merra.services.phone.PhoneService;
import org.merra.utilities.InvoiceConstants;
import org.merra.utilities.RedisKeys;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import jakarta.persistence.EntityNotFoundException;

@Service
@Validated
public class OrganizationService {
	private final OrganizationRepository organizationRepository;
	private final OrganizationTypeRepository organizationTypeRepository;
	private final OrganizationMembersRepository organizationMembersRepository;
	private final AddressTypeRepository addressTypeRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;
	private final InvoiceRepository invoiceRepository;
	private final AccountService accountService;
	private final AuthService authService;
	private final CountryRepository countryRepository;
	private final UserAccountService userAccountService;
	private final UserAccountRepository userAccountRepository;
	private final OrganizationMapper organizationMapper;
	private final OrganizationAffiliationMapper organizationAffiliationMapper;
	private final RedisTemplate<String, Object> redisTemplate;

	public OrganizationService(
			OrganizationRepository organizationRepository,
			UserAccountService userAccountService,
			OrganizationTypeRepository organizationTypeRepository,
			AddressTypeRepository addressTypeRepository,
			OrganizationMembersRepository organizationMembersRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			InvoiceRepository invoiceRepository,
			AccountService accountService,
			AuthService authService,
			CountryRepository countryRepository,
			UserAccountRepository userAccountRepository,
			PhoneService phoneService,
			OrganizationMapper organizationMapper,
			OrganizationAffiliationMapper organizationAffiliationMapper,
			RedisTemplate<String, Object> redisTemplate) {
		this.redisTemplate = redisTemplate;
		this.organizationRepository = organizationRepository;
		this.organizationMembersRepository = organizationMembersRepository;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
		this.userAccountService = userAccountService;
		this.invoiceRepository = invoiceRepository;
		this.organizationMapper = organizationMapper;
		this.organizationAffiliationMapper = organizationAffiliationMapper;
		this.organizationTypeRepository = organizationTypeRepository;
		this.accountService = accountService;
		this.authService = authService;
		this.countryRepository = countryRepository;
		this.addressTypeRepository = addressTypeRepository;
		this.userAccountRepository = userAccountRepository;
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
		Optional<Organization> OptOrganization = Optional.empty();

		if (obj == null) {
			OptOrganization = Optional.of(new Organization());
		} else if (obj instanceof UUID id) {
			OptOrganization = organizationRepository
					.findById(id);

			if (OptOrganization.isEmpty()) {
				throw new NoSuchElementException("Organization entity cannot be found.");
			}
		}

		return OptOrganization.get();
	}

	/**
	 * Retrieves metadata for organization configuration, including organization
	 * types,
	 * supported address fields, and payment terms metadata.
	 * <p>
	 * This method first attempts to fetch the metadata from Redis cache. If it is a
	 * cache miss,
	 * it queries all organization types from the database, maps their names to a
	 * user-friendly format,
	 * collects supported address and payment term configurations, caches the
	 * assembled metadata response,
	 * and returns it.
	 * </p>
	 *
	 * @return an {@link OrganizationMetaDataResponse} containing the organization
	 *         metadata.
	 */
	public OrganizationMetaDataResponse metadata() {
		// Get organization types from cache
		OrganizationMetaDataResponse organizationMetaData = (OrganizationMetaDataResponse) redisTemplate
				.opsForValue().get(RedisKeys.ORGANIZATION_METADATA);

		if (organizationMetaData == null) {
			Set<OrganizationMetaDataResponse.OrganizationTypesMetaData> organizationTypes = organizationTypeRepository
					.findAll()
					.stream()
					.map(type -> new OrganizationMetaDataResponse.OrganizationTypesMetaData(
							type.getId(),
							type.getName().contains("_") ? type.getName().replace("_", " ") : type.getName()))
					.collect(java.util.stream.Collectors.toSet());
			Set<OrganizationMetaDataResponse.OrganizationAddressType> organizationAddressTypes = addressTypeRepository
					.findAll()
					.stream()
					.map(type -> new OrganizationMetaDataResponse.OrganizationAddressType(
							type.getId(),
							type.getName().contains("_") ? type.getName().replace("_", " ") : type.getName()))
					.collect(java.util.stream.Collectors.toSet());
			final EnumSet<AddressEn> addresses = EnumSet.allOf(AddressEn.class);
			// For Payment terms
			final EnumSet<PaymentTermsEn> subElements = EnumSet.allOf(PaymentTermsEn.class);
			final EnumSet<PaymentTermTypes> types = EnumSet.allOf(PaymentTermTypes.class);
			organizationMetaData = new OrganizationMetaDataResponse(
					organizationTypes,
					addresses,
					new OrganizationMetaDataResponse.PaymentTermsMetaData(subElements, types),
					organizationAddressTypes);
			// Cache the result for 3 hour
			redisTemplate.opsForValue().set(RedisKeys.ORGANIZATION_METADATA, organizationMetaData,
					RedisKeys.CONSTANT_DURATION);
		}
		return organizationMetaData;
	}

	/**
	 * Fetches all country metadata.
	 * <p>
	 * This method first attempts to retrieve the country metadata from the Redis
	 * cache.
	 * If not cached, it queries the database for all countries, maps them to
	 * {@link CountriesResponse}
	 * DTOs, saves them to the Redis cache with a constant duration, and returns the
	 * result.
	 * </p>
	 *
	 * @return a list of {@link CountriesResponse} objects representing all
	 *         countries
	 */
	public List<CountriesResponse> fetchCountries() {
		CountriesCache countriesCache = (CountriesCache) redisTemplate.opsForValue()
				.get(RedisKeys.COUNTRY_METADATA);
		List<CountriesResponse> getCountries = countriesCache != null ? countriesCache.countries() : null;
		if (getCountries == null) {
			getCountries = countryRepository.findAll().stream().map(country -> new CountriesResponse(
					country.getId(),
					country.getOfficial(),
					country.getAlpha2(),
					country.getAlpha3(),
					country.getNumeric(),
					country.getSymbol(),
					country.getCode())).toList();
			redisTemplate.opsForValue().set(RedisKeys.COUNTRY_METADATA, new CountriesCache(getCountries),
					RedisKeys.CONSTANT_DURATION);
		}
		return getCountries;
	}

	/**
	 * Creates a new organization for the authenticated user and initializes its
	 * default membership and accounts.
	 *
	 * @param req The request payload containing the organization details to
	 *            persist.
	 * @return A {@linkplain NewOrganizationResponse} containing the created
	 *         organization identifier and creator details.
	 * @throws IllegalStateException    If the user identifier is missing from the
	 *                                  tenant context.
	 * @throws IllegalArgumentException If the organization type identifier in the
	 *                                  request is null.
	 * @throws EntityNotFoundException  If the requested organization type cannot be
	 *                                  found.
	 */
	@Transactional
	public NewOrganizationResponse newOrganization(CreateOrganizationRequest req) {

		Organization org = getOrganizationObject(null); // New organization object

		UserAccount user = authService.getCurrentAuthenticatedUser();

		// Set organization user as MEMBER role
		userAccountService.setUserRole(user, UserAccountStatusEn.MEMBER);

		// Profile image will default to null; set via organization settings if needed
		org.setLogo(null);

		OrganizationType organizationType = getOrganizationType(req.type());
		FinancialYearEmb financialYearEmb = new FinancialYearEmb(
				req.financialYear().yearEndDay(),
				req.financialYear().yearEndMonth());

		// Set organization basic information
		org.setBasicInformation(req.displayName(), organizationType, req.email(), req.country(), financialYearEmb,
				req.currency());

		// Set required fields: timeZone and paymentTerms
		org.setTimeZone("UTC");
		org.setPaymentTerms(new PaymentTermsEmb());
		// Set the organization address
		setAddresses(org, req.addresses());

		Organization newOrganization = organizationRepository.save(org);

		try {
			// Set the user to creator member ~ constructor for initializing the creator
			// member
			OrganizationMembers member = new OrganizationMembers(newOrganization, user);
			organizationMembersRepository.save(member);

			// Update the user instance
			user.setOwner(true);
			user.setPartOfOrganization(true);
			userAccountRepository.save(user);
		} catch (Exception e) {
			throw new RuntimeException("Failed to register creator member: " + e.getMessage(), e);
		}

		// create organization's default ledger accounts
		accountService.createDefaultAccounts(newOrganization);

		// Set the newly created organization as the user's active workspace
		UserWorkspaceState setWorkspace = new UserWorkspaceState(user, newOrganization, OffsetDateTime.now());
		userWorkspaceStateRepository.save(setWorkspace);

		Optional<String> checkUserFullName = user.getFullName();
		boolean userInfoPresent = true;
		String userfullName = null;
		if (checkUserFullName.isEmpty()) {
			userInfoPresent = false;
		} else {
			userfullName = checkUserFullName.get();
		}

		return organizationMapper.newOrganizationResponse(newOrganization.getId(), user.getUserId(), userInfoPresent,
				userfullName);
	}

	private void setAddresses(Organization org, List<CreateOrganizationRequest.Addresses> addresses) {
		List<OrganizationAddresses> organizationAddresses = new ArrayList<>();
		for (CreateOrganizationRequest.Addresses add : addresses) {
			AddressType type = addressTypeRepository.findById(add.type())
					.orElseThrow(() -> new EntityNotFoundException("Address type not found"));
			Map<String, String> addressess = new HashMap<>();
			if (add.addresses().size() > 1) {
				addressess = Map.of(
						"address1", add.addresses().get(0),
						"address2", add.addresses().get(1));
			} else {
				addressess = Map.of(
						"address1", add.addresses().get(0));
			}

			OrganizationAddresses orgAddress = new OrganizationAddresses();
			orgAddress.setAddresses(addressess);
			orgAddress.setCity(add.city());
			orgAddress.setPostalCode(add.postalCode());
			orgAddress.setCountry(add.country());
			orgAddress.setAttentionTo(add.attentionTo());
			orgAddress.setType(type);
			orgAddress.setOrganization(org);

			organizationAddresses.add(orgAddress);
		}
		org.setAddresses(organizationAddresses);
	}

	/**
	 * Retrieves the organization type entity associated with the supplied
	 * identifier.
	 *
	 * @param type The unique identifier of the organization type to resolve.
	 * @return The matching {@linkplain OrganizationType} entity.
	 * @throws IllegalArgumentException If the organization type identifier is null.
	 * @throws EntityNotFoundException  If no organization type exists for the
	 *                                  supplied identifier.
	 */
	private OrganizationType getOrganizationType(UUID type) {
		if (type == null) {
			throw new IllegalArgumentException("Organization type is required");
		}

		OrganizationType getOrganizationType = organizationTypeRepository.findById(type)
				.orElseThrow(() -> new EntityNotFoundException("Organization type not found"));

		return getOrganizationType;
	}

	/**
	 * Retrieves dashboard statistics for the current organization of the
	 * authenticated user.
	 * <p>
	 * This method fetches the current organization from the user's workspace state,
	 * then queries the count of invoices
	 * for each status (DRAFT, SUBMITTED, AUTHORISED). The results are collected
	 * into a map and mapped to a dashboard response DTO.
	 * </p>
	 *
	 * @return an {@link OrganizationDashboardResponse} containing invoice counts by
	 *         status for the current organization
	 */
	public OrganizationDashboardResponse getOrganizationDashboard() {
		Organization getOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

		// Query the count of invoices for each status (DRAFT, SUBMITTED, AUTHORISED)
		Integer draftCount = invoiceRepository.countInvoiceStatusByOrganization(InvoiceConstants.INVOICE_STATUS_DRAFT,
				getOrganization);
		Integer submittedCount = invoiceRepository
				.countInvoiceStatusByOrganization(InvoiceConstants.INVOICE_STATUS_SUBMITTED, getOrganization);
		Integer authorisedCount = invoiceRepository
				.countInvoiceStatusByOrganization(InvoiceConstants.INVOICE_STATUS_AUTHORISED, getOrganization);

		Map<String, Integer> invoicesCountsMap = Map.of(
				InvoiceConstants.INVOICE_STATUS_DRAFT, draftCount,
				InvoiceConstants.INVOICE_STATUS_SUBMITTED, submittedCount,
				InvoiceConstants.INVOICE_STATUS_AUTHORISED, authorisedCount);

		return organizationMapper.toOrganizationDashboardResponse(invoicesCountsMap);
	}

	/**
	 * Retrieves all organization affiliations for the currently authenticated user,
	 * including the user's role in each organization and the total membership
	 * count.
	 *
	 * @return a {@linkplain UserOrganizationAffiliation} containing the list of
	 *         affiliated organizations with their roles and the total affiliation
	 *         count.
	 */
	public UserOrganizationAffiliation getUserOrganizationAffiliation() {
		List<UserOrganizationAffiliations> organizations = organizationMembersRepository
				.findUserOrganizationAffiliations();
		Long organizationCount = organizationMembersRepository.countByUserOrganizationAffiliation();

		return organizationAffiliationMapper.toUserOrganizationAffiliation(organizations, organizationCount);
	}

	/**
	 * Retrieves the current organization details for the currently authenticated
	 * user based on their active workspace state session.
	 *
	 * @return a {@link CurrentOrganizationResponse} containing the current
	 *         organization details.
	 */
	public CurrentOrganizationResponse getCurrentOrganization() {
		Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
		return organizationMapper.toCurrentOrganizationResponse(currentOrganization);
	}

	public CurrentOrganizationResponse updateCurrentOrganization(CurrentOrganizationResponse req) {
		final UUID organizationId = req.organizationId();
		Optional<Organization> organizationOpt = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal();
		Organization currentOrganization = organizationOpt.get();

		if (currentOrganization == null) {
			throw new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION);
		}
		final UUID currentOrganizationId = currentOrganization.getId();
		if (!organizationId.equals(currentOrganizationId)) {
			throw new IllegalArgumentException("Organization ID does not match the current organization ID.");
		}

		final String requestDisplayName = req.names().displayName();
		final String requestLegalName = req.names().legalName();
		final String requestDescription = req.names().description();

		if (!Objects.equals(requestDisplayName, currentOrganization.getDisplayName())) {
			currentOrganization.setDisplayName(requestDisplayName);
		}

		if (!Objects.equals(requestLegalName, currentOrganization.getLegalName())) {
			currentOrganization.setLegalName(requestLegalName);
		}

		if (!Objects.equals(requestDescription, currentOrganization.getOrganizationDescription())) {
			currentOrganization.setOrganizationDescription(requestDescription);
		}

		final UUID requestOrganizationType = req.organizationType().typeId();
		final UUID currentOrganizationType = currentOrganization.getOrganizationType().getId();

		if (!Objects.equals(requestOrganizationType, currentOrganizationType)) {
			currentOrganization.setOrganizationType(organizationTypeRepository.findById(requestOrganizationType)
					.orElseThrow(
							() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ORGANIZATION_TYPE)));
		}

		final String requestEmail = req.address().email();

		if (!Objects.equals(requestEmail, currentOrganization.getEmail())) {
			currentOrganization.setEmail(requestEmail);
		}

		organizationRepository.save(currentOrganization);
		return organizationMapper.toCurrentOrganizationResponse(currentOrganization);
	}
}
