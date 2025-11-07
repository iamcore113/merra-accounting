package org.merra.embedded;

import java.io.Serializable;

import jakarta.validation.constraints.NotNull;

public class PhoneDetails implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	@NotNull(message = "phoneType attribute cannot be null.")
	private String phoneType;
	
	@NotNull(message = "phoneNumber attribute cannot be null.")
	private String phoneNumber;
	
	private String phoneAreaCode;
	
	private String phoneCountryCode;
	
	private Boolean isDefault;
	
	public PhoneDetails(
			String phoneType,
			String phoneNumber,
			String phoneAreaCode,
			String phoneCountryCode,
			Boolean isDefault
	) {
		this.phoneType = phoneType;
		this.phoneNumber = phoneNumber;
		this.phoneAreaCode = phoneAreaCode;
		this.phoneCountryCode = phoneCountryCode;
		this.isDefault = isDefault;
	}
	
	public void setIsDefault(Boolean isDefault) {
		this.isDefault = isDefault ? Boolean.TRUE : Boolean.FALSE;
	}

	public String getPhoneType() {
		return phoneType;
	}

	public void setPhoneType(String phoneType) {
		this.phoneType = phoneType;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getPhoneAreaCode() {
		return phoneAreaCode;
	}

	public void setPhoneAreaCode(String phoneAreaCode) {
		this.phoneAreaCode = phoneAreaCode;
	}

	public String getPhoneCountryCode() {
		return phoneCountryCode;
	}

	public void setPhoneCountryCode(String phoneCountryCode) {
		this.phoneCountryCode = phoneCountryCode;
	}

	public Boolean getIsDefault() {
		return isDefault;
	}

	
}
