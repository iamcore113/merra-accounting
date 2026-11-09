package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.AccountByOrganizationResponse;
import org.merra.dto.AccountCodeExistsResponse;
import org.merra.dto.AccountMetadataResponse;
import org.merra.dto.CreateAccountRequest;
import org.merra.services.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("api/business/account/")
public class AccountController {
	private final AccountService accountService;

	public AccountController(AccountService accountService) {
		this.accountService = accountService;
	}

	@GetMapping("all")
	public ResponseEntity<ApiResponse<List<AccountByOrganizationResponse>>> getAllAccounts() {
		List<AccountByOrganizationResponse> accounts = accountService.getAccountsByCurrentOrganization();
		ApiResponse<List<AccountByOrganizationResponse>> response = new ApiResponse<>(
				"Chart of accounts retrieved successfully.",
				true,
				HttpStatus.OK,
				accounts);
		return ResponseEntity.ok(response);
	}

	@GetMapping("metadata")
	public ResponseEntity<ApiResponse<AccountMetadataResponse>> getAccountMetadata() {
		AccountMetadataResponse metadata = accountService.getAccountMetadata();
		ApiResponse<AccountMetadataResponse> response = new ApiResponse<>(
				"Account metadata retrieved successfully.",
				true,
				HttpStatus.OK,
				metadata);
		return ResponseEntity.ok(response);
	}

	@GetMapping("check-code")
	public ResponseEntity<ApiResponse<AccountCodeExistsResponse>> checkCodeExists(
			@RequestParam("code") String code) {
		AccountCodeExistsResponse exists = accountService.checkIfCodeExistsInCurrentOrganization(code);
		ApiResponse<AccountCodeExistsResponse> response = new ApiResponse<>(
				"Account code check completed.",
				true,
				HttpStatus.OK,
				exists);
		return ResponseEntity.ok(response);
	}

	@PostMapping("new")
	public ResponseEntity<ApiResponse<AccountByOrganizationResponse>> createAccount(
			@Valid @RequestBody CreateAccountRequest request) {
		AccountByOrganizationResponse created = accountService.createAccount(request);
		ApiResponse<AccountByOrganizationResponse> response = new ApiResponse<>(
				"Account created successfully.",
				true,
				HttpStatus.CREATED,
				created);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("{accountId}")
	public ResponseEntity<ApiResponse<AccountByOrganizationResponse>> updateAccount(
			@PathVariable("accountId") UUID accountId,
			@Valid @RequestBody CreateAccountRequest request) {
		AccountByOrganizationResponse updated = accountService.updateAccount(accountId, request);
		ApiResponse<AccountByOrganizationResponse> response = new ApiResponse<>(
				"Account updated successfully.",
				true,
				HttpStatus.OK,
				updated);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("{accountId}/status")
	public ResponseEntity<ApiResponse<AccountByOrganizationResponse>> updateAccountStatus(
			@PathVariable("accountId") UUID accountId,
			@RequestParam("status") String status) {
		AccountByOrganizationResponse updated = accountService.updateAccountStatus(accountId, status);
		ApiResponse<AccountByOrganizationResponse> response = new ApiResponse<>(
				"Account status updated successfully.",
				true,
				HttpStatus.OK,
				updated);
		return ResponseEntity.ok(response);
	}
}
