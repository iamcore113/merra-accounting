package org.merra.multitenancy;

import java.util.UUID;

/**
 * Service interface for checking and refreshing a user's active workspace state.
 */
public interface UserWorkspaceManager {

    /**
     * Checks whether the given user has an active workspace state within the last 24 hours.
     * If valid, refreshes {@code last_active_at} to the current timestamp and returns {@code true}.
     * If missing or expired (>= 24 hours old), removes any stale record and returns {@code false}.
     *
     * @param userId the UUID of the authenticated user
     * @return {@code true} if the user has a valid active workspace state, {@code false} otherwise
     */
    boolean checkAndRefreshWorkspace(UUID userId);
}
