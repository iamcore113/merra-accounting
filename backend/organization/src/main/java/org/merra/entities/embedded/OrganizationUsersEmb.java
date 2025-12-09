package org.merra.entities.embedded;

import java.time.LocalDate;

import org.merra.entities.UserAccount;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;

@Embeddable
public class OrganizationUsersEmb {
	@ManyToOne(targetEntity = UserAccount.class, fetch = FetchType.EAGER, cascade = CascadeType.ALL)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private UserAccount userId;

	@NotBlank(message = "User role cannot be blank")
	@Column(name = "user_role", nullable = false)
	private String userRole;

	@Column(name = "user_joined", nullable = false)
	private LocalDate userJoined = LocalDate.now();

	@Column(name = "organization_status", nullable = false)
	@NotBlank(message = "organizationStatus cannpt be blank.")
	private String organizationStatus;

	public OrganizationUsersEmb() {
	}

	public OrganizationUsersEmb(UserAccount userId, @NotBlank(message = "User role cannot be blank") String userRole,
			LocalDate userJoined,
			@NotBlank(message = "organizationStatus cannpt be blank.") String organizationStatus) {
		this.userId = userId;
		this.userRole = userRole;
		this.userJoined = userJoined;
		this.organizationStatus = organizationStatus;
	}

	public UserAccount getUserId() {
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

	public void setUserId(UserAccount userId) {
		this.userId = userId;
	}

	public void setUserRole(String userRole) {
		this.userRole = userRole;
	}

	public void setUserJoined(LocalDate userJoined) {
		this.userJoined = userJoined;
	}

	public void setOrganizationStatus(String organizationStatus) {
		this.organizationStatus = organizationStatus;
	}

}
