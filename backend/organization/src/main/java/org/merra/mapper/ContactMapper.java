package org.merra.mapper;

import java.util.List;
import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.CompleteContactRequest;
import org.merra.dto.ContactDetailResponse;
import org.merra.dto.ContactsByOrganizationResponse;
import org.merra.entities.Contact;
import org.merra.repositories.projections.ContactsByOrganizationSelection;

@Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL, componentModel = "spring")
public interface ContactMapper {

	CompleteContactRequest toCompleteContactRequest(Contact ct);

	@Mappings({
			@Mapping(target = "organizationName", source = "organizationName"),
			@Mapping(target = "contactId", source = "id"),
			@Mapping(target = "contactName", source = "name"),
			@Mapping(target = "accountNumber", source = "accountNumber"),
			@Mapping(target = "emailAddress", source = "emailAddress"),
			@Mapping(target = "isSupplier", source = "isSupplier"),
			@Mapping(target = "isCustomer", source = "isCustomer"),
			@Mapping(target = "status", source = "contactStatus"),
			@Mapping(target = "isTenant", source = "isTenant"),
			@Mapping(target = "counterPartyId", source = "counterPartyId"),
			@Mapping(target = "counterPartyName", source = "counterPartyName"),
			@Mapping(target = "counterpartyKey", source = "counterpartyKey")
	})
	ContactsByOrganizationResponse toContactsByOrganizationSelections(ContactsByOrganizationSelection contact);

	List<ContactsByOrganizationResponse> toContactsByOrganizationSelections(
			List<ContactsByOrganizationSelection> contacts);

	default ContactDetailResponse toContactDetailResponse(Contact c) {
		if (c == null) {
			return null;
		}
		UUID counterPartyId = c.getCounterParty() != null ? c.getCounterParty().getId() : null;
		String counterPartyName = c.getCounterParty() != null ? c.getCounterParty().getDisplayName() : null;

		return new ContactDetailResponse(
				c.getId(),
				c.getName(),
				c.getFirstName(),
				c.getLastName(),
				c.getEmailAddress(),
				c.getAccountNumber(),
				c.getIsSupplier(),
				c.getIsCustomer(),
				c.getTaxNumber(),
				c.getCompanyNumber(),
				c.getContactStatus(),
				c.getIsTenant(),
				counterPartyId,
				counterPartyName,
				c.getCounterpartyKey(),
				c.getCreatedAt(),
				c.getUpdatedAt()
		);
	}

	default ContactDetailResponse mapToDetailResponse(Contact c) {
		return toContactDetailResponse(c);
	}
}
