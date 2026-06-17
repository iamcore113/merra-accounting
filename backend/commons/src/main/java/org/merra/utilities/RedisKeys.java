package org.merra.utilities;

public class RedisKeys {
    // prevent instantiation
    private RedisKeys() {
    }

    public static final String AUTHENTICATED_USER_KEY = "principal";
    public static final String ORGANIZATION_TYPES = "organization_types";
}
