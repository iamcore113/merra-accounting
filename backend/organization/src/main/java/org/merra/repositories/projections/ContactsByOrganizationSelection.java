package org.merra.repositories.projections;

import java.util.UUID;

public interface ContactsByOrganizationSelection {
	String getOrganizationName();
	UUID getId();
	String getName();
	String getAccountNumber();
	String getEmailAddress();
	Boolean getIsSupplier();
	Boolean getIsCustomer();
	String getContactStatus();
}
