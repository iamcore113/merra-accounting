package org.merra.repositories.projections;

public interface AccountLookup {
	String getCode();
	String getAccountCode();
	AccountType getAccountType();
	String getTaxType();
	
	interface AccountType {
		String getName();
	}
}
