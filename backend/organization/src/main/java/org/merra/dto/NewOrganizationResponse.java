package org.merra.dto;

import java.util.UUID;

public record NewOrganizationResponse(
    UUID organizationId,
    UserDetails userDetails
) {
    public NewOrganizationResponse {
        if (organizationId == null) {
            throw new IllegalArgumentException("organizationId cannot be null");
        }
    }

    public record UserDetails(UUID userId, boolean userInfoPresent, String name) {
        public UserDetails {
            if (userId == null) {
                throw new IllegalArgumentException("userId cannot be null");
            }
        }
    }
}
