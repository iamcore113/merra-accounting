package org.merra.mapper;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.merra.dto.CurrentOrganizationResponse;
import org.merra.dto.NewOrganizationResponse;
import org.merra.dto.OrganizationDashboardResponse;
import org.merra.dto.UserOrganizationResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationType;
import org.merra.enums.StatusEn;
import org.merra.entities.UserAccount;
import org.merra.repositories.projections.OrganizationsOnly;
import org.merra.utilities.InvoiceConstants;

@Mapper(componentModel = "spring")
public interface OrganizationMapper {
	/**
	 * Maps a map of invoice status counts into an OrganizationDashboardResponse.
	 * Delegates the conversion of the raw status count map to a structured
	 * InvoiceStatusCount object via the "mapInvoiceStatusCounts" qualifier.
	 *
	 * @param invoiceStatusCounts A map where keys are invoice status strings
	 *                            (e.g., "DRAFT", "SUBMITTED", "AUTHORISED")
	 *                            and values are the count of invoices per status
	 * @return An OrganizationDashboardResponse containing the structured invoice
	 *         status counts
	 */
	@Mappings({
			@Mapping(target = "invoiceStatusCount", source = "invoiceStatusCounts", qualifiedByName = "mapInvoiceStatusCounts")
	})
	OrganizationDashboardResponse toOrganizationDashboardResponse(Map<String, Integer> invoiceStatusCounts);

	/**
	 * Converts a raw map of invoice status counts into a structured
	 * InvoiceStatusCount object.
	 * Extracts the count for each known status (DRAFT, SUBMITTED, AUTHORIZED) from
	 * the map.
	 *
	 * @param invoiceStatusCounts The raw status-to-count map
	 * @return A structured InvoiceStatusCount with individual count fields
	 */
	@Named("mapInvoiceStatusCounts")
	default OrganizationDashboardResponse.InvoiceStatusCount mapInvoiceStatusCounts(
			Map<String, Integer> invoiceStatusCounts) {
		return new OrganizationDashboardResponse.InvoiceStatusCount(
				invoiceStatusCounts.get(InvoiceConstants.INVOICE_STATUS_DRAFT),
				invoiceStatusCounts.get(InvoiceConstants.INVOICE_STATUS_SUBMITTED),
				invoiceStatusCounts.get(InvoiceConstants.INVOICE_STATUS_AUTHORISED));
	}

	/**
	 * Maps a single OrganizationsOnly projection and a UserAccount into a
	 * UserOrganizationResponse.
	 * The organization data is converted to OrganizationDetails via
	 * "mapUserBelongOrganizations",
	 * and the user account is converted to UserDetails via "mapUserDetails".
	 *
	 * @param organizations A projection containing the organization the user
	 *                      belongs to
	 * @param userAccount   The authenticated user's account details
	 * @return A UserOrganizationResponse with both user and organization details
	 *         populated
	 */
	@Mappings({
			@Mapping(target = "organizations", source = "organizations", qualifiedByName = "mapUserBelongOrganizations"),
			@Mapping(target = "userDetails", source = "userAccount", qualifiedByName = "mapUserDetails")
	})
	UserOrganizationResponse toUserOrganizationResponse(OrganizationsOnly organizations, UserAccount userAccount);

	@Mappings({
		@Mapping(target = "organizationId", source = "id"),
		@Mapping(target = "organizationType", source = "organizationType", qualifiedByName = "mapOrganizationTypeResponse"),
		@Mapping(target = "names", source = "organization", qualifiedByName = "mapNamesResponse"),
		@Mapping(target = "address", source = "organization", qualifiedByName = "mapAddressResponse"),
		@Mapping(target = "website", source = "website"),
		@Mapping(target = "status", source = "status", qualifiedByName = "mapStatusToString"),
		@Mapping(target = "createdDate", source = "createdDate")
	})
	CurrentOrganizationResponse toCurrentOrganizationResponse(Organization organization);

	@Named("mapStatusToString")
	default String mapStatusToString(StatusEn status) {
		return status != null ? status.name() : null;
	}

	@Named("mapOrganizationTypeResponse")
	default CurrentOrganizationResponse.Type mapOrganizationTypeResponse(OrganizationType organizationType) {
		return new CurrentOrganizationResponse.Type(organizationType.getId(), organizationType.getName());
	}

	@Named("mapNamesResponse")
	default CurrentOrganizationResponse.Names mapNamesResponse(Organization organization) {
		return new CurrentOrganizationResponse.Names(organization.getDisplayName(), organization.getLegalName());
	}

	@Named("mapAddressResponse")
	default CurrentOrganizationResponse.Address mapAddressResponse(Organization organization) {
		return new CurrentOrganizationResponse.Address(organization.getEmail(), organization.getCountry(), organization.getDefaultCurrency(), organization.getTimeZone());
	}

	/**
	 * Maps a list of OrganizationsOnly projections into a list of
	 * UserOrganizationResponse objects.
	 * Iterates over each organization and delegates to toUserOrganizationResponse,
	 * passing the shared UserAccount to each call.
	 *
	 * @param organizations The list of organization projections to map
	 * @param userAccount   The authenticated user's account details, shared across
	 *                      all mappings
	 * @return A list of UserOrganizationResponse objects, one per organization
	 */
	default List<UserOrganizationResponse> toUserOrganizationResponses(List<OrganizationsOnly> organizations,
			UserAccount userAccount) {
		// MapStruct can't auto-generate list mappings with multiple parameters,
		// so we manually iterate and delegate each element to the single-item mapper
		return organizations.stream()
				.map(org -> toUserOrganizationResponse(org, userAccount))
				.toList();
	}

	/**
	 * Extracts the organization ID and display name from an OrganizationsOnly
	 * projection
	 * and wraps them in a single-element Set of OrganizationDetails.
	 *
	 * @param organization The projection containing the organization data
	 * @return A Set containing one OrganizationDetails with the organization's ID
	 *         and display name
	 */
	@Named("mapUserBelongOrganizations")
	default Set<UserOrganizationResponse.OrganizationDetails> mapUserBelongOrganizations(
			OrganizationsOnly organization) {
		final UUID organizationId = organization.getOrganization().getId();
		final String organizationDisplayName = organization.getOrganization().getDisplayName();

		return Set.of(new UserOrganizationResponse.OrganizationDetails(organizationId, organizationDisplayName));
	}

	/**
	 * Converts a UserAccount entity into a UserDetails DTO containing
	 * the user's ID, full name, and email.
	 *
	 * @param userAccount The user account entity to extract details from
	 * @return A UserDetails object populated with the user's ID, full name, and
	 *         email
	 */
	@Named("mapUserDetails")
	default UserOrganizationResponse.UserDetails mapUserDetails(UserAccount userAccount) {
		return new UserOrganizationResponse.UserDetails(
				userAccount.getUserId(),
				userAccount.getFullName().get(),
				userAccount.getEmail());
	}

	/**
	 * Maps the created organization identifier and creator details into a nested
	 * {@linkplain NewOrganizationResponse}.
	 *
	 * @param organizationId  The unique identifier of the newly created
	 *                        organization.
	 * @param userId          The unique identifier of the user associated with the
	 *                        new organization.
	 * @param userInfoPresent Indicates whether the user's display information is
	 *                        available.
	 * @param userfullName    The full name to populate in the nested user details.
	 * @return A {@linkplain NewOrganizationResponse} containing the organization
	 *         identifier and mapped user details.
	 */
	@Mappings({
			@Mapping(target = "organizationId", source = "organizationId"),
			@Mapping(target = "userDetails", expression = "java(new NewOrganizationResponse.UserDetails(userId, userInfoPresent, userfullName))")
	})
	NewOrganizationResponse toNewOrganizationResponse(UUID organizationId, UUID userId, boolean userInfoPresent,
			String userfullName);
}