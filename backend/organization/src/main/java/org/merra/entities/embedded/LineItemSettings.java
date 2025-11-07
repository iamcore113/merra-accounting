package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

@Embeddable
public class LineItemSettings implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Double defaultQuantity;
	private String defaultAccountCode;
	private Integer defaultDiscountRate;

	public Double getDefaultQuantity() {
		return defaultQuantity;
	}
	public String getDefaultAccountCode() {
		return defaultAccountCode;
	}
	public Integer getDefaultDiscountRate() {
		return defaultDiscountRate;
	}
	public void setDefaultQuantity(Double defaultQuantity) {
		this.defaultQuantity = defaultQuantity;
	}
	public void setDefaultAccountCode(String defaultAccountCode) {
		this.defaultAccountCode = defaultAccountCode;
	}
	public void setDefaultDiscountRate(Integer defaultDiscountRate) {
		this.defaultDiscountRate = defaultDiscountRate;
	}
	public LineItemSettings() {
	}
	public LineItemSettings(Double defaultQuantity, String defaultAccountCode, Integer defaultDiscountRate) {
		this.defaultQuantity = defaultQuantity;
		this.defaultAccountCode = defaultAccountCode;
		this.defaultDiscountRate = defaultDiscountRate;
	}

	
}
