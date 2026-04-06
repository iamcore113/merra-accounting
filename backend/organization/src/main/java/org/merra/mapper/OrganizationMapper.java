package org.merra.mapper;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.merra.dto.OrganizationDashboardResponse;
import org.merra.dto.UserOrganizationResponse;
import org.merra.entities.UserAccount;
import org.merra.repositories.projections.OrganizationsOnly;
import org.merra.utilities.InvoiceConstants;

@Mapper(componentModel = "spring")
public interface OrganizationMapper {
	
	@Mappings({
		@Mapping(target = "invoiceStatusCount", source = "invoiceStatusCounts", qualifiedByName = "mapInvoiceStatusCounts")
	})
	OrganizationDashboardResponse toOrganizationDashboardresponse(Map<String, Integer> invoiceStatusCounts);
	
	@Named("mapInvoiceStatusCounts")
	default OrganizationDashboardResponse.InvoiceStatusCount mapInvoiceStatusCounts(Map<String, Integer> invoiceStatusCounts) {
		return new OrganizationDashboardResponse.InvoiceStatusCount(
			invoiceStatusCounts.get(InvoiceConstants.INVOICE_STATUS_DRAFT),
			invoiceStatusCounts.get(InvoiceConstants.INVOICE_STATUS_SUBMITTED),
			invoiceStatusCounts.get(InvoiceConstants.INVOICE_STATUS_AUTHORISED)
		);
	}
	
	@Mappings({
		@Mapping(target = "organizations", source = "organizations", qualifiedByName = "mapUserBelongOrganizations"),
		@Mapping(target = "userDetails", source = "userAccount", qualifiedByName = "mapUserDetails")
	})
	UserOrganizationResponse toUserOrganizationResponse(OrganizationsOnly organizations, UserAccount userAccount);
	
	default List<UserOrganizationResponse> toUserOrganizationResponses(List<OrganizationsOnly> organizations, UserAccount userAccount) {
		// MapStruct can't auto-generate list mappings with multiple parameters,
		// so we manually iterate and delegate each element to the single-item mapper
		return organizations.stream()
				.map(org -> toUserOrganizationResponse(org, userAccount))
				.toList();
	}
	
	@Named("mapUserBelongOrganizations")
	default Set<UserOrganizationResponse.OrganizationDetails> mapUserBelongOrganizations(OrganizationsOnly organization) {
		final UUID organizationId = organization.getOrganization().getId();
		final String organizationDisplayName = organization.getOrganization().getDisplayName();
		
		return Set.of(new UserOrganizationResponse.OrganizationDetails(organizationId, organizationDisplayName));
	}
	
	@Named("mapUserDetails")
	default UserOrganizationResponse.UserDetails mapUserDetails(UserAccount userAccount) {
		return new UserOrganizationResponse.UserDetails(
			userAccount.getUserId(),
			userAccount.getFullName().get(),
			userAccount.getEmail()
		);
	}
}