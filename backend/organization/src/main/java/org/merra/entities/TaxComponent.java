package org.merra.entities;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "tax_component", schema = "merra_schema")
public class TaxComponent {

	@Id @GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;
	
	@ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
	@JoinColumn(name = "taxt_rate_id", referencedColumnName = "id", nullable = false, unique = true)
	private TaxRate taxRate;
	
	// Name of tax component
	@NotBlank(message = "name attribute cannot be blank.")
	@Column(name = "name", nullable = false)
	private String name;
	
	@NotNull(message = "rate attribute cannot be null.")
	@Column(nullable = false, scale = 4, precision = 7)
	private BigDecimal rate;
	
	@NotNull(message = "isCompound attribute cannot be null.")
	@Column(name = "is_compound")
	private Boolean isCompound;
	
	@Column(name = "non_recoverable")
	private Boolean nonRecoverable;
	
	// Constructor without taxRate
	public TaxComponent(String name, BigDecimal rate, Boolean isCompound, Boolean nonRecoverable) {
		this.name = name;
		this.rate = rate;
		this.isCompound = isCompound;
		this.nonRecoverable = nonRecoverable;
	}

	public TaxComponent() {
	}

	public UUID getId() {
		return id;
	}

	public TaxRate getTaxRate() {
		return taxRate;
	}

	public void setTaxRate(TaxRate taxRate) {
		this.taxRate = taxRate;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public BigDecimal getRate() {
		return rate;
	}

	public void setRate(BigDecimal rate) {
		this.rate = rate;
	}

	public Boolean getIsCompound() {
		return isCompound;
	}

	public void setIsCompound(Boolean isCompound) {
		this.isCompound = isCompound;
	}

	public Boolean getNonRecoverable() {
		return nonRecoverable;
	}

	public void setNonRecoverable(Boolean nonRecoverable) {
		this.nonRecoverable = nonRecoverable;
	}

	
}

