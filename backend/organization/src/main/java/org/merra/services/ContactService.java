package org.merra.services;

import java.util.List;
import java.util.UUID;

import org.merra.dto.CompleteContactRequest;
import org.merra.dto.ContactDetailResponse;
import org.merra.dto.ContactResponse;
import org.merra.dto.ContactsByOrganizationResponse;
import org.merra.dto.NewContactrequest;
import org.merra.dto.ResolveNetworkKeyResponse;
import org.merra.dto.UpdateContactRequest;
import org.merra.entities.Contact;
import org.merra.entities.Organization;
import org.merra.exception.ResourceAlreadyExistsException;
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
	private final NetworkKeyService networkKeyService;

	public ContactService(
			OrganizationRepository organizationRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			ContactRepository contactRepository,
			ContactMapper contactMapper,
			NetworkKeyService networkKeyService) {
		this.organizationRepository = organizationRepository;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
		this.contactRepository = contactRepository;
		this.contactMapper = contactMapper;
		this.networkKeyService = networkKeyService;
	}

	/**
	 * Creates a new contact with the provided details for the currently
	 * authenticated user's organization. Supports linking a Merra Network
	 * Organization via counterparty network key.
	 * 
	 * @param request - accepts {@linkplain NewContactrequest} object
	 * @return - {@linkplain ContactResponse} object containing the newly created contact's ID and name.
	 */
	public ContactResponse newSimpleContact(@NotNull NewContactrequest request) {
		Contact contact = new Contact();
		String fullName = request.name();
		if (fullName == null || fullName.isBlank()) {
			fullName = ((request.firstName() != null ? request.firstName() : "") + " "
					+ (request.lastName() != null ? request.lastName() : "")).trim();
		}
		contact.setName(fullName);
		contact.setFirstName(request.firstName());
		contact.setLastName(request.lastName());
		String email = (request.emailAddress() != null && !request.emailAddress().isBlank()) ? request.emailAddress().trim() : null;
		contact.setEmailAddress(email);

		Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
		contact.setOrganization(currentOrg);

		boolean isSup = Boolean.TRUE.equals(request.isSupplier());
		boolean isCust = Boolean.TRUE.equals(request.isCustomer());
		contact.setIsSupplier(isSup);
		contact.setIsCustomer(isCust);

		String expectedPrefix = (isCust && isSup) ? "BOTH" : isSup ? "SUP" : "CUST";
		String accNum = request.accountNumber();
		if (accNum != null && !accNum.isBlank()) {
			accNum = accNum.trim().toUpperCase();
			if (accNum.matches("^[A-Z]+-\\d{4}$")) {
				String digits = accNum.substring(accNum.indexOf('-') + 1);
				accNum = expectedPrefix + "-" + digits;
			} else if (accNum.matches("^\\d{4}$")) {
				accNum = expectedPrefix + "-" + accNum;
			}
			boolean exists = contactRepository.existsByAccountNumberAndOrganizationId(accNum, currentOrg.getId());
			if (exists) {
				throw new ResourceAlreadyExistsException("Account number '" + accNum + "' already exists for this organization");
			}
			contact.setAccountNumber(accNum);
		}

		contact.setTaxNumber(request.taxNumber());
		contact.setCompanyNumber(request.companyNumber());
		if (request.contactStatus() != null && !request.contactStatus().isBlank()) {
			contact.setContactStatus(request.contactStatus());
		} else {
			contact.setContactStatus("ACTIVE");
		}

		// Handle Merra Network subscription and set legal name if tenant
		handleNetworkSubscription(contact, request.isTenant(), request.counterpartyKey());

		if (contact.getName() == null || contact.getName().isBlank()) {
			throw new IllegalArgumentException("Contact name or person name is required");
		}

		Contact newContact = contactRepository.save(contact);

		return new ContactResponse(newContact.getId(), newContact.getName());
	}

	public boolean checkIfAccountNumberExists(String accountNumber) {
		if (accountNumber == null || accountNumber.isBlank()) {
			return false;
		}
		final UUID organizationId = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION))
				.getId();
		return contactRepository.existsByAccountNumberAndOrganizationId(accountNumber.trim(), organizationId);
	}

	public CompleteContactRequest newCompleteContact(@NotNull CompleteContactRequest request) {
		Organization getOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

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

	/**
	 * Retrieves all contacts that belong to the current organization.
	 *
	 * @return a list of {@link ContactsByOrganizationResponse}
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

	public ContactDetailResponse getContactById(UUID contactId) {
		if (contactId == null) {
			throw new IllegalArgumentException("Contact ID cannot be null");
		}
		final UUID organizationId = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION))
				.getId();

		Contact contact = contactRepository.findByIdAndOrganizationId(contactId, organizationId)
				.orElseThrow(() -> new EntityNotFoundException("Contact not found with ID: " + contactId));

		return contactMapper.toContactDetailResponse(contact);
	}

	public ContactDetailResponse updateContact(UUID contactId, @NotNull UpdateContactRequest request) {
		if (contactId == null) {
			throw new IllegalArgumentException("Contact ID cannot be null");
		}
		final UUID organizationId = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION))
				.getId();

		Contact contact = contactRepository.findByIdAndOrganizationId(contactId, organizationId)
				.orElseThrow(() -> new EntityNotFoundException("Contact not found with ID: " + contactId));

		String fullName = request.name();
		if (fullName == null || fullName.isBlank()) {
			fullName = ((request.firstName() != null ? request.firstName() : "") + " "
					+ (request.lastName() != null ? request.lastName() : "")).trim();
		}
		contact.setName(fullName);
		contact.setFirstName(request.firstName());
		contact.setLastName(request.lastName());

		String email = (request.emailAddress() != null && !request.emailAddress().isBlank()) ? request.emailAddress().trim() : null;
		contact.setEmailAddress(email);

		boolean isSup = Boolean.TRUE.equals(request.isSupplier());
		boolean isCust = Boolean.TRUE.equals(request.isCustomer());
		contact.setIsSupplier(isSup);
		contact.setIsCustomer(isCust);

		String expectedPrefix = (isCust && isSup) ? "BOTH" : isSup ? "SUP" : "CUST";
		String accNum = request.accountNumber();
		if (accNum != null && !accNum.isBlank()) {
			accNum = accNum.trim().toUpperCase();
			if (accNum.matches("^[A-Z]+-\\d{4}$")) {
				String digits = accNum.substring(accNum.indexOf('-') + 1);
				accNum = expectedPrefix + "-" + digits;
			} else if (accNum.matches("^\\d{4}$")) {
				accNum = expectedPrefix + "-" + accNum;
			}

			if (contact.getAccountNumber() == null || !accNum.equalsIgnoreCase(contact.getAccountNumber())) {
				boolean exists = contactRepository.existsByAccountNumberAndOrganizationId(accNum, organizationId);
				if (exists) {
					throw new ResourceAlreadyExistsException("Account number '" + accNum + "' already exists for this organization");
				}
			}
			contact.setAccountNumber(accNum);
		} else {
			contact.setAccountNumber(null);
		}

		contact.setTaxNumber(request.taxNumber());
		contact.setCompanyNumber(request.companyNumber());
		if (request.contactStatus() != null && !request.contactStatus().isBlank()) {
			contact.setContactStatus(request.contactStatus());
		}

		// Handle Merra Network subscription and set legal name if tenant
		handleNetworkSubscription(contact, request.isTenant(), request.counterpartyKey());

		if (contact.getName() == null || contact.getName().isBlank()) {
			throw new IllegalArgumentException("Contact name or person name is required");
		}

		Contact updated = contactRepository.save(contact);

		return contactMapper.toContactDetailResponse(updated);
	}

	public void deleteContact(UUID contactId) {
		if (contactId == null) {
			throw new IllegalArgumentException("Contact ID cannot be null");
		}
		final UUID organizationId = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION))
				.getId();

		Contact contact = contactRepository.findByIdAndOrganizationId(contactId, organizationId)
				.orElseThrow(() -> new EntityNotFoundException("Contact not found with ID: " + contactId));

		contactRepository.delete(contact);
	}

	/**
	 * Dedicated function for handling Merra Network subscription linking.
	 * If the contact is linked as a network tenant with a valid counterparty key:
	 * - Resolves the key and links the counterparty organization
	 * - Sets isTenant = true and updates the counterparty key
	 * - Sets the "name" column in organization_contacts to the legal name of the contact organization
	 * If not a network tenant or key is cleared, resets subscription attributes.
	 *
	 * @param contact            the contact entity being updated
	 * @param isTenantRequested  flag indicating whether tenant connection was requested
	 * @param counterpartyKey    the network key provided for the counterparty
	 */
	private void handleNetworkSubscription(Contact contact, Boolean isTenantRequested, String counterpartyKey) {
		boolean isTenant = Boolean.TRUE.equals(isTenantRequested) || (counterpartyKey != null && !counterpartyKey.isBlank());
		if (isTenant && counterpartyKey != null && !counterpartyKey.isBlank()) {
			ResolveNetworkKeyResponse resolveRes = networkKeyService.resolveNetworkKey(counterpartyKey);
			if (!resolveRes.isValid()) {
				throw new IllegalArgumentException("Invalid Merra Network Key: " + resolveRes.message());
			}
			Organization counterParty = organizationRepository.findById(resolveRes.organizationId())
					.orElseThrow(() -> new EntityNotFoundException("Counterparty organization not found"));

			contact.setCounterParty(counterParty);
			contact.setIsTenant(true);
			contact.setCounterpartyKey(counterpartyKey.trim());

			// The "name" attribute/column in organization_contacts stores the legal name of the contact organization
			String legalName = counterParty.getLegalName();
			if (legalName != null && !legalName.isBlank()) {
				contact.setName(legalName.trim());
			} else if (counterParty.getDisplayName() != null && !counterParty.getDisplayName().isBlank()) {
				contact.setName(counterParty.getDisplayName().trim());
			}
		} else {
			contact.setCounterParty(null);
			contact.setIsTenant(false);
			contact.setCounterpartyKey(null);
		}
	}
}
