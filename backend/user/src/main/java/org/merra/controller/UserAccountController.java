package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.UserPersonalInformationRequest;
import org.merra.dto.UserPersonalInformationResponse;
import org.merra.services.UserAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * Handles user account profile completion operations.
 */
@RestController
@RequestMapping("api/account/user/")
public class UserAccountController {
	private final UserAccountService userAccountService;

	/**
	 * Creates a controller with the required user account service dependency.
	 *
	 * @param userAccountService Service responsible for user account profile
	 *                           operations.
	 */
	public UserAccountController(UserAccountService userAccountService) {
		this.userAccountService = userAccountService;
	}

	/**
	 * Completes the authenticated user's profile information.
	 *
	 * @param request Request payload containing the user's personal profile
	 *                details.
	 * @return A {@link ResponseEntity} containing an {@link ApiResponse} with the
	 *         updated profile data and HTTP 200 status.
	 */
	@PostMapping("complete/profile")
	public ResponseEntity<ApiResponse<UserPersonalInformationResponse>> userPersonalInformation(
			@Valid @RequestBody UserPersonalInformationRequest request) {
		var resp = userAccountService.fillUserAccountInfo(request);
		ApiResponse<UserPersonalInformationResponse> response = new ApiResponse<>(
				"User personal information filled successfully.",
				true,
				HttpStatus.OK,
				resp);
		return ResponseEntity.ok().body(response);
	}
}