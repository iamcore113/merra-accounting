package org.merra.multitenancy;

/**
 * Thread-safe context holder for the active tenant schema.
 * Defaults to the shared schema ("app") when no tenant context is explicitly set.
 */
public final class TenantContext {

    public static final String DEFAULT_TENANT = "app";

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    /**
     * Sets the active tenant schema for the current thread.
     *
     * @param tenantSchema the database schema name to use, or {@code null} to reset to default.
     */
    public static void setCurrentTenant(String tenantSchema) {
        if (tenantSchema == null || tenantSchema.trim().isEmpty() || DEFAULT_TENANT.equalsIgnoreCase(tenantSchema)) {
            CURRENT_TENANT.remove();
        } else {
            CURRENT_TENANT.set(tenantSchema.trim().toLowerCase());
        }
    }

    /**
     * Retrieves the active tenant schema name for the current thread.
     *
     * @return the current tenant schema name, or "app" if none is set.
     */
    public static String getCurrentTenant() {
        String tenant = CURRENT_TENANT.get();
        return (tenant != null && !tenant.isEmpty()) ? tenant : DEFAULT_TENANT;
    }

    /**
     * Checks whether the current thread is operating in the shared default schema ("app").
     *
     * @return {@code true} if current tenant is "app", {@code false} otherwise.
     */
    public static boolean isDefaultTenant() {
        return DEFAULT_TENANT.equalsIgnoreCase(getCurrentTenant());
    }

    /**
     * Clears the tenant context for the current thread to prevent thread-pool leakage.
     */
    public static void clear() {
        CURRENT_TENANT.remove();
    }
}

