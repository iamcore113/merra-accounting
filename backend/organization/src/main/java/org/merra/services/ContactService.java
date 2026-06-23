package org.merra.services;

import java.util.List;
import java.util.UUID;

import org.merra.dto.CompleteContactRequest;
import org.merra.dto.ContactResponse;
import org.merra.dto.ContactsByOrganizationResponse;
import org.merra.dto.SimpleContactRequest;
import org.merra.entities.Contact;
import org.merra.entities.Organization;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.mapper.ContactMapper;
import org.merra.repositories.ContactRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.repositories.projections.ContactsByOrganizationSelection;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;

@Service
@Validated
public class ContactService {
	private final OrganizationRepository organizationRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;
	private final ContactRepository contactRepository;
	private final ContactMapper contactMapper;

	public ContactService(
			OrganizationRepository organizationRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			ContactRepository contactRepository,
			ContactMapper contactMapper) {
		this.organizationRepository = organizationRepository;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
		this.contactRepository = contactRepository;
		this.contactMapper = contactMapper;
	}

	/**
	 * This method will create a contact object that contains only the name field.
	 * useful when creating invoice and creating new contact.
	 * 
	 * @param request - accepts {@linkplain SimpleContactRequest} object.
	 * @return - {@linkplain ContactResponse} object.
	 */
	public ContactResponse createSimpleContact(@NotNull SimpleContactRequest request) {
		Organization getOrganization = organizationRepository.findById(request.organizationId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ORGANIZATION));
		final String contactName = request.name();
		Contact obj = new Contact(contactName, getOrganization);
		Contact newContact = contactRepository.save(obj);

		return new ContactResponse(newContact.getId(), newContact.getName());
	}

	public CompleteContactRequest createCompleteContact(@NotNull CompleteContactRequest request) {
		Organization getOrganization = organizationRepository.findById(request.organizationId())
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ORGANIZATION));

		Contact contact = new Contact();
		contact.setOrganizationId(getOrganization);
		contact.setName(request.name());
		contact.setFirstName(request.firstName());
		contact.setLastName(request.lastName());
		contact.setEmailAddress(request.emailAddress());
		contact.setCompanyNumber(request.companyNumber());
		contact.setAccountNumber(request.accountNumber());

		Contact newContact = contactRepository.save(contact);

		return contactMapper.toCompleteContactRequest(newContact);
	}

	/**
	 * Retrieves all contacts that belong to the organization identified by the
	 * current organization tenant in {@link TenantContext}. The method first
	 * ensures the tenant ID is present, verifies that the organization exists,
	 * then loads the matching contact projections and maps them into response
	 * DTOs.
	 *
	 * @return a list of {@link ContactsByOrganizationResponse} for the current
	 *         organization
	 * @throws IllegalStateException   if the organization tenant ID is missing from
	 *                                 the context
	 * @throws EntityNotFoundException if no organization exists for the tenant ID
	 */
	public List<ContactsByOrganizationResponse> getContactsByOrganizationId() {
		final UUID organizationId = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION))
				.getId();

		if (organizationId == null) {
			throw new IllegalStateException("Organization tenant ID is not set in the context");
		}
		if (!organizationRepository.existsById(organizationId)) {
			throw new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_ORGANIZATION);
		}

		List<ContactsByOrganizationSelection> contactsByOrganization = contactRepository
				.findContactsByOrganizationId(organizationId);
		return contactMapper.toContactsByOrganizationSelections(contactsByOrganization);
	}

}
