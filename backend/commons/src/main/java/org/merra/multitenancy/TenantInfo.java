package org.merra.multitenancy;

import java.io.Serializable;

/**
 * Cached metadata representing an organization's tenant routing state.
 *
 * @param schemaName the dedicated database schema name (e.g. "tenant_<32-hex>")
 * @param status the status string matching {@link org.merra.enums.StatusEn} (e.g. "ACTIVE_ACCOUNT")
 */
public record TenantInfo(String schemaName, String status) implements Serializable {

    public static final String STATUS_ACTIVE = "ACTIVE_ACCOUNT";

    /**
     * Checks whether the organization is in an active state and eligible to process requests.
     *
     * @return true if status matches ACTIVE_ACCOUNT
     */
    public boolean isActive() {
        return STATUS_ACTIVE.equalsIgnoreCase(status);
    }
}

