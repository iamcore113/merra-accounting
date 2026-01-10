package org.merra.mapper;
import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.OrganziationSelectionResponse;
import org.merra.entities.Organization;

@Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL, componentModel = "spring")
public interface OrganizationMapper {

	@Mappings({
		@Mapping(target = "organizationId", source = "org.id"),
		@Mapping(target = "description", source = "org.organizationDescription"),
	})
	OrganziationSelectionResponse toOrganizationSelectionResponse(Organization org);

	Set<OrganziationSelectionResponse> toOrganizationSelectionResponses(Set<Organization> org);
}