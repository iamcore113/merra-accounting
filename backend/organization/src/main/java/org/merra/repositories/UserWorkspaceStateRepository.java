package org.merra.repositories;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.entities.UserWorkspaceState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Finds the existing workspace state record by the user's UUID.
     *
     * @param userId The user's UUID
     * @return Optional containing {@link UserWorkspaceState} if present, or empty
     */
    @Query("SELECT w FROM UserWorkspaceState w WHERE w.user.userId = :userId")
    Optional<UserWorkspaceState> findByUserId(@Param("userId") UUID userId);

    /**
     * Deletes workspace state records where {@code last_active_at} is null or older than the cutoff timestamp.
     *
     * @param cutoff the threshold timestamp (e.g., 24 hours ago)
     * @return the number of removed records
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserWorkspaceState w WHERE w.lastActiveAt IS NULL OR w.lastActiveAt < :cutoff")
    int deleteInactiveWorkspaceStates(@Param("cutoff") OffsetDateTime cutoff);

    /**
     * Deletes the workspace state record for a specific user ID.
     *
     * @param userId the UUID of the user
     * @return the number of removed records
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserWorkspaceState w WHERE w.user.userId = :userId")
    int deleteByUserId(@Param("userId") UUID userId);
}
