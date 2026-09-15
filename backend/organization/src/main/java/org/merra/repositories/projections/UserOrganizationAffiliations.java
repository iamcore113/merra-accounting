package org.merra.repositories.projections;

import java.util.UUID;

public interface UserOrganizationAffiliations {
    OrganizationSummary getOrganization();

    String getRole();

    interface OrganizationSummary {
        UUID getId();

        String getDisplayName();
    }
}
