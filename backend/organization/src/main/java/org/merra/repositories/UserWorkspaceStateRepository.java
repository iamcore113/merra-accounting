package org.merra.repositories;

import java.util.Optional;
import java.util.UUID;

import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.entities.UserWorkspaceState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserWorkspaceStateRepository extends JpaRepository<UserWorkspaceState, UUID> {
    /**
     * Finds the current {@link Organization} associated with the authenticated
     * principal (current user).
     * <p>
     * This method uses a Spring Expression Language (SpEL) query to select the
     * organization
     * from the {@link UserWorkspaceState} entity where the user ID matches the
     * principal's ID.
     *
     * @return the current {@link Organization} for the authenticated user, or
     *         {@code null} if not found
     */
    @Query("select w.currentOrganization from UserWorkspaceState w where w.user.userId = ?#{ principal?.userId }")
    Optional<Organization> findCurrentOrganizationByPrincipal();

    /**
     * Finds the existing workspace state record for a given user.
     *
     * @param user The {@link UserAccount} entity
     * @return Optional containing {@link UserWorkspaceState} if present, or empty
     */
    Optional<UserWorkspaceState> findByUser(UserAccount user);
}
