package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TaxTypesEmb implements Serializable {
	/**
	* 
	*/
	private static final long serialVersionUID = 1L;

	@NotBlank(message = "type atrribute cannot be blank.")
	private String type;

	@NotNull(message = "rate attribute cannot be null.")
	@Digits(integer = 4, fraction = 2)
	private Double rate;

	@NotNull(message = "name attribute cannot be null.")
	private String name;

	@NotNull(message = "systemDefined attribute cannot be null.")
	private Boolean systemDefined;

	public TaxTypesEmb() {
	}

	public TaxTypesEmb(@NotBlank(message = "type atrribute cannot be blank.") String type,
			@NotNull(message = "rate attribute cannot be null.") @Digits(integer = 4, fraction = 2) Double rate,
			@NotNull(message = "name attribute cannot be null.") String name, Boolean systemDefined) {
		this.type = type;
		this.rate = rate;
		this.name = name;
		this.systemDefined = systemDefined == null ? Boolean.FALSE : systemDefined;
	}

	public String getType() {
		return type;
	}

	public Double getRate() {
		return rate;
	}

	public String getName() {
		return name;
	}

	public Boolean getSystemDefined() {
		return systemDefined;
	}

	public void setType(String type) {
		this.type = type;
	}

	public void setRate(Double rate) {
		this.rate = rate;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void setSystemDefined(Boolean systemDefined) {
		this.systemDefined = systemDefined;
	}

}