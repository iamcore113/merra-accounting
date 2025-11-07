package org.merra.entities.embedded;

import java.time.LocalDate;

import org.merra.entities.UserAccount;
import org.merra.utilities.OrganizationConstants;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Embeddable
public class OrganizationUserInvites {
	
	@ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "invitation_for", nullable = false)
	@NotNull(message = "InvitationFor field cannot be null.")
	private UserAccount invitationFor;
	
	@ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "invitation_by", nullable = false)
	@NotNull(message = "InvitationBy field cannot be null.")
	private UserAccount invitationBy;
	
	@Column(name = "invitation_role", nullable = false)
	@NotBlank(message = "invitationRole field cannot be null")
	private String invitationRole;
	
	@Column(name = "invite_date", nullable = false)
	@DateTimeFormat(iso = ISO.DATE)
	private LocalDate inviteDate = LocalDate.now();
	
	@Column(name = "invitation_status", nullable = false)
	private String invitationStatus = OrganizationConstants.INVITATION_STATUS_PENDING;

	public OrganizationUserInvites() {
	}

	public OrganizationUserInvites(@NotNull(message = "InvitationFor field cannot be null.") UserAccount invitationFor,
			@NotNull(message = "InvitationBy field cannot be null.") UserAccount invitationBy,
			@NotBlank(message = "invitationRole field cannot be null") String invitationRole, LocalDate inviteDate,
			String invitationStatus) {
		this.invitationFor = invitationFor;
		this.invitationBy = invitationBy;
		this.invitationRole = invitationRole;
		this.inviteDate = inviteDate;
		this.invitationStatus = invitationStatus;
	}

	public UserAccount getInvitationFor() {
		return invitationFor;
	}

	public UserAccount getInvitationBy() {
		return invitationBy;
	}

	public String getInvitationRole() {
		return invitationRole;
	}

	public LocalDate getInviteDate() {
		return inviteDate;
	}

	public String getInvitationStatus() {
		return invitationStatus;
	}

	public void setInvitationFor(UserAccount invitationFor) {
		this.invitationFor = invitationFor;
	}

	public void setInvitationBy(UserAccount invitationBy) {
		this.invitationBy = invitationBy;
	}

	public void setInvitationRole(String invitationRole) {
		this.invitationRole = invitationRole;
	}

	public void setInviteDate(LocalDate inviteDate) {
		this.inviteDate = inviteDate;
	}

	public void setInvitationStatus(String invitationStatus) {
		this.invitationStatus = invitationStatus;
	}

	
}