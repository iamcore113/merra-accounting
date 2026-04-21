package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

/**
 * Embeddable class representing invoice settings.
 * Stores default line amount type and status for an invoice.
 */
@Embeddable
public class InvoiceSettingsEmb implements Serializable {

	/**
	 * Serialization identifier.
	 */
	private static final long serialVersionUID = 1L;

	/**
	 * The default line amount type for the invoice.
	 */
	private String defaultLineAmountType;

	/**
	 * The status of the invoice (e.g., DRAFT).
	 */
	private String status;

	/**
	 * Whether the invoice should be sent to the contact recipient after status set
	 * to APPROVED.
	 */
	private boolean sendToContactRecipient = false;

	public boolean isSendToContactRecipient() {
		return sendToContactRecipient;
	}

	public void setSendToContactRecipient(boolean sendToContactRecipient) {
		this.sendToContactRecipient = sendToContactRecipient;
	}

	/**
	 * Sets the status of the invoice. If blank, defaults to "DRAFT".
	 * 
	 * @param stat the status to set
	 */
	public void setStatus(String stat) {
		// DRAFT is the default status
		this.status = stat.isBlank() ? "DRAFT" : stat;
	}

	/**
	 * Gets the default line amount type.
	 * 
	 * @return the default line amount type
	 */
	public String getDefaultLineAmountType() {
		return defaultLineAmountType;
	}

	/**
	 * Gets the status of the invoice.
	 * 
	 * @return the status
	 */
	public String getStatus() {
		return status;
	}

	/**
	 * Sets the default line amount type.
	 * 
	 * @param defaultLineAmountType the type to set
	 */
	public void setDefaultLineAmountType(String defaultLineAmountType) {
		this.defaultLineAmountType = defaultLineAmountType;
	}

	/**
	 * Default constructor.
	 */
	public InvoiceSettingsEmb() {
	}

	/**
	 * Constructor with default line amount type and status.
	 * 
	 * @param defaultLineAmountType  the default line amount type
	 * @param status                 the status
	 * @param sendToContactRecipient whether the invoice should be sent to the
	 *                               contact recipient
	 */
	public InvoiceSettingsEmb(String defaultLineAmountType, String status) {
		this.defaultLineAmountType = defaultLineAmountType;
		this.status = status;
	}

}
