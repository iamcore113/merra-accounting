package org.merra.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.CompleteContactRequest;
import org.merra.entities.Contact;

@Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL, componentModel = "spring")
public interface ContactMapper {
	
	@Mappings({
		@Mapping(target = "organizationId", expression = "java(ct.getOrganization().getId())")
	})
	CompleteContactRequest toCompleteContactRequest(Contact ct);
}
