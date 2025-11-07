package org.merra.entities;

import java.math.BigDecimal;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.merra.entities.embedded.AccountDetail;
import org.merra.entities.embedded.TaxDetail;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "journal_line", schema = "merra_schema")
public class JournalLine {
	@Id @GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;
	
	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "journal", nullable = false, referencedColumnName = "journal_id")
	private Journal journal;
	
	@Embedded
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "account_details", nullable = false, columnDefinition = "jsonb")
	@NotNull(message = "accountDetails attribute cannot be null.")
	private AccountDetail accountDetails;
	
	private String description;
	
	@Column(columnDefinition = "numeric(7,2)")
	private BigDecimal credit;
	
	@Column(columnDefinition = "numeric(7,2)")
	private BigDecimal debit;

	public JournalLine() {
	}

	public JournalLine(UUID id, Journal journal,
			@NotNull(message = "accountDetails attribute cannot be null.") AccountDetail accountDetails,
			String description, BigDecimal credit, BigDecimal debit) {
		this(journal, accountDetails, description, credit, debit);
		this.id = id;
	}

	public JournalLine(Journal journal,
			@NotNull(message = "accountDetails attribute cannot be null.") AccountDetail accountDetails,
			String description, BigDecimal credit, BigDecimal debit) {
		this.journal = journal;
		this.accountDetails = accountDetails;
		this.description = description;
		this.credit = credit;
		this.debit = debit;
	}

	public UUID getId() {
		return id;
	}

	public Journal getJournal() {
		return journal;
	}

	public void setJournal(Journal journal) {
		this.journal = journal;
	}

	public AccountDetail getAccountDetails() {
		return accountDetails;
	}

	public void setAccountDetails(AccountDetail accountDetails) {
		this.accountDetails = accountDetails;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public BigDecimal getCredit() {
		return credit;
	}

	public void setCredit(BigDecimal credit) {
		this.credit = credit;
	}

	public BigDecimal getDebit() {
		return debit;
	}

	public void setDebit(BigDecimal debit) {
		this.debit = debit;
	}
}
