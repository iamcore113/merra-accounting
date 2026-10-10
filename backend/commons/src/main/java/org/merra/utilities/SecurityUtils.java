package org.merra.utilities;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility methods for accessing Spring Security context information.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * Retrieves the current authenticated {@link Authentication} from the security context.
     *
     * @return an {@link Optional} containing the authentication if present and authenticated
     */
    public static Optional<Authentication> getAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        return Optional.of(auth);
    }

    /**
     * Retrieves the current authenticated principal if it matches the expected type.
     *
     * @param <T> the expected principal type
     * @param requiredType the Class of the expected principal
     * @return an {@link Optional} containing the typed principal if authenticated and of matching type
     */
    @SuppressWarnings("unchecked")
    public static <T> Optional<T> getPrincipal(Class<T> requiredType) {
        return getAuthentication()
                .map(Authentication::getPrincipal)
                .filter(requiredType::isInstance)
                .map(p -> (T) p);
    }
}
