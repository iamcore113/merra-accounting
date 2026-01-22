package org.merra.dto;

import java.util.Set;
import java.util.UUID;

public record UserOrganizationResponse(
    UserDetails userDetails,
    Set<OrganizationDetails> organizations
) {
    public UserOrganizationResponse {
        if (userDetails == null) {
            throw new IllegalArgumentException("userDetails cannot be null");
        }
        if (organizations == null || organizations.isEmpty()) {
            throw new IllegalArgumentException("organizations cannot be null or empty");
        }
    }
    
    public record UserDetails(
        UUID userId,
        String fullName,
        String email
    ) {
        public UserDetails {
            if (userId == null) {
                throw new IllegalArgumentException("userId cannot be null");
            }
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("email cannot be null or blank");
            }
        }
    }

    public record OrganizationDetails(
        UUID organizationId,
        String organizationName
    ) {
        public OrganizationDetails {
            if (organizationId == null) {
                throw new IllegalArgumentException("organizationId cannot be null");
            }
            if (organizationName == null || organizationName.isBlank()) {
                throw new IllegalArgumentException("organizationName cannot be null or blank");
            }
        }
    }
}
