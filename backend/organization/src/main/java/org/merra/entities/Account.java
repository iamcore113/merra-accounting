package org.merra.entities;

import java.time.LocalDate;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.SQLRestriction;
import org.merra.utilities.AccountConstants;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@SQLRestriction("archived <> true")
@Table(name = "ledger_account", schema = "merra_schema")
public class Account {
	@Id @GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "account_id", nullable = false, unique = true)
	private UUID accountId;
	
	@OneToOne
	@JoinColumn(name = "organization", nullable = false, referencedColumnName = "id")
	private Organization organization;
	
	@Column(nullable = false)
	@NotBlank(message = "code attribute cannot be blank.")
	private String code;
	
	@Column(name = "account_name", nullable = false)
	@NotBlank(message = "accountName attribute cannote be blank.")
	private String accountName;
	
	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "category_id", referencedColumnName = "id")
	@NotNull(message = "category attribute cannot be null.")
	private AccountCategory category;
	
	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "account_type", referencedColumnName = "id")
	@NotNull(message = "accountType attribute cannot be null.")
	private AccountType accountType;
	
	private String status;
	
	@NotBlank(message = "description attribute cannot be blank.")
	private String description;
	
	@Column(name = "tax_type")
	private String taxType;
	
	@Column(name = "enable_payments_account")
	private boolean enablePaymentToAccount;
	
	@Column(name = "updated_date")
	private LocalDate updatedDate;
	
	@Column(name = "add_to_watch_list")
	private boolean addToWatchList;
	
	private boolean archived = false;
	
	public void setStatus(String stat) {
		if (!Set.of(AccountConstants.ACCOUNT_STATUS_ACTIVE, AccountConstants.ACCOUNT_STATUS_ARCHIVED).contains(stat.toUpperCase())) {
			throw new NoSuchElementException("Invalid status.");
		}
		this.status = stat;
	}
	
	// Constructor for creating new account object
	// The following are the required only attributes for creating object.
	public Account(
			@NotNull Organization org,
			@NotNull String code,
			@NotNull String accountName,
			@NotNull AccountType type,
			@NotNull AccountCategory category
	) {
		this.organization = org;
		this.code = code;
		this.accountName = accountName;
		this.accountType = type;
		this.category = category;
	}
	
	// Check the type of entry: debit or credit
	public static String checkEntryType(String accountCategory) {
		Set<String> debits = Set.of(
				AccountConstants.ACC__CLASS_TYPE_ASSET,
				AccountConstants.ACC__CLASS_TYPE_EXPENSE
		);
		
		Set<String> credit = Set.of(
				AccountConstants.ACC__CLASS_TYPE_LIABILITY,
				AccountConstants.ACC__CLASS_TYPE_EQUITY,
				AccountConstants.ACC__CLASS_TYPE_REVENUE
		);
		if (debits.contains(accountCategory)) {
			return AccountConstants.ACC_ENTRY_DEBIT;
		} else if (credit.contains(accountCategory)) {
			return AccountConstants.ACC_ENTRY_CREDIT;
		}
		return null;
	}

	public Account() {
	}

	public Account(UUID accountId, Organization organization,
			@NotBlank(message = "code attribute cannot be blank.") String code,
			@NotBlank(message = "accountName attribute cannote be blank.") String accountName,
			@NotNull(message = "category attribute cannot be null.") AccountCategory category,
			@NotNull(message = "accountType attribute cannot be null.") AccountType accountType, String status,
			@NotBlank(message = "description attribute cannot be blank.") String description, String taxType,
			boolean enablePaymentToAccount, LocalDate updatedDate, boolean addToWatchList, boolean archived) {
		this.accountId = accountId;
		this.organization = organization;
		this.code = code;
		this.accountName = accountName;
		this.category = category;
		this.accountType = accountType;
		this.status = status;
		this.description = description;
		this.taxType = taxType;
		this.enablePaymentToAccount = enablePaymentToAccount;
		this.updatedDate = updatedDate;
		this.addToWatchList = addToWatchList;
		this.archived = archived;
	}

	public Account(Organization organization, @NotBlank(message = "code attribute cannot be blank.") String code,
			@NotBlank(message = "accountName attribute cannote be blank.") String accountName,
			@NotNull(message = "category attribute cannot be null.") AccountCategory category,
			@NotNull(message = "accountType attribute cannot be null.") AccountType accountType, String status,
			@NotBlank(message = "description attribute cannot be blank.") String description, String taxType,
			boolean enablePaymentToAccount, LocalDate updatedDate, boolean addToWatchList, boolean archived) {
		this.organization = organization;
		this.code = code;
		this.accountName = accountName;
		this.category = category;
		this.accountType = accountType;
		this.status = status;
		this.description = description;
		this.taxType = taxType;
		this.enablePaymentToAccount = enablePaymentToAccount;
		this.updatedDate = updatedDate;
		this.addToWatchList = addToWatchList;
		this.archived = archived;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public Organization getOrganization() {
		return organization;
	}

	public String getCode() {
		return code;
	}

	public String getAccountName() {
		return accountName;
	}

	public AccountCategory getCategory() {
		return category;
	}

	public AccountType getAccountType() {
		return accountType;
	}

	public String getStatus() {
		return status;
	}

	public String getDescription() {
		return description;
	}

	public String getTaxType() {
		return taxType;
	}

	public boolean isEnablePaymentToAccount() {
		return enablePaymentToAccount;
	}

	public LocalDate getUpdatedDate() {
		return updatedDate;
	}

	public boolean isAddToWatchList() {
		return addToWatchList;
	}

	public boolean isArchived() {
		return archived;
	}

	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public void setAccountName(String accountName) {
		this.accountName = accountName;
	}

	public void setCategory(AccountCategory category) {
		this.category = category;
	}

	public void setAccountType(AccountType accountType) {
		this.accountType = accountType;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public void setTaxType(String taxType) {
		this.taxType = taxType;
	}

	public void setEnablePaymentToAccount(boolean enablePaymentToAccount) {
		this.enablePaymentToAccount = enablePaymentToAccount;
	}

	public void setUpdatedDate(LocalDate updatedDate) {
		this.updatedDate = updatedDate;
	}

	public void setAddToWatchList(boolean addToWatchList) {
		this.addToWatchList = addToWatchList;
	}

	public void setArchived(boolean archived) {
		this.archived = archived;
	}

	
	
}

