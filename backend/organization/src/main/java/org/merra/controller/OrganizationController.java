package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateOrganizationRequest;
import org.merra.dto.CurrentOrganizationResponse;
import org.merra.dto.NewOrganizationResponse;
import org.merra.dto.OrganizationMemberResponse;
import org.merra.dto.OrganizationNameCheckResponse;
import org.merra.dto.OrganizationProfileImageResponse;
import org.merra.services.OrganizationProfileImageService;
import org.merra.services.OrganizationService;
import org.merra.services.UserProfileImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * x-organization-id header is required for
 * accessing existing organization entity.
 */
@RestController
@RequestMapping("api/business/organization/")
public class OrganizationController {
	private final OrganizationService organizationService;
	private final OrganizationProfileImageService profileImageService;
	private final UserProfileImageService userProfileImageService;

	public OrganizationController(OrganizationService organizationService,
			OrganizationProfileImageService profileImageService) {
		this(organizationService, profileImageService, null);
	}

	@Autowired
	public OrganizationController(OrganizationService organizationService,
			OrganizationProfileImageService profileImageService,
			@Autowired(required = false) UserProfileImageService userProfileImageService) {
		this.organizationService = organizationService;
		this.profileImageService = profileImageService;
		this.userProfileImageService = userProfileImageService;
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
	 * Retrieves all members of the current organization, including active members
	 * and pending invitees along with their roles.
	 */
	@Operation(summary = "get current organization members including pending invitees")
	@GetMapping("members")
	public ResponseEntity<ApiResponse<List<OrganizationMemberResponse>>> getOrganizationMembers() {
		List<OrganizationMemberResponse> members = organizationService.getOrganizationMembers();
		ApiResponse<List<OrganizationMemberResponse>> response = new ApiResponse<>(
				"Organization members retrieved successfully.",
				true,
				HttpStatus.OK,
				members);
		return ResponseEntity.ok(response);
	}

	/**
	 * Returns the profile image bytes for a specific member of the current organization.
	 */
	@Operation(summary = "get an organization member's user profile image")
	@GetMapping("members/{userId}/profile-image")
	public ResponseEntity<byte[]> getOrganizationMemberProfileImage(@PathVariable("userId") UUID userId) {
		var image = userProfileImageService.downloadForOrganizationMember(userId);
		MediaType type = image.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM
				: MediaType.parseMediaType(image.contentType());
		return ResponseEntity.ok().contentType(type).cacheControl(CacheControl.noCache()).body(image.content());
	}

	/**
	 * Sets the active organization in {@code user_workspace_state} for the
	 * currently authenticated user and refreshes {@code last_active_at}.
	 *
	 * @param organizationId the UUID of the organization to select
	 * @return a {@link ResponseEntity} containing an {@link ApiResponse} with the
	 *         selected {@link CurrentOrganizationResponse}
	 */
	@PostMapping("select/{organizationId}")
	public ResponseEntity<ApiResponse<CurrentOrganizationResponse>> selectOrganization(
			@PathVariable("organizationId") UUID organizationId) {
		CurrentOrganizationResponse selectedOrganization = organizationService.selectOrganization(organizationId);
		ApiResponse<CurrentOrganizationResponse> response = new ApiResponse<>(
				"Organization selected successfully.",
				true,
				HttpStatus.OK,
				selectedOrganization);

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
				organizationService.newOrganization(data));

		return ResponseEntity.ok(response);
	}

	/**
	 * Uploads (or replaces) the current organization's profile image.
	 */
	@Operation(summary = "upload organization profile image")
	@PostMapping(value = "profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<OrganizationProfileImageResponse>> uploadProfileImage(
			@RequestParam("file") MultipartFile file) {
		return ResponseEntity.ok(new ApiResponse<>(
				"Profile image uploaded successfully.",
				true,
				HttpStatus.OK,
				profileImageService.upload(file)));
	}

	/**
	 * Returns the current organization's profile image bytes.
	 */
	@Operation(summary = "get organization profile image")
	@GetMapping("profile-image")
	public ResponseEntity<byte[]> getProfileImage() {
		var image = profileImageService.download();
		MediaType type = image.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM
				: MediaType.parseMediaType(image.contentType());
		return ResponseEntity.ok().contentType(type).cacheControl(CacheControl.noCache()).body(image.content());
	}

	/**
	 * Removes the current organization's profile image.
	 */
	@Operation(summary = "delete organization profile image")
	@DeleteMapping("profile-image")
	public ResponseEntity<ApiResponse<Void>> deleteProfileImage() {
		profileImageService.delete();
		return ResponseEntity.ok(new ApiResponse<>("Profile image removed successfully.", true, HttpStatus.OK, null));
	}

	/**
	 * Checks if an organization with the given display name exists.
	 * The request body is validated before processing via the @Valid annotation.
	 *
	 * @param name The display name to check for existence.
	 * @return A ResponseEntity containing an ApiResponse with the organization name
	 *         and the result of the name check.
	 */
	@GetMapping("nameCheck")
	public ResponseEntity<ApiResponse<OrganizationNameCheckResponse>> nameCheck(@RequestParam String name) {
		boolean exists = organizationService.nameCheck(name);
		ApiResponse<OrganizationNameCheckResponse> response = new ApiResponse<>(
				"Name check performed successfully.",
				true,
				HttpStatus.OK,
				new OrganizationNameCheckResponse(name, exists));
		return ResponseEntity.ok(response);
	}

}
