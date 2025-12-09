package org.merra.mapper;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mappings;
import org.mapstruct.Mapping;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.OrganizationDetailsResponse;
import org.merra.dto.OrganziationSelectionResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationType;
import org.merra.entities.embedded.OrganizationUsersEmb;

@Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL, componentModel = "spring")
public interface OrganizationMapper {
	@Mappings({
			@Mapping(source = "id", target = "organizationId"),
			@Mapping(source = "profileImage", target = "organizationInfo.profileImage"),
			@Mapping(source = "displayName", target = "organizationInfo.displayName"),
			@Mapping(source = "legalName", target = "organizationInfo.legalName"),
			@Mapping(source = "organizationDescription", target = "organizationInfo.organizationDescription"),
			@Mapping(source = "organizationType", target = "organizationInfo.organizationType"),
			@Mapping(source = "country", target = "contactInformation.countryCode"),
			@Mapping(source = "address", target = "contactInformation.address"),
			@Mapping(source = "email", target = "contactInformation.email"),
			@Mapping(source = "website", target = "contactInformation.website"),
			@Mapping(source = "phoneNo", target = "contactInformation.phoneNo"),
			@Mapping(source = "externalLinks", target = "contactInformation.externalLinks"),
			@Mapping(source = "organizationUsers", target = "organizationUsers")
	})
	OrganizationDetailsResponse toOrganizationResponse(Organization org);

	default Map<String, String> mapObjectToMap(OrganizationType org) {

		return Map.of(
				"id", org.getId().toString(),
				"name", org.getName());
	}

	default Set<OrganizationDetailsResponse.Users> organizationUsers(Set<OrganizationUsersEmb> users) {
		Set<OrganizationDetailsResponse.Users> mapUsers = users.stream()
				.map(usr -> new OrganizationDetailsResponse.Users(
						Map.of("id", usr.getUserId().getUserId().toString(), "name",
								usr.getUserId().getFirstName() + " " + usr.getUserId().getLastName()),
						usr.getUserRole(), usr.getUserJoined()))
				.collect(Collectors.toSet());

		return mapUsers;
	}

	@Mappings({
			@Mapping(source = "id", target = "organizationId"),
			@Mapping(source = "organizationDescription", target = "description")
	})
	OrganziationSelectionResponse toOrganizationSelectionResponse(Organization org);

	Set<OrganziationSelectionResponse> toOrganizationSelectionResponses(Set<Organization> org);
}