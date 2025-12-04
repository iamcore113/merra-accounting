package org.merra.dto;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import org.merra.embedded.PhoneDetails;
import org.merra.entities.embedded.ExternalLinks;
import org.merra.entities.embedded.OrganizationAddressEmb;
import org.merra.validation.annotation.ValidAddressKeys;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrganizationRequest(
		Set<InviteUser> inviteOtherUser,
		BasicInformation basicInformation,
		@NotNull(message = "contactDetails component cannot be null") ContactDetails contactDetails) {
	/**
	 * Nested record class
	 * Basic information for organization
	 */
	public record BasicInformation(
			String profileImage,
			@NotBlank(message = "displayName component cannot be blank.") String displayName,
			String legalName,
			@NotNull(message = "Organization type component cannot be null.") UUID organizationType,
			String organizationDescription) {
		public BasicInformation(
				String profileImage,
				String displayName,
				String legalName,
				UUID organizationType,
				String organizationDescription) {
			this.profileImage = profileImage;

			this.displayName = displayName;
			/**
			 * If legalName is not provided. set the displayName
			 * as the legalName
			 */
			this.legalName = legalName.isEmpty() ? displayName : legalName;
			this.organizationType = organizationType;
			this.organizationDescription = organizationDescription;
		}
	}

	/**
	 * Nested record class
	 * Organization contact details
	 */
	public record ContactDetails(
			@Size(min = 2, max = 2) String countryCode,
			@ValidAddressKeys @NotNull(message = "address component cannot be null.") Set<OrganizationAddressEmb> address,
			LinkedHashSet<PhoneDetails> phoneNo,
			@Email(message = "Invalid email component value") @NotBlank(message = "Email component cannot be blank.") String email,
			String website,
			Set<ExternalLinks> externalLinks) {
	}

	/**
	 * Nested record class for handling invited users to organization
	 */
	public record InviteUser(
			@NotNull(message = "userId component cannot be null") UUID userId,
			@NotBlank(message = "role component cannot be blank.") @Pattern(regexp = "^[A-Z](?:[A-Z]|_[A-Z])*$", message = "Invalid value for role component.") String role) {
	}
}
