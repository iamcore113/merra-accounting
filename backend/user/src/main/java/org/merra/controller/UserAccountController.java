package org.merra.controller;

import java.util.UUID;
import org.merra.api.ApiResponse;
import org.merra.dto.UserAccountChangeEmailRequest;
import org.merra.dto.UserDetailResponse;
import org.merra.dto.UserPersonalInformationRequest;
import org.merra.entities.UserAccount;
import org.merra.services.UserAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("api/v1/business/user/account/")
public class UserAccountController {
	private final UserAccountService userAccountService;

	public UserAccountController(UserAccountService userAccountService) {
		this.userAccountService = userAccountService;
	}

	/**
	 * TODO - ideal to add email verification
	 * This method controller will update user account email address
	 * @param id - holds the User's ID
	 * @param request - accepts {@linkplain UserAccountChangeEmailRequest} object type
	 * @return
	 */
	@PutMapping("{id}/change/email")
	public ResponseEntity<?> changeUserAccountEmail(
			@PathVariable("id") UUID id,
			@Valid @RequestBody UserAccountChangeEmailRequest request
	){
		return null;
	}

	
	@GetMapping("{userId}")
	public ResponseEntity<ApiResponse> getUserDetail(@PathVariable("userId") UUID userId) {
		UserAccount userDetail = userAccountService.retrieveById(userId);
		ApiResponse response = new ApiResponse(
				"User detail retrieved successfully.",
				true,
				HttpStatus.OK,
				new UserDetailResponse(
						userDetail.getUserId(),
						userDetail.getEmail(),
						userDetail.getFirstName() + " " + userDetail.getLastName()
				)
		);

		return ResponseEntity.ok().body(response);
	}

	@PostMapping("fill/personal-information")
	public ResponseEntity<ApiResponse> userPersonalInformation(@Valid @RequestBody UserPersonalInformationRequest request) {
		var resp = userAccountService.fillUserAccountInfo(request);
		ApiResponse response = new ApiResponse(
				"User personal information filled successfully.",
				true,
				HttpStatus.OK,
				resp
		);
		return ResponseEntity.ok().body(response);
	}
}