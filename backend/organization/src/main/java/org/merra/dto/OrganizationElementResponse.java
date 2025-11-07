package org.merra.dto;

import java.util.List;
import java.util.Map;
import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record OrganizationElementResponse(
		@NotEmpty(message = "Organization user role component cannot be empty.")
		Set<UserOrganizationRole> userRole,
		@NotEmpty(message = "Organization types component cannot be empty.")
		Set<OrganizationTypes> organizationTypes,
		@NotEmpty(message = "Country codes component cannot be empty.")
		Set<String> countryCode,
		@NotEmpty(message = "phoneDetails component cannot be empty.")
		List<Map<String, Set<String>>> phoneDetails,
		@NotEmpty(message = "addressTypes component cannot be empty.")
		Set<String> addressTypes,
		@NotEmpty(message = "phoneTypes component cannot be empty.")
		Set<String> phoneTypes
) {
	
	public record UserOrganizationRole(
			@NotBlank(message = "role component cannot be blank.")
			String role,
			String description
	) {
	}
	
	public record OrganizationTypes(String organizationTypeId, String name) {
		public OrganizationTypes {
			if(organizationTypeId.isBlank() || organizationTypeId.isEmpty()) {
				throw new IllegalArgumentException("organizationTypeId component is required.");
			}
			if(name.isBlank() || name.isEmpty()) {
				throw new IllegalArgumentException("name component is required.");
			}
		}
	}
}
