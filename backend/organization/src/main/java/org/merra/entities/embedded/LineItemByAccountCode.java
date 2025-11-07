package org.merra.entities.embedded;

import java.util.List;

import org.merra.entities.LineItem;

public class LineItemByAccountCode {
	private String accountCode;
	private int total;
	private List<LineItem> lineItems;
	
	public String getAccountCode() {
		return accountCode;
	}
	public int getTotal() {
		return total;
	}
	public List<LineItem> getLineItems() {
		return lineItems;
	}
	public void setAccountCode(String accountCode) {
		this.accountCode = accountCode;
	}
	public void setTotal(int total) {
		this.total = total;
	}
	public void setLineItems(List<LineItem> lineItems) {
		this.lineItems = lineItems;
	}
	public LineItemByAccountCode() {
	}
	public LineItemByAccountCode(String accountCode, int total, List<LineItem> lineItems) {
		this.accountCode = accountCode;
		this.total = total;
		this.lineItems = lineItems;
	}

	
}
