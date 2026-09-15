package org.merra.repositories.projections;

import java.util.UUID;

public interface ContactsByOrganizationSelection {
	String getOrganizationName();
	UUID getId();
	String getName();
	String getAccountNumber();
	Boolean getIsSupplier();
	Boolean getIsCustomer();
}
