package org.merra.repositories;

import java.util.Optional;
import java.util.UUID;

import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

	@Query("select org from Organization org where org.id = :id")
	Optional<Organization> findOrganizationById(@Param("id") UUID id);

	@Query(value = "SELECT user_id FROM organization_user_invites WHERE organization_id = ?1" +
			" AND user_role = 'SUBSCRIBER'", nativeQuery = true)
	Optional<UserAccount> findOrganizationSubscriber(UUID organizationId);

	/**
	 * This will retrieve the organization's country using organization ID
	 * 
	 * @param id - {@linkplain java.util.UUID} id
	 * @return - {@linkplain java.util.Optional} object.
	 */
	@Query("SELECT org.country FROM Organization org WHERE org.id = :id")
	Optional<String> findCountryUsingOrganizationId(@Param("id") UUID id);

	@Query("SELECT EXISTS(SELECT 1 FROM Organization org WHERE LOWER(org.displayName) = LOWER(:name) OR LOWER(org.legalName) = LOWER(:name))")
	boolean existsByDisplayNameOrLegalNameIgnoreCase(@Param("name") String name);

	boolean existsByDisplayNameIgnoreCase(String displayName);

}
