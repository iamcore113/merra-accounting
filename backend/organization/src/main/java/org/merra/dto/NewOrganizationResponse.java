package org.merra.dto;

import java.util.UUID;

public record NewOrganizationResponse(
    UUID organizationId
) {
    public NewOrganizationResponse {
        if (organizationId == null) {
            throw new IllegalArgumentException("organizationId cannot be null");
        }
    }
}
