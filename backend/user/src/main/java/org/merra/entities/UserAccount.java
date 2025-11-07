package org.merra.entities;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "user_account", schema = "merra_schema")
public class UserAccount implements UserDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "user_id", nullable = false, unique = true)
	private UUID userId;

	@Column(nullable = false, unique = true, name = "email")
	@Email(message = "Email should be valid")
	@NotBlank(message = "email attribute cannot be blank.")
	private String email;

	@Column(name = "first_name")
	private String firstName;

	@Column(name = "last_name")
	private String lastName;

	@Column(name = "account_password")
	private String accountPassword;

	@Column(name = "account_role", nullable = false)
	@NotNull(message = "Roles cannot be null")
	private String roles = "NONE";

	// A user by default doesn't own any organization
	@Column(name = "is_owner", nullable = false)
	private boolean isOwner = false;

	private String country;
	@Column(name = "profile_url")
	private String profileUrl;

	public String getProfileUrl() {
		return profileUrl;
	}

	public void setProfileUrl(String profileUrl) {
		this.profileUrl = profileUrl;
	}

	// A user by default isn't part of any organization
	@Column(name = "part_of_organization", nullable = false)
	private boolean partOfOrganization = false;

	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "userAccount")
	private UserAccountSettings accountSettings;

	@Column(nullable = false, name = "is_enabled")
	private boolean isEnabled = false; // Default to enabled when account is created

	@Column(name = "verification_token", columnDefinition = "text")
	private String verificationToken;

	public String getVerificationToken() {
		return verificationToken;
	}

	public void setVerificationToken(String verificationToken) {
		this.verificationToken = verificationToken;
	}

	@Override
	public boolean isEnabled() {
		return this.isEnabled; // Use your entity field
	}

	public void setIsEnabled(boolean en) {
		this.isEnabled = en;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority(roles));
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	@Override
	public String getUsername() {
		return this.email;
	}

	@Override
	public String getPassword() {
		return this.accountPassword;
	}

	public UserAccount() {
	}

	public UserAccount(@NonNull String email, String password) {
		this.email = email;
		this.accountPassword = password;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getAccountPassword() {
		return accountPassword;
	}

	public void setAccountPassword(String accountPassword) {
		this.accountPassword = accountPassword;
	}

	public String getRoles() {
		return roles;
	}

	public void setRoles(String roles) {
		this.roles = roles;
	}

	public boolean isOwner() {
		return isOwner;
	}

	public void setOwner(boolean isOwner) {
		this.isOwner = isOwner;
	}

	public boolean isPartOfOrganization() {
		return partOfOrganization;
	}

	public void setPartOfOrganization(boolean partOfOrganization) {
		this.partOfOrganization = partOfOrganization;
	}

	public UserAccountSettings getAccountSettings() {
		return accountSettings;
	}

	public void setAccountSettings(UserAccountSettings accountSettings) {
		this.accountSettings = accountSettings;
	}

	@Override
	public String toString() {
		return "UserAccount [email=" + email + ", isEnabled=" + isEnabled + ", roles=" + roles + "]";
	}

}
