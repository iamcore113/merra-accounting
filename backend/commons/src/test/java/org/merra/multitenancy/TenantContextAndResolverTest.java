package org.merra.multitenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TenantContextAndResolverTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("TenantContext defaults to 'app' when uninitialized or cleared")
    void testTenantContextDefault() {
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
        assertThat(TenantContext.isDefaultTenant()).isTrue();

        TenantContext.setCurrentTenant("tenant_abc");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("tenant_abc");
        assertThat(TenantContext.isDefaultTenant()).isFalse();

        TenantContext.clear();
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
        assertThat(TenantContext.isDefaultTenant()).isTrue();
    }

    @Test
    @DisplayName("TenantContext treats null, empty, or 'app' as default")
    void testTenantContextReset() {
        TenantContext.setCurrentTenant("tenant_123");
        TenantContext.setCurrentTenant(null);
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("app");

        TenantContext.setCurrentTenant("tenant_123");
        TenantContext.setCurrentTenant("   ");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("app");

        TenantContext.setCurrentTenant("tenant_123");
        TenantContext.setCurrentTenant("APP");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("app");
    }

    @Test
    @DisplayName("TenantResolver converts UUID to valid schema name and back")
    void testTenantResolverConversion() {
        UUID orgId = UUID.fromString("12345678-1234-1234-1234-123456789abc");
        String schema = TenantResolver.toSchemaName(orgId);

        assertThat(schema).isEqualTo("tenant_12345678123412341234123456789abc");
        assertThat(TenantResolver.isValidTenantSchema(schema)).isTrue();
        assertThat(TenantResolver.toOrganizationId(schema)).isEqualTo(orgId);
    }

    @Test
    @DisplayName("TenantResolver rejects invalid schema names")
    void testTenantResolverValidation() {
        assertThat(TenantResolver.isValidTenantSchema(null)).isFalse();
        assertThat(TenantResolver.isValidTenantSchema("app")).isFalse();
        assertThat(TenantResolver.isValidTenantSchema("public")).isFalse();
        assertThat(TenantResolver.isValidTenantSchema("tenant_123")).isFalse();
        assertThat(TenantResolver.isValidTenantSchema("tenant_invalid_character!_1234567890")).isFalse();

        assertThatThrownBy(() -> TenantResolver.toOrganizationId("tenant_short"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

