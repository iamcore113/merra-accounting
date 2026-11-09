package org.merra.entities;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.generator.EventType;
import org.hibernate.type.SqlTypes;
import org.merra.entities.embedded.JournalTotalAmountEntryEmb;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "journal")
public class Journal {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "journal_id", nullable = false, unique = true)
	private UUID journalId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "organization", referencedColumnName = "id")
	private Organization organization;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "invoice_id", referencedColumnName = "invoice_id")
	private Invoice invoice;

	@Column(name = "narration")
	private String narration;

	@Column(name = "journal_date", nullable = false)
	@NotNull(message = "journalDate attribute cannot be null.")
	@DateTimeFormat(iso = ISO.DATE)
	private LocalDate journalDate;

	/**
	 * this is system generated value
	 * only include in GET request.
	 */
	@Generated(event = EventType.INSERT)
	@Column(name = "journal_number", nullable = false, unique = true, insertable = false, updatable = false, columnDefinition = "BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE")
	private BigInteger journalNumber;

	@OneToMany(cascade = CascadeType.ALL, mappedBy = "journal", orphanRemoval = true)
	@NotEmpty(message = "journalLines attribute cannot be empty.")
	private List<JournalLine> journalLines;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "total", columnDefinition = "jsonb")
	private JournalTotalAmountEntryEmb total;

	public Journal() {
	}

	public Journal(UUID journalId, @NotNull(message = "journalDate attribute cannot be null.") LocalDate journalDate,
			BigInteger journalNumber,
			@NotEmpty(message = "journalLines attribute cannot be empty.") List<JournalLine> journalLines,
			JournalTotalAmountEntryEmb total) {
		this(journalDate, journalNumber, journalLines, total);
		this.journalId = journalId;
	}

	public Journal(@NotNull(message = "journalDate attribute cannot be null.") LocalDate journalDate,
			BigInteger journalNumber,
			@NotEmpty(message = "journalLines attribute cannot be empty.") List<JournalLine> journalLines,
			JournalTotalAmountEntryEmb total) {
		this.journalDate = journalDate;
		this.journalNumber = journalNumber;
		this.journalLines = journalLines;
		this.total = total;
	}

	public UUID getJournalId() {
		return journalId;
	}

	public void setJournalId(UUID journalId) {
		this.journalId = journalId;
	}

	public Organization getOrganization() {
		return organization;
	}

	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	public Invoice getInvoice() {
		return invoice;
	}

	public void setInvoice(Invoice invoice) {
		this.invoice = invoice;
	}

	public String getNarration() {
		return narration;
	}

	public void setNarration(String narration) {
		this.narration = narration;
	}

	public LocalDate getJournalDate() {
		return journalDate;
	}

	public void setJournalDate(LocalDate journalDate) {
		this.journalDate = journalDate;
	}

	public BigInteger getJournalNumber() {
		return journalNumber;
	}

	public void setJournalNumber(BigInteger journalNumber) {
		this.journalNumber = journalNumber;
	}

	public List<JournalLine> getJournalLines() {
		return journalLines;
	}

	public void setJournalLines(List<JournalLine> journalLines) {
		this.journalLines = journalLines;
		if (journalLines != null) {
			journalLines.forEach(line -> line.setJournal(this));
		}
	}

	public JournalTotalAmountEntryEmb getTotal() {
		return total;
	}

	public void setTotal(JournalTotalAmountEntryEmb total) {
		this.total = total;
	}

}
