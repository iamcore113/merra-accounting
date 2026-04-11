package org.merra.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.CompleteContactRequest;
import org.merra.dto.ContactsByOrganizationResponse;
import org.merra.entities.Contact;
import org.merra.repositories.projections.ContactsByOrganizationSelection;

@Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL, componentModel = "spring")
public interface ContactMapper {
	
	@Mappings({
		@Mapping(target = "organizationId", expression = "java(ct.getOrganizationId().getId())")
	})
	CompleteContactRequest toCompleteContactRequest(Contact ct);
	
	@Mappings({
		@Mapping(target = "organizationName", source = "organizationName"),
		@Mapping(target = "contactId", source = "id"),
		@Mapping(target = "contactName", source = "name")
	})
	ContactsByOrganizationResponse toContactsByOrganizationSelections(ContactsByOrganizationSelection contact);
	List<ContactsByOrganizationResponse> toContactsByOrganizationSelections(List<ContactsByOrganizationSelection> contacts);
}
