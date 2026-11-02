package org.merra.config.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.merra.multitenancy.TenantContext;
import org.springframework.stereotype.Component;

/**
 * Resolves the active tenant identifier from {@link TenantContext} for Hibernate sessions.
 */
@Component
public class CurrentTenantIdentifierResolverImpl implements CurrentTenantIdentifierResolver<String> {

    @Override
    public String resolveCurrentTenantIdentifier() {
        return TenantContext.getCurrentTenant();
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }

    @Override
    public boolean isRoot(String tenantId) {
        return TenantContext.DEFAULT_TENANT.equalsIgnoreCase(tenantId);
    }
}

