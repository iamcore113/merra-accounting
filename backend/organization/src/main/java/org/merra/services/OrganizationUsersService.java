package org.merra.services;

import org.merra.dto.PrincipalDetailsResponse;
import org.merra.dto.PrincipalAccountSettings;
import org.merra.entities.UserAccount;
import org.merra.entities.UserAccountSettings;
import org.merra.utilities.RedisKeys;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrganizationUsersService {
	private final UserAccountService userAccountService;
	private final OrganizationService organizationService;
	private final RedisTemplate<String, Object> redisTemplate;

	public OrganizationUsersService(UserAccountService userAccountService, OrganizationService organizationService,
			RedisTemplate<String, Object> redisTemplate) {
		this.userAccountService = userAccountService;
		this.organizationService = organizationService;
		this.redisTemplate = redisTemplate;
	}

	/**
	 * Retrieves the personal details of the currently authenticated user.
	 * The results are cached per user in Redis to improve performance.
	 *
	 * @return a {@linkplain PrincipalDetailsResponse} containing the authenticated
	 *         user's first name, last name, full name, gender, country, and email.
	 * @throws java.util.NoSuchElementException if no authenticated user is found
	 *                                          in the database.
	 */
	public PrincipalDetailsResponse personalDetails() {
		PrincipalDetailsResponse principalDto = (PrincipalDetailsResponse) redisTemplate.opsForValue()
				.get(RedisKeys.PRINCIPAL);

		if (principalDto == null) {
			UserAccount getPrincipal = userAccountService.getAuthenticatedUser();
			UserAccountSettings principalAccountSettings = getPrincipal.getAccountSettings();
			PrincipalAccountSettings principalAccountSettingsDto = new PrincipalAccountSettings(
					principalAccountSettings.getUserSettingId(),
					principalAccountSettings.getUserAccount().getUserId(),
					principalAccountSettings.getAutoAcceptInvitation(),
					principalAccountSettings.getEmailChange());
			principalDto = new PrincipalDetailsResponse(
					getPrincipal.getUserId(),
					getPrincipal.getFirstName(),
					getPrincipal.getLastName(),
					getPrincipal.getFullName().get(),
					getPrincipal.getGender(),
					getPrincipal.getCountry(),
					getPrincipal.getEmail(),
					organizationService.getUserOrganizationAffiliation());

			redisTemplate.opsForValue().set(RedisKeys.PRINCIPAL, principalDto, RedisKeys.CONSTANT_DURATION);
			redisTemplate.opsForValue().set(RedisKeys.PRINCIPAL_ACCOUNT_SETTINGS, principalAccountSettingsDto,
					RedisKeys.CONSTANT_DURATION);
		}
		return principalDto;
	}

	public PrincipalDetailsResponse updatePrincipalDetails(PrincipalDetailsResponse profile) {
		userAccountService.updateUserAccountProfile(profile);
		redisTemplate.delete(RedisKeys.PRINCIPAL);
		return personalDetails();
	}
}
