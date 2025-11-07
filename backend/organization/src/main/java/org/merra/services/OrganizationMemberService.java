package org.merra.services;

import java.util.HashSet;
import java.util.Set;

import org.merra.dto.CreateOrganizationRequest;
import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.entities.UserAccountSettings;
import org.merra.entities.embedded.OrganizationUserInvites;
import org.merra.entities.embedded.OrganizationUsers;
import org.merra.enums.Roles;
import org.springframework.stereotype.Service;

@Service
public class OrganizationMemberService {
	private final UserAccountService userAccountService;

	public OrganizationMemberService(
			UserAccountService userAccountService
	) {
		this.userAccountService = userAccountService;
	}
	
	/**
	 * This method will set the organization's advisor.
	 * @return - return {@linkplain OrganizationUsers} object type
	 */
	public OrganizationUsers addOrganizationAdvisor() {
		OrganizationUsers organizationUsers = new OrganizationUsers();
		organizationUsers.setUserId(userAccountService.getAuthenticatedUser());
		organizationUsers.setUserRole(Roles.ADVISOR.toString());

		return organizationUsers;
	}
	
	/**
	 * Add advisor to organization object
	 * @param organization - accepts {@linkplain Organization} object type.
	 */
	public void addAdvisor(Organization organization) {
		OrganizationUsers advisor = addOrganizationAdvisor();
		organization.setOrganizationUsers(Set.of(advisor));
	}
	
    public void addInvitedUsers(
    		Set<CreateOrganizationRequest.InviteUser> invitations,
    		Organization organization
    ) {
    	UserAccount authenticatedUser = userAccountService.getAuthenticatedUser();
    	UserAccount invitedUserAccount = null;
    	UserAccountSettings accountSettings = null;
    	Set<OrganizationUsers> organizationUsers = organization.getOrganizationUsers();
    	Set<OrganizationUserInvites> organizationUserInvites = new HashSet<>();
    	
    	for (CreateOrganizationRequest.InviteUser user: invitations) {
    		invitedUserAccount = userAccountService.retrieveById(user.userId()); // Get the UserAccount object
    		accountSettings = invitedUserAccount.getAccountSettings(); // Get User's account settings
    		
    		/**
    		 * If user account's @autoAcceptInvitation (from UserAccountSettings)
    		 * is set to @true (By default is set to @true).
    		 * automatically accept the invitation else
    		 * add the invited user to organization's @OrganizationUserInvites
    		 */
    		if (accountSettings.getAutoAcceptInvitation()) {
    			OrganizationUsers newOrganizationUser = new OrganizationUsers();
				newOrganizationUser.setUserId(invitedUserAccount);
				newOrganizationUser.setUserRole(userAccountService.retrieveRole(user.role()));
    			organizationUsers.add(newOrganizationUser);
    		} else {
    			OrganizationUserInvites addInvites = new OrganizationUserInvites();
				addInvites.setInvitationFor(invitedUserAccount);
				addInvites.setInvitationBy(authenticatedUser);
				addInvites.setInvitationRole(userAccountService.retrieveRole(user.role()));
    			organizationUserInvites.add(addInvites);
    		}
    		
    		invitedUserAccount = null;
    		accountSettings = null;
    	}
    	
    	organization.setOrganizationUsers(organizationUsers); // Set new organization users
    	organization.setOrganizationUserInvites(organizationUserInvites); // Set new organization user invites
    }
}
