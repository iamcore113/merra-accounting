package org.merra.config.multitenancy;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.merra.multitenancy.TenantContext;

class CurrentTenantIdentifierResolverImplTest {

    private final CurrentTenantIdentifierResolverImpl resolver = new CurrentTenantIdentifierResolverImpl();

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Returns 'app' when no tenant is set in TenantContext")
    void resolveDefaultTenant() {
        assertThat(resolver.resolveCurrentTenantIdentifier()).isEqualTo("app");
        assertThat(resolver.isRoot("app")).isTrue();
        assertThat(resolver.isRoot("tenant_123")).isFalse();
    }

    @Test
    @DisplayName("Returns active tenant schema when set in TenantContext")
    void resolveActiveTenant() {
        TenantContext.setCurrentTenant("tenant_98765432101234567890123456789012");
        assertThat(resolver.resolveCurrentTenantIdentifier()).isEqualTo("tenant_98765432101234567890123456789012");
    }

    @Test
    @DisplayName("validateExistingCurrentSessions returns true")
    void validateExistingCurrentSessions() {
        assertThat(resolver.validateExistingCurrentSessions()).isTrue();
    }
}

