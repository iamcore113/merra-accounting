package org.merra.dto;

import java.util.List;
import java.util.UUID;

public record UserOrganizationAffiliation(
        Long count,
        List<Organizations> organizations) {
    public record Organizations(
            UUID organizationId,
            String organizationName,
            String role) {
        public Organizations {
            if (organizationId == null) {
                throw new IllegalArgumentException("Organization ID cannot be null");
            }
            if (organizationName == null || organizationName.isBlank()) {
                throw new IllegalArgumentException("Organization name cannot be null or blank");
            }
            if (role == null || role.isBlank()) {
                throw new IllegalArgumentException("Role cannot be null or blank");
            }
        }
    }
}
