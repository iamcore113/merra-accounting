package org.merra.services;

import java.util.EnumSet;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.NewOrganizationResponse;
import org.merra.dto.OrganizationMetaDataResponse;
import org.merra.dto.UserOrganizationResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationType;
import org.merra.entities.embedded.FinancialYearEmb;
import org.merra.entities.embedded.OrganizationUsersEmb;
import org.merra.entities.embedded.PaymentTermsEmb;
import org.merra.enums.AddressEn;
import org.merra.enums.PaymentTermTypes;
import org.merra.enums.PaymentTermsEn;
import org.merra.enums.UserAccountStatusEn;
import org.merra.mapper.OrganizationMapper;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.repositories.projections.OrganizationUsersLookup;
import org.merra.services.phone.PhoneService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;

@Service
public class OrganizationService {
	private final OrganizationRepository organizationRepository;
	private final OrganizationTypeRepository organizationTypeRepository;
	private final AccountService accountService;
	private final UserAccountService userAccountService;
	private final OrganizationMapper organizationMapper;

	public OrganizationService(
			OrganizationRepository organizationRepository,
			UserAccountService userAccountService,
			OrganizationTypeRepository organizationTypeRepository,
			AccountService accountService,
			PhoneService phoneService,
			OrganizationMapper organizationMapper) {
		this.organizationRepository = organizationRepository;
		this.userAccountService = userAccountService;
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

	@Cacheable("organizationMetadata")
	public OrganizationMetaDataResponse returnOrganizationMetaData() {
		// Get organization types
		Set<OrganizationMetaDataResponse.OrganizationTypesMetaData> organizationTypes = organizationTypeRepository
				.findAll()
				.stream()
				.map(type -> new OrganizationMetaDataResponse.OrganizationTypesMetaData(
						type.getId(),
						type.getName().contains("_") ? type.getName().replace("_", " ") : type.getName()))
				.collect(java.util.stream.Collectors.toSet());
		final EnumSet<AddressEn> addresses = EnumSet.allOf(AddressEn.class);
		// For Payment terms
		final EnumSet<PaymentTermsEn> subElements = EnumSet.allOf(PaymentTermsEn.class);
		final EnumSet<PaymentTermTypes> types = EnumSet.allOf(PaymentTermTypes.class);
		return new OrganizationMetaDataResponse(organizationTypes, addresses,
				new OrganizationMetaDataResponse.PaymentTermsMetaData(subElements, types));
	}

	@Transactional
	public NewOrganizationResponse createNewOrganization(UUID userId, CreateOrganizationRequest req) {

		Organization org = getOrganizationObject(null); // New organization object

		// Set organization user as MEMBER role
		userAccountService.setUserRole(userId, UserAccountStatusEn.MEMBER);
		// Set the user as ADVISOR role in the organization
		String setRole = UserAccountStatusEn.ADVISOR.name();
		OrganizationUsersEmb organizationUsersEmb = new OrganizationUsersEmb(userId, setRole);	
		org.setOrganizationUsers(new java.util.HashSet<>(Set.of(organizationUsersEmb)));
		
		// Profile image will default to null; set via organization settings if needed
		org.setProfileImage(null);

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

		Organization newOrganization = organizationRepository.save(org);
		// create organization's default ledger accounts
		accountService.createDefaultAccounts(newOrganization);

		var checkUserFullName = userAccountService.returnAccountFullName(userId);
		boolean userInfoPresent = true;
		String userfullName = null;
		if (checkUserFullName.isEmpty()) {
			userInfoPresent = false;
		} else {
			userfullName = checkUserFullName.get();
		}
		return new NewOrganizationResponse(newOrganization.getId(), new NewOrganizationResponse.UserDetails(userId, userInfoPresent, userfullName));

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
	public UserOrganizationResponse getUserOrganizations(@NotNull UUID userId) {
		var getUserAccount = userAccountService.retrieveById(userId);
		Set<OrganizationUsersLookup> organizations = organizationRepository.findOrganizationsByUserId(userId);
		return organizationMapper.toOrganizationUserDetails(organizations, getUserAccount);
	}
}
