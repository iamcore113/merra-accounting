package org.merra.entities.embedded;

import java.io.Serializable;

/**
 * Embeddable class representing invoice action permissions.
 * Indicates whether an invoice can be edited or deleted.
 */
public class InvoiceActionsEmb implements Serializable {

	/**
	 * Whether the invoice can be edited.
	 */
	private boolean edit;

	/**
	 * Whether the invoice can be deleted.
	 */
	private boolean delete;

	/**
	 * Returns true if the invoice can be edited.
	 */
	public boolean isEdit() {
		return edit;
	}

	/**
	 * Returns true if the invoice can be deleted.
	 */
	public boolean isDelete() {
		return delete;
	}

	/**
	 * Sets whether the invoice can be edited.
	 */
	public void setEdit(boolean edit) {
		this.edit = edit;
	}

	/**
	 * Sets whether the invoice can be deleted.
	 */
	public void setDelete(boolean delete) {
		this.delete = delete;
	}

	/**
	 * Default constructor.
	 */
	public InvoiceActionsEmb() {
	}

	/**
	 * Constructor with edit and delete permissions.
	 * 
	 * @param edit   whether the invoice can be edited
	 * @param delete whether the invoice can be deleted
	 */
	public InvoiceActionsEmb(boolean edit, boolean delete) {
		this.edit = edit;
		this.delete = delete;
	}

}
