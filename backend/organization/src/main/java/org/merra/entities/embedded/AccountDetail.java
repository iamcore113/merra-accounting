package org.merra.entities.embedded;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Embeddable
public class AccountDetail implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@NotNull(message = "accountId attribute cannot be null.")
	private UUID accountId;
	
	@NotBlank(message = "accountCode attribute cannot be blank.")
	private String accountCode;
	
	@NotBlank(message = "accountType attribute cannot be blank.")
	private String accountType;
	
	private String accountName;

	public static long getSerialversionuid() {
		return serialVersionUID;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public String getAccountCode() {
		return accountCode;
	}

	public String getAccountType() {
		return accountType;
	}

	public String getAccountName() {
		return accountName;
	}

	public void setAccountId(UUID accountId) {
		this.accountId = accountId;
	}

	public void setAccountCode(String accountCode) {
		this.accountCode = accountCode;
	}

	public void setAccountType(String accountType) {
		this.accountType = accountType;
	}

	public void setAccountName(String accountName) {
		this.accountName = accountName;
	}

	public AccountDetail(@NotNull(message = "accountId attribute cannot be null.") UUID accountId,
			@NotBlank(message = "accountCode attribute cannot be blank.") String accountCode,
			@NotBlank(message = "accountType attribute cannot be blank.") String accountType, String accountName) {
		this.accountId = accountId;
		this.accountCode = accountCode;
		this.accountType = accountType;
		this.accountName = accountName;
	}

	public AccountDetail() {
	}

	
}
