package org.merra.mapper;

import java.util.HashSet;
import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.merra.dto.UserOrganizationResponse;
import org.merra.entities.UserAccount;
import org.merra.repositories.projections.OrganizationUsersLookup;

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
}