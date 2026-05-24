package org.merra.services;

import org.merra.dto.AuthenticatedUserProfile;
import org.merra.dto.PersonalDetailsResponse;
import org.merra.entities.UserAccount;
import org.springframework.stereotype.Service;

@Service
public class OrganizationUsersService {
    private final UserAccountService userAccountService;
    private final OrganizationService organizationService;
    
    public OrganizationUsersService(UserAccountService userAccountService, OrganizationService organizationService) {
        this.userAccountService = userAccountService;
        this.organizationService = organizationService;
    }
    
    /**
	 * Retrieves the personal details of the currently authenticated user.
	 *
	 * @return a {@linkplain PersonalDetailsResponse} containing the authenticated
	 *         user's first name, last name, full name, gender, country, and email.
	 * @throws java.util.NoSuchElementException if no authenticated user is found
	 *                                          in the database.
	 */
	public PersonalDetailsResponse personalDetails() {
		UserAccount authUser = userAccountService.getAuthenticatedUser();
		return new PersonalDetailsResponse(
				authUser.getFirstName(),
				authUser.getLastName(),
				authUser.getFullName().get(),
				authUser.getGender(),
				authUser.getCountry(),
				authUser.getEmail(),
                organizationService.getUserOrganizationAffiliation());
	}

	/**
	 * Updates the profile of the currently authenticated user and returns the
	 * refreshed personal details.
	 *
	 * @param profile - the {@linkplain AuthenticatedUserProfile} containing the
	 *                updated user information.
	 * @return a {@linkplain PersonalDetailsResponse} reflecting the updated
	 *         personal details.
	 * @throws java.util.NoSuchElementException if no authenticated user is found
	 *                                          in the database.
	 */
	public PersonalDetailsResponse updatePrincipalDetails(AuthenticatedUserProfile profile) {
		userAccountService.updateUserAccountProfile(profile);
		return personalDetails();
	}
}
