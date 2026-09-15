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
import org.merra.exception.ResourceAlreadyExistsException;
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
import jakarta.validation.constraints.NotBlank;

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
	 * Checks if an organization with the given display name exists.
	 * 
	 * @param name The display name to check for existence.
	 * @return true if an organization with the given display name exists, false
	 *         otherwise.
	 */
	public boolean nameCheck(@NotBlank(message = "Organization name cannot be blank.") String name) {
		return organizationRepository.existsByDisplayNameIgnoreCase(name);
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
	 * Creates a new organization for the authenticated user, initializes default chart of accounts,
	 * assigns creator membership, and sets the active workspace context for the user.
	 *
	 * @param req The request payload containing the organization details to persist.
	 * @return A {@linkplain NewOrganizationResponse} containing the created organization identifier and creator details.
	 * @throws ResourceAlreadyExistsException If an organization with the same display name or legal name already exists.
	 * @throws EntityNotFoundException If the requested organization type or address type cannot be found.
	 */
	@Transactional
	public NewOrganizationResponse newOrganization(CreateOrganizationRequest req) {

		// 1. Check if an organization with the given display name or legal name already exists
		boolean checkNameExist = organizationRepository.existsByDisplayNameOrLegalNameIgnoreCase(req.displayName());
		if (checkNameExist) {
			throw new ResourceAlreadyExistsException("Organization name already exists: " + req.displayName());
		}

		// 2. Retrieve the currently authenticated user creating this organization
		UserAccount user = authService.getCurrentAuthenticatedUser();

		// 3. Resolve the organization type entity
		OrganizationType organizationType = getOrganizationType(req.type());

		// 4. Construct the financial year embedded configuration
		FinancialYearEmb financialYearEmb = new FinancialYearEmb(
				req.financialYear().yearEndDay(),
				req.financialYear().yearEndMonth());

		// 5. Initialize the new Organization entity and populate its basic details
		Organization org = new Organization();
		org.setBasicInformation(
				req.displayName(),
				organizationType,
				req.email(),
				req.country(),
				financialYearEmb,
				req.currency());

		// 6. Set organization default configurations
		org.setTimeZone("UTC");
		org.setPaymentTerms(new PaymentTermsEmb());
		org.setLogo(null);

		// 7. Map and attach organization addresses if provided
		if (req.addresses() != null && !req.addresses().isEmpty()) {
			setAddresses(org, req.addresses());
		}

		// 8. Persist the organization to generate its unique identifier
		Organization newOrganization = organizationRepository.save(org);

		// 9. Register the user as the organization's creator/owner member
		// The OrganizationMembers constructor sets role = CREATOR, isCreator = true, isInvited = false
		OrganizationMembers member = new OrganizationMembers(newOrganization, user);
		organizationMembersRepository.save(member);

		// 10. Update user account ownership flags and persist changes in a single write
		user.setOwner(true);
		user.setPartOfOrganization(true);
		userAccountRepository.save(user);

		// 11. Provision the default chart of accounts for the new organization
		accountService.createDefaultAccounts(newOrganization);

		// 12. Set or update the active workspace state for the user
		// Uses upsert semantics to prevent unique constraint violations on user_id when creating multiple organizations
		UserWorkspaceState workspace = userWorkspaceStateRepository.findByUser(user)
				.orElseGet(() -> new UserWorkspaceState(user, newOrganization));
		workspace.setCurrentOrganization(newOrganization);
		workspace.setLastActiveAt(OffsetDateTime.now());
		userWorkspaceStateRepository.save(workspace);

		// 13. Check if user full name is present and map the response DTO
		String userFullName = user.getFullName().orElse(null);
		boolean userInfoPresent = userFullName != null;

		return organizationMapper.newOrganizationResponse(
				newOrganization.getId(),
				user.getUserId(),
				userInfoPresent,
				userFullName);
	}

	/**
	 * Maps address request DTOs to {@link OrganizationAddresses} entities and associates them with the organization.
	 *
	 * @param org The {@link Organization} entity to attach the addresses to.
	 * @param addresses The list of address DTOs from the request payload.
	 * @throws EntityNotFoundException If an address type identifier does not exist.
	 */
	private void setAddresses(Organization org, List<CreateOrganizationRequest.Addresses> addresses) {
		if (addresses == null || addresses.isEmpty()) {
			return;
		}

		List<OrganizationAddresses> organizationAddresses = new ArrayList<>();
		for (CreateOrganizationRequest.Addresses add : addresses) {
			AddressType type = addressTypeRepository.findById(add.type())
					.orElseThrow(() -> new EntityNotFoundException("Address type not found: " + add.type()));

			// Map address lines dynamically into key-value pairs (e.g. address1, address2, ...)
			Map<String, String> addressMap = new HashMap<>();
			if (add.addresses() != null) {
				for (int i = 0; i < add.addresses().size(); i++) {
					String line = add.addresses().get(i);
					if (line != null && !line.isBlank()) {
						addressMap.put("address" + (i + 1), line);
					}
				}
			}

			OrganizationAddresses orgAddress = new OrganizationAddresses();
			orgAddress.setAddresses(addressMap);
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
