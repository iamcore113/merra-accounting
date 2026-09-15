package org.merra.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.validation.Valid;

import java.util.List;

import org.merra.api.ApiResponse;
import org.merra.dto.ContactResponse;
import org.merra.dto.ContactsByOrganizationResponse;
import org.merra.dto.NewContactrequest;
import org.merra.services.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Exposes REST endpoints for managing and retrieving business contacts data.
 */
@RestController
@RequestMapping("api/business/contact/")
public class ContactController {
	private final ContactService contactService;

	/**
	 * Creates a controller instance with the contact service dependency.
	 *
	 * @param contactService The service that provides contact retrieval operations.
	 */
	public ContactController(ContactService contactService) {
		this.contactService = contactService;
	}

	/**
	 * Retrieves all contacts associated with the current organization.
	 * Handles HTTP GET requests for the contact collection resource.
	 *
	 * @return A {@link ResponseEntity} containing an {@link ApiResponse} whose data
	 *         payload is a list of {@link ContactsByOrganizationResponse} items.
	 */
	@GetMapping("all")
	public ResponseEntity<ApiResponse<List<ContactsByOrganizationResponse>>> contactByOrganization() {
		List<ContactsByOrganizationResponse> contacts = contactService.getContactsByOrganizationId();
		ApiResponse<List<ContactsByOrganizationResponse>> response = new ApiResponse<>();
		response.setData(contacts);
		return ResponseEntity.ok(response);
	}

	@PostMapping("new")
	public ResponseEntity<ApiResponse<ContactResponse>> newContact(@RequestBody @Valid NewContactrequest request) {
		var res = contactService.newSimpleContact(request);
		ApiResponse<ContactResponse> response = new ApiResponse<>();
		response.setMessage("new contact created successfully");
		response.setData(res);
		return ResponseEntity.ok(response);
	}

}
