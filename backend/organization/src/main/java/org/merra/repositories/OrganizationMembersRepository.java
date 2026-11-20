package org.merra.repositories;

import java.util.List;
import java.util.UUID;

import org.merra.entities.OrganizationMembers;
import org.merra.repositories.projections.UserOrganizationAffiliations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrganizationMembersRepository extends JpaRepository<OrganizationMembers, UUID> {

	/**
	 * Retrieves a list of organizations and the authenticated user's role in each,
	 * for all organizations the currently authenticated user is a member of.
	 *
	 * @return a {@link List} of {@link UserOrganizationAffiliations} projections
	 *         containing the organization details and the user's role within it.
	 */
	@Query("SELECT om.organization AS organization, om.role AS role " +
			"FROM OrganizationMembers om " +
			"WHERE om.user.userId = ?#{ principal?.userId } " +
			"AND om.status = 'ACTIVE'")
	List<UserOrganizationAffiliations> findUserOrganizationAffiliations();

	/**
	 * Returns the total number of organizations the currently authenticated user
	 * is affiliated with.
	 *
	 * @return the count of organization memberships for the authenticated user.
	 */
	@Query("SELECT COUNT(om) FROM OrganizationMembers om WHERE om.user.userId = ?#{ principal?.userId } AND om.status = 'ACTIVE'")
	Long countByUserOrganizationAffiliation();

	/**
	 * Checks if a specific user is an active member of the specified organization.
	 *
	 * @param orgId the UUID of the organization
	 * @param userId the UUID of the user
	 * @return true if the membership exists, false otherwise
	 */
	@Query("SELECT COUNT(om) > 0 FROM OrganizationMembers om WHERE om.organization.id = :orgId AND om.user.userId = :userId AND om.status = 'ACTIVE'")
	boolean isUserMemberOfOrganization(
			@org.springframework.data.repository.query.Param("orgId") UUID orgId,
			@org.springframework.data.repository.query.Param("userId") UUID userId);

	/**
	 * Checks if a user with the specified email is already an active member of the organization.
	 *
	 * @param orgId the UUID of the organization
	 * @param email the email address to check
	 * @return true if an active membership exists for that email in the organization, false otherwise
	 */
	@Query("SELECT COUNT(om) > 0 FROM OrganizationMembers om " +
			"LEFT JOIN om.user u " +
			"WHERE om.organization.id = :orgId " +
			"AND om.status = 'ACTIVE' " +
			"AND (LOWER(om.email) = LOWER(:email) OR LOWER(u.email) = LOWER(:email))")
	boolean isEmailMemberOfOrganization(
			@org.springframework.data.repository.query.Param("orgId") UUID orgId,
			@org.springframework.data.repository.query.Param("email") String email);
}