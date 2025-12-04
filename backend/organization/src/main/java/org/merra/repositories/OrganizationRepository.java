package org.merra.repositories;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

	@Query("select org from Organization org where org.id = :id")
	Optional<Organization> findOrganizationById(@Param("id") UUID id);

	@Query(value = "SELECT user_id FROM organization_user_invites WHERE organization_id = ?1" +
			" AND user_role = 'SUBSCRIBER'", nativeQuery = true)
	Optional<UserAccount> findOrganizationSubscriber(UUID organizationId);

	/**
	 * This will retrieve lineAmountType value using organization's value
	 * 
	 * @param id - accepts {@linkplain java.util.UUID} object type
	 * @return - returns a {@linkplain java.util.Optional} object type.
	 */
	@Query("SELECT org.organizationType FROM Organization org WHERE org.id = :id")
	Optional<String> findLineAmountType(@Param("id") UUID id);

	/**
	 * This will retrieve the organization's country using organization ID
	 * 
	 * @param id - {@linkplain java.util.UUID} id
	 * @return - {@linkplain java.util.Optional} object.
	 */
	@Query("SELECT org.country FROM Organization org WHERE org.id = :id")
	Optional<String> findCountryUsingOrganizationId(@Param("id") UUID id);

	@Query("SELECT COUNT(org) > 0 FROM Organization org JOIN org.organizationUsers ou WHERE ou.userId.userId = :userId")
	boolean existsOrganizationsByUserId(@Param("userId") UUID userId);

	@Query("SELECT org FROM Organization org JOIN org.organizationUsers ou WHERE ou.userId.userId = :userId")
	Set<Organization> findOrganizationsByUserId(@Param("userId") UUID userId);
}
