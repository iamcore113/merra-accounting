package org.merra.controller;

import java.util.List;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.NewOrganizationResponse;
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
