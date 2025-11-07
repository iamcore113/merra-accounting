package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

@Embeddable
public class InvoiceActions implements Serializable {
	private boolean edit;
	private boolean delete;
	public boolean isEdit() {
		return edit;
	}
	public boolean isDelete() {
		return delete;
	}
	public void setEdit(boolean edit) {
		this.edit = edit;
	}
	public void setDelete(boolean delete) {
		this.delete = delete;
	}
	public InvoiceActions() {
	}
	public InvoiceActions(boolean edit, boolean delete) {
		this.edit = edit;
		this.delete = delete;
	}

	
}
