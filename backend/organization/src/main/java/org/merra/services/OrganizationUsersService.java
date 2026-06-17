package org.merra.services;

import java.time.Duration;

import org.merra.dto.PersonalDetailsResponse;
import org.merra.entities.UserAccount;
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
	 * @return a {@linkplain PersonalDetailsResponse} containing the authenticated
	 *         user's first name, last name, full name, gender, country, and email.
	 * @throws java.util.NoSuchElementException if no authenticated user is found
	 *                                          in the database.
	 */
	public PersonalDetailsResponse personalDetails() {
		PersonalDetailsResponse authUserCache = (PersonalDetailsResponse) redisTemplate.opsForValue()
				.get(RedisKeys.AUTHENTICATED_USER_KEY);

		if (authUserCache == null) {
			UserAccount authUser = userAccountService.getAuthenticatedUser();
			authUserCache = new PersonalDetailsResponse(
					authUser.getUserId(),
					authUser.getFirstName(),
					authUser.getLastName(),
					authUser.getFullName().get(),
					authUser.getGender(),
					authUser.getCountry(),
					authUser.getEmail(),
					organizationService.getUserOrganizationAffiliation());
			redisTemplate.opsForValue().set(RedisKeys.AUTHENTICATED_USER_KEY, authUserCache, Duration.ofHours(2));
		}
		return authUserCache;
	}

	public PersonalDetailsResponse updatePrincipalDetails(PersonalDetailsResponse profile) {
		userAccountService.updateUserAccountProfile(profile);
		redisTemplate.delete(RedisKeys.AUTHENTICATED_USER_KEY);
		return personalDetails();
	}
}
