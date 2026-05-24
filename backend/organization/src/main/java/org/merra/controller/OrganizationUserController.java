package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.PersonalDetailsResponse;
import org.merra.services.OrganizationUsersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("api/v1/business/organization/user/")
public class OrganizationUserController {
    private final OrganizationUsersService organizationUsersService;
    
    public OrganizationUserController(OrganizationUsersService organizationUsersService) {
        this.organizationUsersService = organizationUsersService;
    }
    
    /**
	 * Retrieves the personal details of the currently authenticated user.
	 *
	 * @return A {@link ResponseEntity} containing an {@link ApiResponse} with the
	 *         authenticated user's personal details and HTTP 200 status.
	 */
	@GetMapping("details")
	public ResponseEntity<ApiResponse<PersonalDetailsResponse>> personalDetails() {
		var resp = organizationUsersService.personalDetails();
		ApiResponse<PersonalDetailsResponse> response = new ApiResponse<>(
				"User personal details retrieved successfully.",
				true,
				HttpStatus.OK,
				resp);
		return ResponseEntity.ok().body(response);
	}

	@PutMapping("update")
	public ResponseEntity<ApiResponse<PersonalDetailsResponse>> updatePrincipalProfile(@Valid @RequestBody PersonalDetailsResponse request) {
		var resp = organizationUsersService.updatePrincipalDetails(request);
		return ResponseEntity.ok().body(new ApiResponse<>("User account profile updated successfully.", true, HttpStatus.OK, resp));
	}
}
