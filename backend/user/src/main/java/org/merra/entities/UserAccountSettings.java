package org.merra.entities;

import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "user_account_settings", schema = "merra_schema")
public class UserAccountSettings {
	@Id @GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "user_setting_id", nullable = false, unique = true)
	private UUID userSettingId;
	
	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@NotNull(message = "userAccount cannot be null.")
	@JoinColumn(name = "user_account", nullable = false, unique = true)
	private UserAccount userAccount;
	
	/**
	 * This column by default is set to true.
	 * By setting this to true, users are automatically accepted
	 * when invited to an organization
	 */
	@Column(name = "auto_accept_invitation", nullable = false)
	private Boolean autoAcceptInvitation = true;

	public UserAccountSettings() {
	}

	public UserAccountSettings(@NotNull(message = "userAccount cannot be null.") UserAccount userAccount) {
		this.userAccount = userAccount;
		this.autoAcceptInvitation = true;
	}

	public UUID getUserSettingId() {
		return userSettingId;
	}

	public UserAccount getUserAccount() {
		return userAccount;
	}

	public void setUserAccount(UserAccount userAccount) {
		this.userAccount = userAccount;
	}

	public Boolean getAutoAcceptInvitation() {
		return autoAcceptInvitation;
	}

	public void setAutoAcceptInvitation(Boolean autoAcceptInvitation) {
		this.autoAcceptInvitation = autoAcceptInvitation;
	}

	
}
