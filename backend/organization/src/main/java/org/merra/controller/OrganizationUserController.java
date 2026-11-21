package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.PrincipalDetailsResponse;
import org.merra.dto.UserProfileImageResponse;
import org.merra.services.OrganizationUsersService;
import org.merra.services.UserProfileImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("api/business/organization/user/")
public class OrganizationUserController {
	private final OrganizationUsersService organizationUsersService;
	private final UserProfileImageService userProfileImageService;

	public OrganizationUserController(
			OrganizationUsersService organizationUsersService,
			UserProfileImageService userProfileImageService) {
		this.organizationUsersService = organizationUsersService;
		this.userProfileImageService = userProfileImageService;
	}

	/**
	 * Retrieves the personal details of the currently authenticated user.
	 *
	 * @return A {@link ResponseEntity} containing an {@link ApiResponse} with the
	 *         authenticated user's personal details and HTTP 200 status.
	 */
	@GetMapping("details")
	public ResponseEntity<ApiResponse<PrincipalDetailsResponse>> personalDetails() {
		var resp = organizationUsersService.personalDetails();
		ApiResponse<PrincipalDetailsResponse> response = new ApiResponse<>(
				"User personal details retrieved successfully.",
				true,
				HttpStatus.OK,
				resp);
		return ResponseEntity.ok().body(response);
	}

	@PutMapping("update")
	public ResponseEntity<ApiResponse<PrincipalDetailsResponse>> updatePrincipalProfile(
			@Valid @RequestBody PrincipalDetailsResponse request) {
		var resp = organizationUsersService.updatePrincipalDetails(request);
		return ResponseEntity.ok()
				.body(new ApiResponse<>("User account profile updated successfully.", true, HttpStatus.OK, resp));
	}

	/**
	 * Uploads (or replaces) the currently authenticated user's profile image.
	 */
	@Operation(summary = "upload user profile image")
	@PostMapping(value = "profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<UserProfileImageResponse>> uploadProfileImage(
			@RequestParam("file") MultipartFile file) {
		return ResponseEntity.ok(new ApiResponse<>(
				"Profile image uploaded successfully.",
				true,
				HttpStatus.OK,
				userProfileImageService.upload(file)));
	}

	/**
	 * Returns the currently authenticated user's profile image bytes.
	 */
	@Operation(summary = "get user profile image")
	@GetMapping("profile-image")
	public ResponseEntity<byte[]> getProfileImage() {
		var image = userProfileImageService.download();
		MediaType type = image.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM
				: MediaType.parseMediaType(image.contentType());
		return ResponseEntity.ok().contentType(type).cacheControl(CacheControl.noCache()).body(image.content());
	}

	/**
	 * Removes the currently authenticated user's profile image.
	 */
	@Operation(summary = "delete user profile image")
	@DeleteMapping("profile-image")
	public ResponseEntity<ApiResponse<Void>> deleteProfileImage() {
		userProfileImageService.delete();
		return ResponseEntity.ok(new ApiResponse<>("Profile image removed successfully.", true, HttpStatus.OK, null));
	}
}
