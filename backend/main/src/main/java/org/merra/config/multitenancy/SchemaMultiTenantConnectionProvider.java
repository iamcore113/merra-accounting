package org.merra.config.multitenancy;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;

import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.hibernate.service.UnknownUnwrapTypeException;
import org.merra.multitenancy.TenantContext;
import org.merra.multitenancy.TenantResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * MultiTenantConnectionProvider that switches PostgreSQL search_path dynamically
 * based on the active tenant schema, keeping 'app' and 'public' in the search fallback path.
 */
@Component
public class SchemaMultiTenantConnectionProvider implements MultiTenantConnectionProvider<String> {

    private static final Logger logger = LoggerFactory.getLogger(SchemaMultiTenantConnectionProvider.class);
    private final DataSource dataSource;

    public SchemaMultiTenantConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        Connection connection = getAnyConnection();
        try (Statement statement = connection.createStatement()) {
            if (tenantIdentifier == null || TenantContext.DEFAULT_TENANT.equalsIgnoreCase(tenantIdentifier)) {
                statement.execute("SET search_path TO \"app\", \"public\"");
            } else {
                if (!TenantResolver.isValidTenantSchema(tenantIdentifier)) {
                    throw new IllegalArgumentException("Invalid tenant schema: " + tenantIdentifier);
                }
                statement.execute("SET search_path TO \"" + tenantIdentifier + "\", \"app\", \"public\"");
            }
        } catch (SQLException e) {
            logger.error("Error setting search_path for tenant '{}': {}", tenantIdentifier, e.getMessage());
            releaseAnyConnection(connection);
            throw e;
        }
        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        try {
            if (connection != null && !connection.isClosed()) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("SET search_path TO \"app\", \"public\"");
                }
            }
        } catch (SQLException e) {
            logger.warn("Error resetting search_path to default on connection release: {}", e.getMessage());
        } finally {
            releaseAnyConnection(connection);
        }
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return MultiTenantConnectionProvider.class.isAssignableFrom(unwrapType)
                || DataSource.class.isAssignableFrom(unwrapType);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <X> X unwrap(Class<X> unwrapType) {
        if (MultiTenantConnectionProvider.class.isAssignableFrom(unwrapType)) {
            return (X) this;
        } else if (DataSource.class.isAssignableFrom(unwrapType)) {
            return (X) this.dataSource;
        }
        throw new UnknownUnwrapTypeException(unwrapType);
    }
}

