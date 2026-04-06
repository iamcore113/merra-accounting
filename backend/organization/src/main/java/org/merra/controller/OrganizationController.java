package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.UserOrganizationResponse;
import org.merra.services.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

/**
 * x-organization-id header is required for
 * accessing existing organization entity.
 */
@RestController
@RequestMapping("api/v1/business/organization/")
public class OrganizationController {
	private final OrganizationService organizationService;

	public OrganizationController(OrganizationService organizationService) {
		this.organizationService = organizationService;
	}

	@GetMapping("dashboard")
	public void getOrganizationDashboard() {
	}

	/**
	 * Retrieves all organizations owned by the currently authenticated user.
	 * The user is identified from the tenant context, so no user ID is needed in the request.
	 *
	 * @return A ResponseEntity containing an ApiResponse with a list of
	 *         UserOrganizationResponse objects, each holding the user's details
	 *         and the organization they belong to
	 */
	@GetMapping(value = "owned")
	public ResponseEntity<ApiResponse> getOwnedOrganizations() {
		List<UserOrganizationResponse> res = organizationService.getUserOrganizations();
		ApiResponse response = new ApiResponse(
				"Owned organizations retrieved successfully.",
				true,
				HttpStatus.OK,
				res);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "create new organization")
	@PostMapping("create")
	public ResponseEntity<ApiResponse> createOrganization(@RequestBody @Valid CreateOrganizationRequest data) {
		ApiResponse response = new ApiResponse(
				"Organization object found successfully.",
				true,
				HttpStatus.OK,
				organizationService.createNewOrganization(data));

		return ResponseEntity.ok(response);
	}
}
