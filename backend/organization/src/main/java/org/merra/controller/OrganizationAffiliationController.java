package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.UserOrganizationAffiliation;
import org.merra.services.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Handles organization affiliation endpoints for the authenticated user.
 */
@RestController
@RequestMapping("api/organization/affiliations/")
public class OrganizationAffiliationController {
    private final OrganizationService organizationService;

    public OrganizationAffiliationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    /**
     * Retrieves the affiliated organizations for the currently authenticated
     * principal,
     * including each organization's details, the principal's role within it, and
     * the
     * total number of affiliated organizations.
     *
     * @return A {@link ResponseEntity} containing an {@link ApiResponse} with the
     *         principal's organization affiliations and HTTP 200 status.
     */
    @GetMapping()
    public ResponseEntity<ApiResponse<UserOrganizationAffiliation>> organizationAffiliation() {
        var resp = organizationService.getUserOrganizationAffiliation();
        ApiResponse<UserOrganizationAffiliation> response = new ApiResponse<>(
                "User organization affiliations retrieved successfully.",
                true,
                HttpStatus.OK,
                resp);
        return ResponseEntity.ok().body(response);
    }
}
