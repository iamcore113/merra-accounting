package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.CurrentOrganizationResponse;
import org.merra.dto.NewOrganizationResponse;
import org.merra.services.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
	 * Retrieves the current organization associated with the authenticated user's
	 * active workspace state.
	 *
	 * @return a {@link ResponseEntity} containing an {@link ApiResponse} with the
	 *         {@link CurrentOrganizationResponse} for the authenticated user's
	 *         current organization
	 */
	@GetMapping("current")
	public ResponseEntity<ApiResponse<CurrentOrganizationResponse>> getCurrentOrganization() {
		CurrentOrganizationResponse currentOrganization = organizationService.getCurrentOrganization();
		ApiResponse<CurrentOrganizationResponse> response = new ApiResponse<>(
				"Organization retrieved successfully.",
				true,
				HttpStatus.OK,
				currentOrganization);

		return ResponseEntity.ok(response);
	}

	/**
	 * Updates the current organization with the provided request data.
	 * The request body is validated before processing via the @Valid annotation.
	 *
	 * @param req the {@link CurrentOrganizationResponse} containing the updated
	 *            organization details
	 * @return a {@link ResponseEntity} containing an {@link ApiResponse} with the
	 *         updated {@link CurrentOrganizationResponse}
	 */
	@PutMapping("update")
	public ResponseEntity<ApiResponse<CurrentOrganizationResponse>> updateCurrentOrganization(
			@Valid @RequestBody CurrentOrganizationResponse req) {
		var request = organizationService.updateCurrentOrganization(req);
		ApiResponse<CurrentOrganizationResponse> response = new ApiResponse<>(
				"Organization updated successfully.",
				true,
				HttpStatus.OK,
				request);
		return ResponseEntity.ok(response);
	}

	/**
	 * Creates a new organization using the provided request data.
	 * The request body is validated before processing via the @Valid annotation.
	 *
	 * @param data The CreateOrganizationRequest containing the organization details
	 *             (e.g., display name, settings)
	 * @return A ResponseEntity containing an ApiResponse with the newly created
	 *         organization
	 */
	@Operation(summary = "create new organization")
	@PostMapping("new")
	public ResponseEntity<ApiResponse<NewOrganizationResponse>> newOrganization(
			@RequestBody @Valid CreateOrganizationRequest data) {
		ApiResponse<NewOrganizationResponse> response = new ApiResponse<>(
				"Organization created successfully.",
				true,
				HttpStatus.OK,
				organizationService.createNewOrganization(data));

		return ResponseEntity.ok(response);
	}
}
