package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.UserPersonalInformationRequest;
import org.merra.services.UserAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;


@RestController
@RequestMapping("api/v1/account/user/")
public class UserAccountController {
	private final UserAccountService userAccountService;

	public UserAccountController(UserAccountService userAccountService) {
		this.userAccountService = userAccountService;
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