package org.merra.dto;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.merra.embedded.PhoneDetails;
import org.merra.entities.embedded.ExternalLinks;
import org.merra.entities.embedded.OrganizationAddressEmb;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record OrganizationDetailsResponse(
		UUID organizationId,
		BasicInformation organizationInfo,
		ContactInformation contactInformation,
		Set<Users> organizationUsers) {
	public record BasicInformation(
			String profileImage,
			@NotBlank(message = "displayName component cannot be blank.") String displayName,
			@NotBlank(message = "legalName component cannot be blank.") String legalName,
			String organizationDescription,
			@NotNull(message = "organizationType component cannot be blank.") Map<String, String> organizationType) {
	}

	public record ContactInformation(
			@Size(min = 2, max = 2) String countryCode,
			Set<OrganizationAddressEmb> address,
			@Email(message = "Invalid email component value") @NotBlank(message = "Email component cannot be blank.") String email,
			String website,
			LinkedHashSet<PhoneDetails> phoneNo,
			Set<ExternalLinks> externalLinks) {
	}

	public record Users(
			@NotNull(message = "userDetails components cannot be null.") Map<String, String> userDetails,
			@NotNull(message = "role component cannot be null.") String role,
			@PastOrPresent(message = "Invalid joinedDate component value.") @NotNull(message = "joinedDate component cannot be null.") LocalDate joinedDate) {
	}
}
