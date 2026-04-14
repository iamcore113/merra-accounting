package org.merra.entities;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.merra.enums.UserAccountStatusEn;
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

/**
 * Represents a user account persisted in {@code merra_schema.user_account}.
 *
 * <p>
 * This entity also implements {@link UserDetails} so it can be used directly
 * by Spring Security during authentication and authorization.
 * </p>
 */
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

	@Column(name = "gender", nullable = false)
	@NotBlank(message = "gender cannot be blank.")
	private String gender;

	@Column(name = "account_password")
	private String accountPassword;

	@Column(name = "account_role", nullable = false)
	@NotNull(message = "Roles cannot be null")
	private String roles = UserAccountStatusEn.IDLE.toString();

	// Defaults to false until the user is assigned as an organization owner.
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

	// Defaults to false until the user is linked to an organization.
	@Column(name = "part_of_organization", nullable = false)
	private boolean partOfOrganization = false;

	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "userAccount")
	private UserAccountSettings accountSettings;

	@Column(nullable = false, name = "is_enabled")
	private boolean isEnabled = false; // Default is disabled until verification/activation.

	@Column(name = "verification_token", columnDefinition = "text")
	private String verificationToken;

	public String getVerificationToken() {
		return verificationToken;
	}

	public void setVerificationToken(String verificationToken) {
		this.verificationToken = verificationToken;
	}

	/**
	 * Indicates whether this account is active for authentication.
	 *
	 * <p>
	 * Spring Security blocks authentication when this returns {@code false}.
	 * </p>
	 *
	 * @return {@code true} when the account is enabled and can authenticate.
	 */
	@Override
	public boolean isEnabled() {
		return this.isEnabled;
	}

	public void setIsEnabled(boolean en) {
		this.isEnabled = en;
	}

	@Override
	public Set<? extends GrantedAuthority> getAuthorities() {
		return Set.of(new SimpleGrantedAuthority(roles));
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

	/**
	 * Returns the display name composed from first and last name.
	 *
	 * @return Optional full name. Empty strings may be present if names are not
	 *         set.
	 */
	public Optional<String> getFullName() {
		return Optional.ofNullable(
				(this.firstName != null ? this.firstName : "") + " " + (this.lastName != null ? this.lastName : ""));
	}

	public UserAccount() {
	}

	public UserAccount(String email, String password) {
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

	/**
	 * Sets the role value and normalizes it to Spring Security role format.
	 *
	 * <p>
	 * If the provided value does not contain {@code ROLE_}, it is automatically
	 * converted to uppercase and prefixed with {@code ROLE_}.
	 * </p>
	 *
	 * @param roles Role string to assign.
	 */
	public void setRoles(String roles) {
		if (!roles.contains("ROLE_")) {
			this.roles = "ROLE_" + roles.toUpperCase();
		}
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
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
