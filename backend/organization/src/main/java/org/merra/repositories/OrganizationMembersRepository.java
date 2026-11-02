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
			"WHERE om.user.userId = ?#{ principal?.userId }")
	List<UserOrganizationAffiliations> findUserOrganizationAffiliations();

	/**
	 * Returns the total number of organizations the currently authenticated user
	 * is affiliated with.
	 *
	 * @return the count of organization memberships for the authenticated user.
	 */
	@Query("SELECT COUNT(om) FROM OrganizationMembers om WHERE om.user.userId = ?#{ principal?.userId }")
	Long countByUserOrganizationAffiliation();

	/**
	 * Checks if a specific user is an active member of the specified organization.
	 *
	 * @param orgId the UUID of the organization
	 * @param userId the UUID of the user
	 * @return true if the membership exists, false otherwise
	 */
	@Query("SELECT COUNT(om) > 0 FROM OrganizationMembers om WHERE om.organization.id = :orgId AND om.user.userId = :userId")
	boolean isUserMemberOfOrganization(
			@org.springframework.data.repository.query.Param("orgId") UUID orgId,
			@org.springframework.data.repository.query.Param("userId") UUID userId);
}