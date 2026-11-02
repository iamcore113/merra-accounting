package org.merra.config.multitenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SchemaMultiTenantConnectionProviderTest {

    private DataSource dataSource;
    private Connection connection;
    private Statement statement;
    private SchemaMultiTenantConnectionProvider provider;

    @BeforeEach
    void setUp() throws SQLException {
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);
        statement = mock(Statement.class);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);

        provider = new SchemaMultiTenantConnectionProvider(dataSource);
    }

    @Test
    @DisplayName("getConnection with 'app' sets search_path to 'app', 'public'")
    void getConnection_appTenant() throws SQLException {
        Connection conn = provider.getConnection("app");
        assertThat(conn).isSameAs(connection);
        verify(statement).execute("SET search_path TO \"app\", \"public\"");
    }

    @Test
    @DisplayName("getConnection with valid tenant schema sets search_path to tenant schema followed by fallback")
    void getConnection_validTenant() throws SQLException {
        String tenantSchema = "tenant_11111111222233334444555566667777";
        Connection conn = provider.getConnection(tenantSchema);
        assertThat(conn).isSameAs(connection);
        verify(statement).execute("SET search_path TO \"" + tenantSchema + "\", \"app\", \"public\"");
    }

    @Test
    @DisplayName("getConnection with invalid schema throws IllegalArgumentException")
    void getConnection_invalidTenant() {
        assertThatThrownBy(() -> provider.getConnection("invalid_schema; DROP TABLE users;"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("releaseConnection resets search_path to default 'app', 'public' and closes connection")
    void releaseConnection() throws SQLException {
        provider.releaseConnection("tenant_11111111222233334444555566667777", connection);
        verify(statement).execute("SET search_path TO \"app\", \"public\"");
        verify(connection).close();
    }
}

