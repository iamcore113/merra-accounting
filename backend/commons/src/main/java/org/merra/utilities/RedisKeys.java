package org.merra.utilities;

import java.time.Duration;

public class RedisKeys {
    // prevent instantiation
    private RedisKeys() {
    }

    public static final Duration CONSTANT_DURATION = Duration.ofHours(4);
    public static final Duration EPHEMERAL_DURATION = Duration.ofHours(1);

    public static final String PRINCIPAL = "principal"; // Authenticated user
    public static final String PRINCIPAL_ACCOUNT_SETTINGS = "principal_account_settings"; // Authenticated user's
                                                                                          // account settings
    public static final String ACCOUNT_CATEGORIES = "account_categories";
    public static final String ORGANIZATION_TYPES = "organization_types";
    public static final String ORGANIZATION_METADATA = "organization_metadata";
    public static final String COUNTRY_METADATA = "country_metadata";
}
