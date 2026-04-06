package org.merra.repositories.projections;

import java.util.UUID;

public interface OrganizationsOnly {
	OrganizationSummary getOrganization();
	
	interface OrganizationSummary {
		UUID getId();
		String getDisplayName();
	}
}
