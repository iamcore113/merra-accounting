package org.merra.dto;

import java.util.Set;
import java.util.UUID;

public class UserOrganizationResponse {
	private UserDetails userDetails;
	private Set<OrganizationDetails> organizations;
	
	public UserOrganizationResponse() {
	}
	
	
	public UserDetails getUserDetails() {
		return userDetails;
	}

	public void setUserDetails(UserDetails userDetails) {
		this.userDetails = userDetails;
	}

	public Set<OrganizationDetails> getOrganizations() {
		return organizations;
	}

	public void setOrganizations(Set<OrganizationDetails> organizations) {
		this.organizations = organizations;
	}


	public static class UserDetails {
		private UUID userId;
		private String fullName;
		private String email;
		
		public UserDetails() {
		}

		public UserDetails(UUID userId, String fullName, String email) {
			this.userId = userId;
			this.fullName = fullName;
			this.email = email;
		}
		public UUID getUserId() {
			return userId;
		}
		public void setUserId(UUID userId) {
			this.userId = userId;
		}
		public String getFullName() {
			return fullName;
		}
		public void setFullName(String fullName) {
			this.fullName = fullName;
		}
		public String getEmail() {
			return email;
		}
		public void setEmail(String email) {
			this.email = email;
		}
			
	}
	
	public static class OrganizationDetails {
		private UUID organizationId;
		private String displayName;
		
		public OrganizationDetails() {
		}
		
		public OrganizationDetails(UUID organizationId, String displayName) {
			this.organizationId = organizationId;
			this.displayName = displayName;
		}

		public UUID getOrganizationId() {
			return organizationId;
		}
		public void setOrganizationId(UUID organizationId) {
			this.organizationId = organizationId;
		}
		public String getDisplayName() {
			return displayName;
		}
		public void setDisplayName(String displayName) {
			this.displayName = displayName;
		}
	}
}
