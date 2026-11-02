package org.merra.multitenancy;

import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Utility for converting, resolving, and validating tenant database schema names.
 */
public final class TenantResolver {

    public static final String SCHEMA_PREFIX = "tenant_";
    private static final Pattern VALID_TENANT_SCHEMA_PATTERN = Pattern.compile("^tenant_[0-9a-fA-F]{32}$");

    private TenantResolver() {
    }

    /**
     * Converts an Organization UUID into a sanitized, collision-free PostgreSQL schema name.
     * E.g. UUID "39b7dccf-1e77-4731-b296-98e355bf8a0e" -> "tenant_39b7dccf1e774731b29698e355bf8a0e"
     *
     * @param organizationId the UUID of the organization
     * @return the formatted schema name
     */
    public static String toSchemaName(UUID organizationId) {
        Objects.requireNonNull(organizationId, "organizationId cannot be null");
        return SCHEMA_PREFIX + organizationId.toString().replace("-", "").toLowerCase();
    }

    /**
     * Validates whether a schema name matches the required tenant schema pattern.
     *
     * @param schemaName the schema name to test
     * @return {@code true} if valid, {@code false} otherwise
     */
    public static boolean isValidTenantSchema(String schemaName) {
        if (schemaName == null) {
            return false;
        }
        return VALID_TENANT_SCHEMA_PATTERN.matcher(schemaName).matches();
    }

    /**
     * Extracts and reconstructs the Organization UUID from a valid tenant schema name.
     *
     * @param schemaName the schema name formatted as "tenant_<32-hex-chars>"
     * @return the extracted UUID
     * @throws IllegalArgumentException if the schema name is not a valid tenant schema format
     */
    public static UUID toOrganizationId(String schemaName) {
        if (!isValidTenantSchema(schemaName)) {
            throw new IllegalArgumentException("Invalid tenant schema name format: " + schemaName);
        }
        String hex = schemaName.substring(SCHEMA_PREFIX.length());
        String formatted = hex.replaceFirst(
                "([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{12})",
                "$1-$2-$3-$4-$5");
        return UUID.fromString(formatted);
    }
}

