package org.merra.services;

import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.merra.dto.PrincipalDetailsResponse;
import org.merra.dto.UserPersonalInformationRequest;
import org.merra.dto.UserPersonalInformationResponse;
import org.merra.entities.UserAccount;
import org.merra.entities.UserAccountSettings;
import org.merra.enums.Roles;
import org.merra.enums.UserAccountStatusEn;
import org.merra.mapper.UserMapper;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserAccountSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;

@Service
@Validated
public class UserAccountService {
	private static final Logger logger = LoggerFactory.getLogger(UserAccountService.class);
	private final UserMapper userMapper;
	private final UserAccountRepository userRepository;
	private final UserAccountSettingsRepository accountSettingsRepository;

	public UserAccountService(
			UserMapper userMapper,
			UserAccountRepository userRepository,
			UserAccountSettingsRepository accountSettingsRepository) {
		this.userMapper = userMapper;
		this.userRepository = userRepository;
		this.accountSettingsRepository = accountSettingsRepository;
	}

	// TODO - createUserAccountSetting() must test this method.
	/**
	 * This method will create new UserAccountSettings entity.
	 * 
	 * @param account - accepts {@linkplain UserAccount} object type.
	 */
	public void createUserAccountSetting(UserAccount account) {
		UserAccountSettings accountSettings = new UserAccountSettings(account);

		try {
			accountSettingsRepository.save(accountSettings);
		} catch (DataIntegrityViolationException e) {
			logger.error("Error saving account settings", e);
		}
	}

	/**
	 * This method will retrieve UserAccount entity by ID.
	 * 
	 * @param id - accepts {@linkplain java.util.UUID} type
	 * @return - {@linkplain UserAccount} object type.
	 */
	public UserAccount retrieveById(@NotNull UUID id) {
		Optional<UserAccount> findById = userRepository.findById(id);

		if (findById.isEmpty()) {
			throw new EntityNotFoundException("User entity " + id + " not found.");
		}
		return findById.get();
	}

	public Optional<String> returnAccountFullName(UUID userId) {
		return retrieveById(userId).getFullName();
	}

	/**
	 * This will retrieve current authenticated user entity
	 * 
	 * @return {@linkplain UserAccount} object
	 * @exception - throw {@linkplain java.util.NoSuchElementException}
	 *              if it can't find one.
	 */
	public UserAccount getAuthenticatedUser() {
		UserAccount findAuthUser = userRepository.findAuthenticatedUser()
				.orElseThrow(() -> new NoSuchElementException("Authenticated user not found in the database."));

		return findAuthUser;
	}

	public String retrieveRole(String role) {
		if (role.equals(Roles.SUBSCRIBER.toString())) {
			return Roles.SUBSCRIBER.toString();
		} else if (role.equals(Roles.READ_ONLY.toString())) {
			return Roles.READ_ONLY.toString();
		} else if (role.equals(Roles.INVOICE_ONLY.toString())) {
			return Roles.READ_ONLY.toString();
		} else {
			return "n/a";
		}
	}

	public void enableUserAccount(UUID userId) {
		UserAccount getUserAccount = userRepository.findById(userId)
				.orElseThrow(() -> new EntityNotFoundException("User entity " + userId + " not found."));

		getUserAccount.setIsEnabled(true);
		userRepository.save(getUserAccount);
	}

	public UserPersonalInformationResponse fillUserAccountInfo(UserPersonalInformationRequest req) {
		Optional<UserAccount> userAcc = userRepository.findUserByEmailIgnoreCase(req.email());
		if (userAcc.isEmpty()) {
			throw new EntityNotFoundException("User with email " + req.email() + " not found.");
		}
		UserAccount user = userAcc.get();
		user.setFirstName(req.firstName());
		user.setLastName(req.lastName());
		user.setCountry(req.country());
		userRepository.save(user);

		return userMapper.toUserPersonalInformationResponse(user);
	}

	/**
	 * Updates the persisted profile fields of the currently authenticated user
	 * with the values provided in the given profile.
	 *
	 * <p>
	 * Each field is only written when its value differs from what is already
	 * stored, avoiding unnecessary dirty-marking. Email changes are persisted but
	 * are still pending further handling (see inline TODO).
	 * </p>
	 *
	 * @param profile - the {@linkplain PrincipalDetailsResponse} carrying the
	 *                desired field values.
	 * @throws IllegalArgumentException         if the {@code profile.id()} does not
	 *                                          match
	 *                                          the ID of the currently
	 *                                          authenticated user.
	 * @throws java.util.NoSuchElementException if no authenticated user is found
	 *                                          in the database.
	 */
	public void updateUserAccountProfile(PrincipalDetailsResponse profile) {
		final UUID userId = profile.id();
		UserAccount user = getAuthenticatedUser();

		if (!user.getUserId().equals(userId)) {
			throw new IllegalArgumentException("User ID does not match authenticated user");
		}

		if (!Objects.equals(user.getFirstName(), profile.firstName())) {
			user.setFirstName(profile.firstName());
		}
		if (!Objects.equals(user.getLastName(), profile.lastName())) {
			user.setLastName(profile.lastName());
		}
		if (!Objects.equals(user.getCountry(), profile.country())) {
			user.setCountry(profile.country());
		}
		if (!Objects.equals(user.getGender(), profile.gender())) {
			user.setGender(profile.gender());
		}
		// TODO: Still need to work more on this
		if (!Objects.equals(user.getEmail(), profile.email())) {
			user.setEmail(profile.email());
		}
		userRepository.save(user);
	}

	public void setUserRole(@NotNull UserAccount user, @NotNull UserAccountStatusEn role) {
		String roleName = role.name();

		user.setRoles(roleName);
		userRepository.save(user);
	}

	/**
	 * Retrieves the currently authenticated user from the security context.
	 *
	 * @return the {@link UserAccount} entity of the authenticated user
	 * @throws EntityNotFoundException if no authenticated user is found in the
	 *                                 database
	 */
	public UserAccount getCurrentAuthenticatedUser() {
		return userRepository.findAuthenticatedUser()
				.orElseThrow(() -> new EntityNotFoundException("User entity not found."));
	}
}
