package org.merra.entities.embedded;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Embeddable
public class OrganizationUsersEmb {
	@NotNull(message = "User ID cannot be null")
	private UUID userId;

	@NotBlank(message = "User role cannot be blank")
	@Column(name = "user_role", nullable = false)
	private String userRole;

	@Column(name = "user_joined", nullable = false)
	private LocalDate userJoined = LocalDate.now();

	@Column(name = "organization_status", nullable = false)
	@NotBlank(message = "organizationStatus cannot be blank.")
	private String organizationStatus = "ACTIVE";

	public OrganizationUsersEmb() {
	}

	public OrganizationUsersEmb(UUID userId, @NotBlank(message = "User role cannot be blank") String userRole) {
		this.userId = userId;
		if (!userRole.contains("ROLE_")) {
			this.userRole = "ROLE_" + userRole;
		}
	}

	public UUID getUserId() {
		return userId;
	}

	public String getUserRole() {
		return userRole;
	}

	public LocalDate getUserJoined() {
		return userJoined;
	}

	public String getOrganizationStatus() {
		return organizationStatus;
	}

	public void setUserId(UUID userId) {
		this.userId = userId;
	}

	public void setUserRole(String userRole) {
		if (!userRole.contains("ROLE_")) {
			this.userRole = "ROLE_" + userRole.toUpperCase();
		}
	}

	public void setUserJoined(LocalDate userJoined) {
		this.userJoined = userJoined;
	}

	public void setOrganizationStatus(String organizationStatus) {
		this.organizationStatus = organizationStatus;
	}

}
