package org.merra.dto;

import java.util.List;
import java.util.UUID;

public class SigninResponse {
	private JwtTokens tokens;
	private AccountStatus accountStatus;
	private Userdetails userdetails;

	public Userdetails getUserdetails() {
		return userdetails;
	}

	public void setUserdetails(Userdetails userdetails) {
		this.userdetails = userdetails;
	}

	public JwtTokens getTokens() {
		return tokens;
	}

	public void setTokens(JwtTokens tokens) {
		this.tokens = tokens;
	}

	public AccountStatus getAccountStatus() {
		return accountStatus;
	}

	public void setAccountStatus(AccountStatus accountStatus) {
		this.accountStatus = accountStatus;
	}

	public SigninResponse(JwtTokens tokens, AccountStatus accountStatus) {
		this.tokens = tokens;
		this.accountStatus = accountStatus;
	}

	public SigninResponse() {
	}

	public class AccountStatus {
		private boolean isComplete;
		private boolean partOfOrganization;
		private boolean isEnabled;

		public AccountStatus(boolean isComplete, boolean isEnabled, boolean partOfOrganization) {
			this.isComplete = isComplete;
			this.isEnabled = isEnabled;
			this.partOfOrganization = partOfOrganization;
		}

		public boolean isComplete() {
			return isComplete;
		}

		public void setComplete(boolean isComplete) {
			this.isComplete = isComplete;
		}

		public boolean isEnabled() {
			return isEnabled;
		}

		public void setEnabled(boolean isEnabled) {
			this.isEnabled = isEnabled;
		}

		public boolean isPartOfOrganization() {
			return partOfOrganization;
		}

		public void setPartOfOrganization(boolean partOfOrganization) {
			this.partOfOrganization = partOfOrganization;
		}
	}

	public class Userdetails {
		private UUID userId;
		private String email;
		private List<String> roles;

		public UUID getUserId() {
			return userId;
		}

		public void setUserId(UUID userId) {
			this.userId = userId;
		}

		public String getEmail() {
			return email;
		}

		public void setEmail(String email) {
			this.email = email;
		}

		public List<String> getRoles() {
			return roles;
		}

		public void setRoles(List<String> roles) {
			this.roles = roles;
		}

		public Userdetails(UUID userId, String email, List<String> roles) {
			this.userId = userId;
			this.email = email;
			this.roles = roles;
		}
	}
}