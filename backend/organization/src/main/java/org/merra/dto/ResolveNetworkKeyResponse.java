package org.merra.dto;

import java.util.UUID;

public record ResolveNetworkKeyResponse(
        boolean isValid,
        UUID organizationId,
        String organizationName,
        String legalName,
        String country,
        String currency,
        String message
) {}
