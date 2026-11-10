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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import org.merra.multitenancy.TenantContext;
import org.merra.multitenancy.TenantInfo;
import org.merra.multitenancy.TenantProvisioner;
import org.merra.multitenancy.TenantResolver;
import org.merra.utilities.InvoiceConstants;
import org.merra.utilities.RedisKeys;
import org.merra.utilities.SecurityUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotBlank;

@Service
@Validated
public class OrganizationService {
	private static final Logger logger = LoggerFactory.getLogger(OrganizationService.class);

	private final OrganizationRepository organizationRepository;
	private final OrganizationTypeRepository organizationTypeRepository;
	private final OrganizationMembersRepository organizationMembersRepository;
	private final AddressTypeRepository addressTypeRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;
	private final InvoiceRepository invoiceRepository;
	private final AccountService accountService;
	private final CountryRepository countryRepository;
	private final UserAccountService userAccountService;
	private final UserAccountRepository userAccountRepository;
	private final OrganizationMapper organizationMapper;
	private final OrganizationAffiliationMapper organizationAffiliationMapper;
	private final RedisTemplate<String, Object> redisTemplate;
	private final org.merra.multitenancy.TenantProvisioner tenantProvisioner;

	public OrganizationService(
			OrganizationRepository organizationRepository,
			UserAccountService userAccountService,
			OrganizationTypeRepository organizationTypeRepository,
			AddressTypeRepository addressTypeRepository,
			OrganizationMembersRepository organizationMembersRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			InvoiceRepository invoiceRepository,
			AccountService accountService,
			CountryRepository countryRepository,
			UserAccountRepository userAccountRepository,
			OrganizationMapper organizationMapper,
			OrganizationAffiliationMapper organizationAffiliationMapper,
			RedisTemplate<String, Object> redisTemplate) {
		this(organizationRepository, userAccountService, organizationTypeRepository, addressTypeRepository,
				organizationMembersRepository, userWorkspaceStateRepository, invoiceRepository, accountService,
				countryRepository, userAccountRepository, organizationMapper, organizationAffiliationMapper,
				redisTemplate, null);
	}

	@org.springframework.beans.factory.annotation.Autowired
	public OrganizationService(
			OrganizationRepository organizationRepository,
			UserAccountService userAccountService,
			OrganizationTypeRepository organizationTypeRepository,
			AddressTypeRepository addressTypeRepository,
			OrganizationMembersRepository organizationMembersRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			InvoiceRepository invoiceRepository,
			AccountService accountService,
			CountryRepository countryRepository,
			UserAccountRepository userAccountRepository,
			OrganizationMapper organizationMapper,
			OrganizationAffiliationMapper organizationAffiliationMapper,
			RedisTemplate<String, Object> redisTemplate,
			@org.springframework.beans.factory.annotation.Autowired(required = false) org.merra.multitenancy.TenantProvisioner tenantProvisioner) {
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
		this.countryRepository = countryRepository;
		this.addressTypeRepository = addressTypeRepository;
		this.userAccountRepository = userAccountRepository;
		this.tenantProvisioner = tenantProvisioner;
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
		OrganizationMetaDataResponse organizationMetaData = null;
		try {
			Object cached = redisTemplate.opsForValue().get(RedisKeys.ORGANIZATION_METADATA);
			if (cached instanceof OrganizationMetaDataResponse omd) {
				organizationMetaData = omd;
			}
		} catch (Exception e) {
			logger.warn("Failed to retrieve organization metadata from Redis: {}", e.getMessage());
		}

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
			try {
				redisTemplate.opsForValue().set(RedisKeys.ORGANIZATION_METADATA, organizationMetaData,
						RedisKeys.CONSTANT_DURATION);
			} catch (Exception e) {
				logger.warn("Failed to cache organization metadata to Redis: {}", e.getMessage());
			}
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
		List<CountriesResponse> getCountries = null;

		// 1. Try querying Redis cache
		try {
			Object cached = redisTemplate.opsForValue().get(RedisKeys.COUNTRY_METADATA);
			if (cached instanceof CountriesCache cc && cc.countries() != null && !cc.countries().isEmpty()) {
				getCountries = cc.countries();
			} else if (cached instanceof List<?> list && !list.isEmpty()) {
				List<CountriesResponse> mapped = new ArrayList<>();
				for (Object item : list) {
					if (item instanceof CountriesResponse cr) {
						mapped.add(cr);
					}
				}
				if (!mapped.isEmpty()) {
					getCountries = mapped;
				}
			}
		} catch (Exception e) {
			logger.warn("Failed to query Redis for country metadata: {}", e.getMessage());
		}

		// 2. Fallback to database lookup if cache miss
		if (getCountries == null || getCountries.isEmpty()) {
			try {
				List<org.merra.entities.Country> countries = countryRepository.findAll();
				if (!countries.isEmpty()) {
					getCountries = countries.stream().map(country -> new CountriesResponse(
							country.getId(),
							country.getCommon() != null && !country.getCommon().isBlank() ? country.getCommon() : country.getOfficial(),
							country.getAlpha2(),
							country.getAlpha3(),
							country.getNumeric(),
							country.getSymbol(),
							country.getCode())).toList();
				}
			} catch (Exception e) {
				logger.error("Failed to query database for country metadata: {}", e.getMessage(), e);
			}
		}

		// 3. Fallback to static fallback list if database is also empty
		if (getCountries == null || getCountries.isEmpty()) {
			try {
				List<org.merra.entities.Country> fallback = getFallbackCountries();
				List<org.merra.entities.Country> saved = countryRepository.saveAll(fallback);
				getCountries = saved.stream().map(country -> new CountriesResponse(
						country.getId(),
						country.getCommon() != null && !country.getCommon().isBlank() ? country.getCommon() : country.getOfficial(),
						country.getAlpha2(),
						country.getAlpha3(),
						country.getNumeric(),
						country.getSymbol(),
						country.getCode())).toList();
			} catch (Exception e) {
				logger.error("Failed to seed fallback countries into database: {}", e.getMessage(), e);
				getCountries = getFallbackCountries().stream().map(country -> new CountriesResponse(
						country.getId() != null ? country.getId() : UUID.randomUUID(),
						country.getCommon() != null && !country.getCommon().isBlank() ? country.getCommon() : country.getOfficial(),
						country.getAlpha2(),
						country.getAlpha3(),
						country.getNumeric(),
						country.getSymbol(),
						country.getCode())).toList();
			}
		}

		// 4. Update Redis cache
		if (getCountries != null && !getCountries.isEmpty()) {
			try {
				redisTemplate.opsForValue().set(RedisKeys.COUNTRY_METADATA, new CountriesCache(getCountries),
						RedisKeys.CONSTANT_DURATION);
			} catch (Exception e) {
				logger.warn("Failed to cache country metadata to Redis: {}", e.getMessage());
			}
		}

		return getCountries != null ? getCountries : List.of();
	}

	private static List<org.merra.entities.Country> getFallbackCountries() {
		return List.of(
				new org.merra.entities.Country("Philippines", "Republic of the Philippines", "PH", "PHL", "608", "₱", "PHP"),
				new org.merra.entities.Country("United States", "United States of America", "US", "USA", "840", "$", "USD"),
				new org.merra.entities.Country("United Kingdom", "United Kingdom of Great Britain and Northern Ireland", "GB", "GBR", "826", "£", "GBP"),
				new org.merra.entities.Country("Canada", "Canada", "CA", "CAN", "124", "$", "CAD"),
				new org.merra.entities.Country("Australia", "Commonwealth of Australia", "AU", "AUS", "036", "$", "AUD"),
				new org.merra.entities.Country("Singapore", "Republic of Singapore", "SG", "SGP", "702", "$", "SGD"),
				new org.merra.entities.Country("Japan", "Japan", "JP", "JPN", "392", "¥", "JPY"),
				new org.merra.entities.Country("Germany", "Federal Republic of Germany", "DE", "DEU", "276", "€", "EUR"),
				new org.merra.entities.Country("France", "French Republic", "FR", "FRA", "250", "€", "EUR"),
				new org.merra.entities.Country("United Arab Emirates", "United Arab Emirates", "AE", "ARE", "784", "د.إ", "AED"),
				new org.merra.entities.Country("New Zealand", "New Zealand", "NZ", "NZL", "554", "$", "NZD"),
				new org.merra.entities.Country("India", "Republic of India", "IN", "IND", "356", "₹", "INR"),
				new org.merra.entities.Country("China", "People's Republic of China", "CN", "CHN", "156", "¥", "CNY"),
				new org.merra.entities.Country("Hong Kong", "Hong Kong", "HK", "HKG", "344", "$", "HKD"),
				new org.merra.entities.Country("Malaysia", "Malaysia", "MY", "MYS", "458", "RM", "MYR"),
				new org.merra.entities.Country("Indonesia", "Republic of Indonesia", "ID", "IDN", "360", "Rp", "IDR"),
				new org.merra.entities.Country("Thailand", "Kingdom of Thailand", "TH", "THA", "764", "฿", "THB"),
				new org.merra.entities.Country("Vietnam", "Socialist Republic of Vietnam", "VN", "VNM", "704", "₫", "VND"),
				new org.merra.entities.Country("Spain", "Kingdom of Spain", "ES", "ESP", "724", "€", "EUR"),
				new org.merra.entities.Country("Italy", "Italian Republic", "IT", "ITA", "380", "€", "EUR"),
				new org.merra.entities.Country("Netherlands", "Kingdom of the Netherlands", "NL", "NLD", "528", "€", "EUR"),
				new org.merra.entities.Country("Switzerland", "Swiss Confederation", "CH", "CHE", "756", "CHF", "CHF"),
				new org.merra.entities.Country("Brazil", "Federative Republic of Brazil", "BR", "BRA", "076", "R$", "BRL"),
				new org.merra.entities.Country("Mexico", "United Mexican States", "MX", "MEX", "484", "$", "MXN"),
				new org.merra.entities.Country("Saudi Arabia", "Kingdom of Saudi Arabia", "SA", "SAU", "682", "﷼", "SAR"),
				new org.merra.entities.Country("South Africa", "Republic of South Africa", "ZA", "ZAF", "710", "R", "ZAR")
		);
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
		boolean checkNameDuplicate = organizationRepository.existsByDisplayNameOrLegalNameIgnoreCase(req.displayName());
		if (checkNameDuplicate) {
			throw new ResourceAlreadyExistsException("Organization name already exists: " + req.displayName());
		}

		// 2. Retrieve the currently authenticated user creating this organization
		UserAccount user = SecurityUtils.getPrincipal(UserAccount.class)
				.orElseThrow(() -> new EntityNotFoundException("No authenticated user found."));

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

		// 8. Persist the organization (id and schema_name are automatically generated in @PrePersist)
		Organization newOrganization = organizationRepository.save(org);

		// 9. Register the user as the organization's creator/owner member
		// The OrganizationMembers constructor sets role = CREATOR, isCreator = true, isInvited = false
		OrganizationMembers member = new OrganizationMembers(newOrganization, user);
		organizationMembersRepository.save(member);

		// 10. Update user account ownership flags and persist changes in a single write
		user.setOwner(true);
		user.setPartOfOrganization(true);
		userAccountRepository.save(user);

		// 11. Cache tenant metadata in Redis
		String tenantSchema = newOrganization.getSchemaName();
		redisTemplate.opsForValue().set(
				RedisKeys.getTenantInfoKey(newOrganization.getId()),
				new TenantInfo(tenantSchema, newOrganization.getStatus().name()),
				RedisKeys.CONSTANT_DURATION);

		// 12. Provision the dedicated database schema for the new organization
		if (tenantProvisioner != null) {
			tenantProvisioner.provisionTenant(newOrganization.getId());
		}

		// 13. Switch to tenant schema to provision default chart of accounts
		try {
			TenantContext.setCurrentTenant(tenantSchema);
			accountService.createDefaultAccounts(newOrganization);
		} finally {
			TenantContext.clear();
		}

		// 14. Set or update the active workspace state for the user
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
    return organizationTypeRepository.findById(type)
            .orElseThrow(() -> new EntityNotFoundException("Organization type not found: " + type));
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

		if (req.address() != null) {
			final String requestEmail = req.address().email();
			if (requestEmail != null && !Objects.equals(requestEmail, currentOrganization.getEmail())) {
				currentOrganization.setEmail(requestEmail);
			}

			final String requestCountry = req.address().country();
			if (requestCountry != null && !Objects.equals(requestCountry, currentOrganization.getCountry())) {
				currentOrganization.setCountry(requestCountry);
			}

			final String requestCurrency = req.address().currency();
			if (requestCurrency != null && !Objects.equals(requestCurrency, currentOrganization.getDefaultCurrency())) {
				currentOrganization.setDefaultCurrency(requestCurrency);
			}

			final String requestTimeZone = req.address().timeZone();
			if (requestTimeZone != null && !Objects.equals(requestTimeZone, currentOrganization.getTimeZone())) {
				currentOrganization.setTimeZone(requestTimeZone);
			}

			if (req.address().addresses() != null) {
				updateOrganizationAddresses(currentOrganization, req.address().addresses());
			}
		}

		if (req.website() != null && !Objects.equals(req.website(), currentOrganization.getWebsite())) {
			currentOrganization.setWebsite(req.website());
		}

		if (req.financialYear() != null && req.financialYear().yearEndDay() != null && req.financialYear().yearEndMonth() != null) {
			try {
				int day = Integer.parseInt(req.financialYear().yearEndDay());
				int month = Integer.parseInt(req.financialYear().yearEndMonth());
				currentOrganization.setFinancialYear(new FinancialYearEmb(day, month));
			} catch (NumberFormatException ignored) {
			}
		}

		organizationRepository.save(currentOrganization);
		return organizationMapper.toCurrentOrganizationResponse(currentOrganization);
	}

	private void updateOrganizationAddresses(Organization org, List<CurrentOrganizationResponse.Contact.Address> addressDtos) {
		if (org.getAddresses() == null) {
			org.setAddresses(new ArrayList<>());
		} else {
			org.getAddresses().clear();
		}

		if (addressDtos == null || addressDtos.isEmpty()) {
			return;
		}

		List<AddressType> allAddressTypes = addressTypeRepository.findAll();
		for (CurrentOrganizationResponse.Contact.Address add : addressDtos) {
			if (add == null) continue;
			AddressType type = null;
			if (add.type() != null) {
				type = allAddressTypes.stream()
						.filter(t -> t.getName().equalsIgnoreCase(add.type()) ||
								(t.getId() != null && t.getId().toString().equalsIgnoreCase(add.type())))
						.findFirst()
						.orElse(null);
			}
			if (type == null && !allAddressTypes.isEmpty()) {
				type = allAddressTypes.get(0);
			}
			if (type == null) {
				type = addressTypeRepository.save(new AddressType(add.type() != null ? add.type() : "STREET", "Default Address Type"));
			}

			Map<String, String> addressMap = new HashMap<>();
			if (add.addresses() != null) {
				for (int i = 0; i < add.addresses().size(); i++) {
					String line = add.addresses().get(i);
					if (line != null && !line.isBlank()) {
						addressMap.put("address" + (i + 1), line.trim());
					}
				}
			}
			if (addressMap.isEmpty()) {
				addressMap.put("address1", "N/A");
			}

			OrganizationAddresses orgAddress = new OrganizationAddresses();
			orgAddress.setAddresses(addressMap);
			orgAddress.setCity(add.city() != null && !add.city().isBlank() ? add.city() : "N/A");
			orgAddress.setPostalCode(add.postalCode() != null && !add.postalCode().isBlank() ? add.postalCode() : "N/A");
			orgAddress.setCountry(add.country() != null && !add.country().isBlank() ? add.country() : "N/A");
			orgAddress.setType(type);
			orgAddress.setOrganization(org);

			org.getAddresses().add(orgAddress);
		}
	}
}
