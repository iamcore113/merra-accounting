package org.merra.multitenancy;

import java.util.UUID;

/**
 * Service interface for provisioning and migrating tenant database schemas.
 */
public interface TenantProvisioner {

    /**
     * Provisions a dedicated database schema for the given organization and applies
     * all tenant database migrations.
     *
     * @param organizationId the UUID of the organization
     */
    void provisionTenant(UUID organizationId);
}

