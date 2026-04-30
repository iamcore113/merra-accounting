package org.merra.entities;

import java.time.LocalDate;
import java.util.UUID;

import org.merra.enums.UserAccountStatusEn;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "organization_members", schema = "merra_schema")
public class OrganizationMembers {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne
	@JoinColumn(name = "organization_id", nullable = false, referencedColumnName = "id")
	private Organization organization;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false, referencedColumnName = "user_id")
	private UserAccount user;

	@Column(name = "role", nullable = false)
	@NotBlank(message = "Role cannot be blank.")
	public String role;

	@Column(name = "is_creator", nullable = false)
	@NotNull(message = "isCreator field cannot be null.")
	private Boolean isCreator;

	@Column(name = "is_invited", nullable = false)
	@NotNull(message = "isInvited field cannot be null.")
	private Boolean isInvited;

	@ManyToOne
	@JoinColumn(name = "invitation_by", referencedColumnName = "user_id")
	private UserAccount invitationBy;

	@Column(name = "invitation_date")
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate invitationDate;

	@Column(name = "status", nullable = false)
	@NotBlank(message = "Status cannot be blank.")
	public String status = UserAccountStatusEn.ACTIVE.name();

	@Column(name = "date_joined")
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	public LocalDate dateJoined;

	@Column(name = "date_updated")
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	public LocalDate dateUpdated;

	public OrganizationMembers() {
	}

	// for the creator member
	public OrganizationMembers(Organization organization, UserAccount user) {
		this.organization = organization;
		this.user = user;
		this.isCreator = true;
		this.isInvited = false;
		this.role = UserAccountStatusEn.CREATOR.name();
		this.dateJoined = LocalDate.now();
	}

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	public UserAccount getUser() {
		return user;
	}

	public void setUser(UserAccount user) {
		this.user = user;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public Boolean getIsCreator() {
		return isCreator;
	}

	public void setIsCreator(Boolean isCreator) {
		this.isCreator = isCreator;
	}

	public Boolean getIsInvited() {
		return isInvited;
	}

	public void setIsInvited(Boolean isInvited) {
		this.isInvited = isInvited;
	}

	public LocalDate getInvitationDate() {
		return invitationDate;
	}

	public void setInvitationDate(LocalDate invitationDate) {
		this.invitationDate = invitationDate;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public LocalDate getDateJoined() {
		return dateJoined;
	}

	public void setDateJoined(LocalDate dateJoined) {
		this.dateJoined = dateJoined;
	}

	public LocalDate getDateUpdated() {
		return dateUpdated;
	}

	public void setDateUpdated(LocalDate dateUpdated) {
		this.dateUpdated = dateUpdated;
	}

	@Override
	public String toString() {
		return "OrganizationMembers{" +
				"id=" + id +
				", user=" + (user != null ? user.getUserId() : null) +
				", status='" + status + '\'' +
				'}';
	}
}
