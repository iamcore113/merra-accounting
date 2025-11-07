package org.merra.services;

import org.merra.dto.CompleteContactRequest;
import org.merra.dto.ContactResponse;
import org.merra.dto.SimpleContactRequest;
import org.merra.entities.Contact;
import org.merra.entities.Organization;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.mapper.ContactMapper;
import org.merra.repositories.ContactRepository;
import org.merra.repositories.OrganizationRepository;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;

@Service
public class ContactService {
	private final OrganizationRepository organizationRepository;
	private final ContactRepository contactRepository;
	private final ContactMapper contactMapper;

	public ContactService(
			OrganizationRepository organizationRepository,
			ContactRepository contactRepository,
			ContactMapper contactMapper
	) {
		this.organizationRepository = organizationRepository;
		this.contactRepository = contactRepository;
		this.contactMapper = contactMapper;
	}
	/**
	 * This method will create a contact object that contains only the name field.
	 * useful when creating invoice and creating new contact.
	 * @param request - accepts {@linkplain SimpleContactRequest} object.
	 * @return - {@linkplain ContactResponse} object.
	 */
	public ContactResponse createSimpleContact(@NotNull SimpleContactRequest request) {
		Organization getOrganization = organizationRepository.findById(request.organizationId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ORGANIZATION));
		String contactName = request.name();
		Contact obj = new Contact(contactName, getOrganization);
		Contact newContact = contactRepository.save(obj);
		
		return new ContactResponse(newContact.getId(), newContact.getName());
	}
	
	public CompleteContactRequest createCompleteContact(@NotNull CompleteContactRequest request) {
		Organization getOrganization = organizationRepository.findById(request.organizationId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ORGANIZATION));
		
		Contact contact = new Contact();
		contact.setOrganization(getOrganization);
		contact.setName(request.name());
		contact.setFirstName(request.firstName());
		contact.setLastName(request.lastName());
		contact.setEmailAddress(request.emailAddress());
		contact.setCompanyNumber(request.companyNumber());
		contact.setAccountNumber(request.accountNumber());
		
		Contact newContact = contactRepository.save(contact);
		
		return contactMapper.toCompleteContactRequest(newContact);
	}

}
