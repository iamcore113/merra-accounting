package org.merra.services;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.merra.entities.UserWorkspaceState;
import org.merra.multitenancy.UserWorkspaceManager;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Background scheduler and workspace state manager that monitors user login/activity
 * timestamps in {@code user_workspace_state} and removes records for users who have not
 * logged in within the last 24 hours.
 */
@Service
public class UserWorkspaceStateScheduler implements UserWorkspaceManager {

    private static final Logger logger = LoggerFactory.getLogger(UserWorkspaceStateScheduler.class);
    public static final Duration INACTIVITY_THRESHOLD = Duration.ofHours(24);

    private final UserWorkspaceStateRepository userWorkspaceStateRepository;

    public UserWorkspaceStateScheduler(UserWorkspaceStateRepository userWorkspaceStateRepository) {
        this.userWorkspaceStateRepository = userWorkspaceStateRepository;
    }

    /**
     * Periodically checks and removes records from {@code user_workspace_state}
     * where {@code last_active_at} is older than 24 hours (or null).
     * Runs every 15 minutes by default, configurable via {@code app.workspace.cleanup-interval-ms}.
     */
    @Scheduled(fixedRateString = "${app.workspace.cleanup-interval-ms:900000}")
    @Transactional
    public void cleanupExpiredWorkspaceStates() {
        OffsetDateTime cutoff = OffsetDateTime.now().minus(INACTIVITY_THRESHOLD);
        int removedCount = userWorkspaceStateRepository.deleteInactiveWorkspaceStates(cutoff);
        if (removedCount > 0) {
            logger.info("Removed {} expired user_workspace_state record(s) inactive since before {}",
                    removedCount, cutoff);
        }
    }

    @Override
    @Transactional
    public boolean checkAndRefreshWorkspace(UUID userId) {
        if (userId == null) {
            return false;
        }

        Optional<UserWorkspaceState> stateOpt = userWorkspaceStateRepository.findByUserId(userId);
        if (stateOpt.isEmpty()) {
            return false;
        }

        UserWorkspaceState state = stateOpt.get();
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime cutoff = now.minus(INACTIVITY_THRESHOLD);

        if (state.getLastActiveAt() == null || state.getLastActiveAt().isBefore(cutoff)
                || state.getCurrentOrganization() == null) {
            userWorkspaceStateRepository.deleteByUserId(userId);
            logger.info("Removed expired user_workspace_state record for user {} during login check", userId);
            return false;
        }

        state.setLastActiveAt(now);
        userWorkspaceStateRepository.save(state);
        return true;
    }
}
