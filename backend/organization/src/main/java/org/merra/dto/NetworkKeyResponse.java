package org.merra.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NetworkKeyResponse(
        UUID id,
        UUID organizationId,
        String networkKey,
        String name,
        Boolean isActive,
        LocalDateTime createdAt
) {}
