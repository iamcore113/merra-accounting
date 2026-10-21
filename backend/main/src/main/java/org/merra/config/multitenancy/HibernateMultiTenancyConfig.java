package org.merra.config.multitenancy;

import org.hibernate.cfg.MultiTenancySettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers multi-tenancy settings with Hibernate using Spring Boot's HibernatePropertiesCustomizer.
 */
@Configuration
public class HibernateMultiTenancyConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernateMultiTenancyCustomizer(
            CurrentTenantIdentifierResolver<String> tenantResolver,
            MultiTenantConnectionProvider<String> connectionProvider) {
        return hibernateProperties -> {
            hibernateProperties.put(MultiTenancySettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantResolver);
            hibernateProperties.put(MultiTenancySettings.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
        };
    }
}

