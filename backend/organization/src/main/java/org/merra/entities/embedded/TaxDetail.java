package org.merra.entities.embedded;

import java.io.Serializable;
import java.math.BigDecimal;

import jakarta.persistence.Embeddable;

@Embeddable
public class TaxDetail implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private BigDecimal taxAmount;
	private String taxType;
	private String taxName;
	public TaxDetail() {
	}
	public TaxDetail(BigDecimal taxAmount, String taxType, String taxName) {
		this.taxAmount = taxAmount;
		this.taxType = taxType;
		this.taxName = taxName;
	}
	public BigDecimal getTaxAmount() {
		return taxAmount;
	}
	public String getTaxType() {
		return taxType;
	}
	public String getTaxName() {
		return taxName;
	}
	public void setTaxAmount(BigDecimal taxAmount) {
		this.taxAmount = taxAmount;
	}
	public void setTaxType(String taxType) {
		this.taxType = taxType;
	}
	public void setTaxName(String taxName) {
		this.taxName = taxName;
	}

	
}
