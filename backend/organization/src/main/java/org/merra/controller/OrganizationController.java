package org.merra.controller;

import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.UserOrganizationResponse;
import org.merra.services.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
	 * Retrieves the list of organizations that a user belongs to.
	 * 
	 * @param userId the unique identifier of the user
	 * @return a response entity containing the user's organizations
	 */
	@GetMapping(value = "users/{userId}")
	public ResponseEntity<ApiResponse> getOrganizationsByUserId(
			@PathVariable("userId") UUID userId) {
		UserOrganizationResponse res = organizationService.getUserOrganizations(userId);
		ApiResponse response = new ApiResponse(
				"User organizations retrieved successfully.",
				true,
				HttpStatus.OK,
				res);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "create new organization")
	@PostMapping("create/{userId}")
	public ResponseEntity<ApiResponse> createOrganization(@PathVariable("userId") UUID userId,
			@RequestBody @Valid CreateOrganizationRequest data) {
		ApiResponse response = new ApiResponse(
				"Organization object found successfully.",
				true,
				HttpStatus.OK,
				organizationService.createNewOrganization(userId, data));

		return ResponseEntity.ok(response);
	}
}
