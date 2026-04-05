package org.merra.mapper;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.merra.dto.OrganizationDashboardResponse;
import org.merra.dto.UserOrganizationResponse;
import org.merra.entities.UserAccount;
import org.merra.repositories.projections.OrganizationUsersLookup;
import org.merra.utilities.InvoiceConstants;

@Mapper(componentModel = "spring")
public interface OrganizationMapper {
	@Mappings({
		@Mapping(target = "userDetails", source = "userAccount", qualifiedByName = "mapUserDetails"),
		@Mapping(target = "organizations", source = "organizations", qualifiedByName = "mapOrganizationDetails")
	})
	UserOrganizationResponse toOrganizationUserDetails(Set<OrganizationUsersLookup> organizations, UserAccount userAccount);

	@Named("mapUserDetails")
	default UserOrganizationResponse.UserDetails mapUserDetails(UserAccount userAccount) {
		return new UserOrganizationResponse.UserDetails(
			userAccount.getUserId(),
			userAccount.getFullName().get(),
			userAccount.getEmail()
		);
	}

	@Named("mapOrganizationDetails")
	default Set<UserOrganizationResponse.OrganizationDetails> mapOrganizationDetails(Set<OrganizationUsersLookup> organization) {
		Set<UserOrganizationResponse.OrganizationDetails> organizationDetailsSet = new HashSet<>();
		for (OrganizationUsersLookup org : organization) {
			organizationDetailsSet.add(
				new UserOrganizationResponse.OrganizationDetails(
					org.getId(),
					org.getDisplayName()
				)
			);
		}
		return organizationDetailsSet;
	}
	
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
}