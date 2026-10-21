package org.merra.config.multitenancy;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.UUID;
import javax.sql.DataSource;

import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.merra.entities.Organization;
import org.merra.enums.StatusEn;
import org.merra.multitenancy.TenantProvisioner;
import org.merra.multitenancy.TenantResolver;
import org.merra.repositories.OrganizationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Executes Liquibase migrations dynamically for individual tenant schemas
 * upon tenant registration and on application startup.
 */
@Component
public class TenantLiquibaseRunner implements TenantProvisioner {

    private static final Logger logger = LoggerFactory.getLogger(TenantLiquibaseRunner.class);
    private static final String TENANT_CHANGELOG = "db/changelog/db.changelog-tenant.xml";

    private final DataSource dataSource;
    private final OrganizationRepository organizationRepository;

    public TenantLiquibaseRunner(DataSource dataSource, OrganizationRepository organizationRepository) {
        this.dataSource = dataSource;
        this.organizationRepository = organizationRepository;
    }

    @Override
    public void provisionTenant(UUID organizationId) {
        String schemaName = TenantResolver.toSchemaName(organizationId);
        provisionTenantSchema(schemaName);
    }

    /**
     * Creates the tenant schema if it does not exist and runs Liquibase tenant migrations.
     *
     * @param schemaName the validated tenant schema name (e.g. tenant_<hex>)
     */
    public void provisionTenantSchema(String schemaName) {
        if (!TenantResolver.isValidTenantSchema(schemaName)) {
            throw new IllegalArgumentException("Invalid tenant schema: " + schemaName);
        }

        try (Connection connection = dataSource.getConnection()) {
            // 1. Create schema
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE SCHEMA IF NOT EXISTS \"" + schemaName + "\"");
            }

            // 2. Run Liquibase against the tenant schema
            Database database = DatabaseFactory.getInstance()
                    .findCorrectDatabaseImplementation(new JdbcConnection(connection));
            database.setDefaultSchemaName(schemaName);
            database.setLiquibaseSchemaName(schemaName);

            try (Liquibase liquibase = new Liquibase(TENANT_CHANGELOG, new ClassLoaderResourceAccessor(), database)) {
                liquibase.update("");
                logger.info("Successfully applied tenant migrations for schema '{}'", schemaName);
            }
        } catch (SQLException | LiquibaseException e) {
            logger.error("Failed to provision/migrate tenant schema '{}': {}", schemaName, e.getMessage(), e);
            throw new RuntimeException("Could not provision tenant schema: " + schemaName, e);
        }
    }

    /**
     * Automatically migrates all existing tenant schemas on application startup once the app is ready.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void upgradeAllTenants() {
        logger.info("Checking for tenant schemas to upgrade on application startup...");
        try {
            List<Organization> organizations = organizationRepository.findAll();
            for (Organization orgEntity : organizations) {
                if (orgEntity.getId() != null && orgEntity.getStatus() == StatusEn.ACTIVE_ACCOUNT) {
                    String schemaName = (orgEntity.getSchemaName() != null && !orgEntity.getSchemaName().trim().isEmpty())
                            ? orgEntity.getSchemaName().trim()
                            : TenantResolver.toSchemaName(orgEntity.getId());
                    try {
                        provisionTenantSchema(schemaName);
                    } catch (Exception e) {
                        logger.error("Error migrating tenant schema for organization {}: {}", orgEntity.getId(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to query organizations for tenant upgrades: {}", e.getMessage(), e);
        }
    }
}

