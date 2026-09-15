package org.merra.repositories;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.merra.entities.Account;
import org.merra.repositories.projections.AccountLookup;
import org.merra.repositories.projections.JournalAccountLookup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountRepository extends JpaRepository<Account, UUID> {

	/**
	 * Finds and retrieves a lightweight lookup projection of an account by its unique code 
	 * and associated organization ID.
	 * <p>
	 * This is typically used as a fast validation query to check if an account exists 
	 * and is active for the specified organization before processing invoices or journals.
	 *
	 * @param code           the unique code of the account (e.g., "200" for Accounts Payable)
	 * @param organizationId the UUID of the organization the account belongs to
	 * @return an {@link Optional} containing the {@link AccountLookup} projection if found, 
	 *         or empty if no matching account exists for the organization
	 */
	@Query("SELECT ac.code FROM Account ac WHERE ac.code = :code " +
			"AND ac.organization.id = :organizationId")
	Optional<AccountLookup> findAccountByCodeAndOrganization(
			@Param("code") String code,
			@Param("organizationId") UUID organizationId);

	@Query("SELECT ac.code FROM Account ac WHERE ac.code = :code " +
			"AND ac.organization.id = :organizationId")
	Optional<JournalAccountLookup> findJournalAccountDetail(
			@Param("code") String code,
			@Param("organizationId") UUID organizationId);

	@Query("SELECT ac FROM Account ac WHERE ac.code = :code AND ac.organization.id = :organizationId")
	Optional<Account> findByAccountCodeAndOrganizationId(
			@Param("code") String code,
			@Param("organizationId") UUID organizationId);

	boolean existsByCodeIgnoreCase(String code);

	@Query("SELECT ac FROM Account ac WHERE ac.archived = false")
	Set<Account> findAllNotArchived();

	@Query("SELECT ac FROM Account ac WHERE ac.organization.id = :organizationId")
	Set<Account> findAccountByOrganizationId(@Param("organizationId") UUID organizationId);
}
