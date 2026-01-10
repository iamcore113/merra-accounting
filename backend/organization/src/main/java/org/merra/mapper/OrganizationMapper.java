package org.merra.mapper;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.OrganizationDetailsResponse;
import org.merra.dto.OrganziationSelectionResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationType;
import org.merra.entities.embedded.OrganizationUsersEmb;
import org.merra.repositories.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.persistence.EntityNotFoundException;

@Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL, componentModel = "spring")
public abstract class OrganizationMapper {

	@Autowired
	protected UserAccountRepository userAccountRepository;

	public OrganizationDetailsResponse toOrganizationResponse(Organization org) {

		OrganizationDetailsResponse.BasicInformation basicInfo = new OrganizationDetailsResponse.BasicInformation(
				org.getProfileImage(),
				org.getDisplayName(),
				org.getLegalName(),
				org.getOrganizationDescription(),
				mapObjectToMap(org.getOrganizationType()));

		OrganizationDetailsResponse.ContactInformation contactInfo = new OrganizationDetailsResponse.ContactInformation(
				org.getCountry(),
				org.getAddress(),
				org.getEmail(),
				org.getWebsite(),
				org.getPhoneNo(),
				org.getExternalLinks());

		Set<OrganizationDetailsResponse.Users> users = organizationUsers(org.getOrganizationUsers());

		return new OrganizationDetailsResponse(
				org.getId(),
				basicInfo,
				contactInfo,
				users);
	}

	private Map<String, String> mapObjectToMap(OrganizationType org) {

		return Map.of(
				"id", org.getId().toString(),
				"name", org.getName());
	}

	private Set<OrganizationDetailsResponse.Users> organizationUsers(Set<OrganizationUsersEmb> users) {
		Set<OrganizationDetailsResponse.Users> mapUsers = new HashSet<>();
		for (OrganizationUsersEmb user : users) {
			var getUser = userAccountRepository.findById(user.getUserId()).orElseThrow(() -> new EntityNotFoundException("User not found"));
			mapUsers.add(new OrganizationDetailsResponse.Users(
					Map.of("id", user.getUserId().toString(), "name",
							getUser.getFirstName() + " " + getUser.getLastName()),
					user.getUserRole(), user.getUserJoined()));
		}

		return mapUsers;
	}

	public OrganziationSelectionResponse toOrganizationSelectionResponse(Organization org) {
		return new OrganziationSelectionResponse(org.getId(), org.getDisplayName(), org.getLegalName(), org.getOrganizationDescription(), org.getStatus().toString());
	}

	public Set<OrganziationSelectionResponse> toOrganizationSelectionResponses(Set<Organization> org) {
		return org.stream()
				.map(this::toOrganizationSelectionResponse)
				.collect(Collectors.toSet());
	}
}