package org.merra.services;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import org.merra.dto.UserPersonalInformationRequest;
import org.merra.dto.UserPersonalInformationResponse;
import org.merra.entities.UserAccount;
import org.merra.entities.UserAccountSettings;
import org.merra.enums.Roles;
import org.merra.mapper.UserMapper;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserAccountSettingsRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UserAccountService {
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

	// TODO - createUserAccountSetting() must test this method
	public void createUserAccountSetting(UserAccount account) {
		UserAccountSettings accountSettings = new UserAccountSettings(account);

		try {
			accountSettingsRepository.save(accountSettings);
		} catch (DataIntegrityViolationException e) {
			e.printStackTrace();
		}
	}

	/**
	 * This method will retrieve UserAccount entity by ID.
	 * 
	 * @param id - accepts {@linkplain java.util.UUID} type
	 * @return - {@linkplain UserAccount} object type.
	 */
	public UserAccount retrieveById(UUID id) {
		Optional<UserAccount> findById = userRepository.findById(id);

		if (findById.isEmpty()) {
			throw new EntityNotFoundException("User entity " + id + " not found.");
		}
		return findById.get();
	}

	/**
	 * This will retrieve current authenticated user entity
	 * 
	 * @return {@linkplain UserAccount} object
	 * @exception - throw {@linkplain java.util.NoSuchElementException}
	 *              if it can't find one.
	 */
	public UserAccount getAuthenticatedUser() {
		Optional<UserAccount> findAuthUser = userRepository.findAuthenticatedUser();

		if (findAuthUser.isEmpty()) {
			throw new NoSuchElementException("Authenticated user not found in the database.");
		}

		return findAuthUser.get();
	}

	public String retrieveRole(String role) {
		if (role == Roles.SUBSCRIBER.toString()) {
			return Roles.SUBSCRIBER.toString();
		} else if (role == Roles.READ_ONLY.toString()) {
			return Roles.READ_ONLY.toString();
		} else if (role == Roles.INVOICE_ONLY.toString()) {
			return Roles.READ_ONLY.toString();
		} else {
			return "n/a";
		}
	}

	public void enableUserAccount(@NonNull UUID userId) {
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
}
