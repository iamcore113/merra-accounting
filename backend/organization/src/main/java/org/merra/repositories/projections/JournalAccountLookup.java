package org.merra.repositories.projections;

import java.util.UUID;

public interface JournalAccountLookup {
	UUID getAccountId();
	String getCode();
	String getAccountCode();
	AccountType getAccountType();
	String getAccountName();
	String getDescription();
	
	interface AccountType {
		String getName();
	}
}
