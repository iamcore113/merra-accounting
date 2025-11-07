package org.merra.entities;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.merra.entities.embedded.JournalTotalAmountEntry;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * TODO - TO BE CONTINUED.
 */
@Entity
@Table(name = "journal", schema = "merra_schema")
public class Journal {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "journal_id", nullable = false, unique = true)
	private UUID journalId;

	@Column(name = "journal_date", nullable = false)
	@NotNull(message = "journalDate attribute cannot be null.")
	@DateTimeFormat(iso = ISO.DATE)
	private LocalDate journalDate;

	/**
	 * this is system generated value
	 * only include in GET request.
	 */
	@Column(name = "journal_number", nullable = false, unique = true, updatable = false, columnDefinition = "BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE")
	private BigInteger journalNumber;

	@OneToMany(cascade = CascadeType.ALL, mappedBy = "journal")
	@NotEmpty(message = "journalLines attribute cannot be empty.")
	private List<JournalLine> journalLines;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "total", columnDefinition = "jsonb")
	private JournalTotalAmountEntry total;

	public Journal() {
	}

	public Journal(UUID journalId, @NotNull(message = "journalDate attribute cannot be null.") LocalDate journalDate,
			BigInteger journalNumber,
			@NotEmpty(message = "journalLines attribute cannot be empty.") List<JournalLine> journalLines,
			JournalTotalAmountEntry total) {
		this(journalDate, journalNumber, journalLines, total);
		this.journalId = journalId;
	}

	public Journal(@NotNull(message = "journalDate attribute cannot be null.") LocalDate journalDate,
			BigInteger journalNumber,
			@NotEmpty(message = "journalLines attribute cannot be empty.") List<JournalLine> journalLines,
			JournalTotalAmountEntry total) {
		this.journalDate = journalDate;
		this.journalNumber = journalNumber;
		this.journalLines = journalLines;
		this.total = total;
	}

	public UUID getJournalId() {
		return journalId;
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
		journalLines.forEach(line -> line.setJournal(this));
	}

	public JournalTotalAmountEntry getTotal() {
		return total;
	}

	public void setTotal(JournalTotalAmountEntry total) {
		this.total = total;
	}

}
