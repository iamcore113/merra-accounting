package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

@Embeddable
public class InvoiceSettingsEmb implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String defaultLineAmountType;
	private String status;

	public void setStatus(String stat) {
		// DRAFT is the default status
		this.status = stat.isBlank() ? "DRAFT" : stat;
	}

	public String getDefaultLineAmountType() {
		return defaultLineAmountType;
	}

	public String getStatus() {
		return status;
	}

	public void setDefaultLineAmountType(String defaultLineAmountType) {
		this.defaultLineAmountType = defaultLineAmountType;
	}

	public InvoiceSettingsEmb() {
	}

	public InvoiceSettingsEmb(String defaultLineAmountType, String status) {
		this.defaultLineAmountType = defaultLineAmountType;
		this.status = status;
	}

}
