package org.merra.entities.embedded;

import java.io.Serializable;
import java.math.BigDecimal;

import jakarta.persistence.Embeddable;

@Embeddable
public class JournalTotalAmountEntry implements Serializable {/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private BigDecimal totalDebit;
	private BigDecimal totalCredit;
	
	public BigDecimal getTotalDebit() {
		return totalDebit;
	}
	public BigDecimal getTotalCredit() {
		return totalCredit;
	}
	public void setTotalDebit(BigDecimal totalDebit) {
		this.totalDebit = totalDebit;
	}
	public void setTotalCredit(BigDecimal totalCredit) {
		this.totalCredit = totalCredit;
	}
	public JournalTotalAmountEntry() {
	}
	public JournalTotalAmountEntry(BigDecimal totalDebit, BigDecimal totalCredit) {
		this.totalDebit = totalDebit;
		this.totalCredit = totalCredit;
	}

	

}
