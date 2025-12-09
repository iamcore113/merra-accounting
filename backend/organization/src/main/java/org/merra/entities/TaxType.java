package org.merra.entities;

import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.merra.entities.embedded.TaxTypesEmb;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

/**
 * OUTPUT: This is typically used for sales tax (Accounts Receivable).
 * It means the tax is added to the item's price when you sell something.
 * INPUT: This is typically used for purchase tax (Accounts Payable).
 * It means the tax is part of the cost when you buy something.
 * NONE: No tax applies to this line item.
 * BASEEXCLUDED: This is often used for items that are tax-exempt or where the
 * tax is handled outside of Xero's standard calculation.
 */
@Entity
@Table(name = "tax_type", schema = "merra_schema")
public class TaxType {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// Usually will hold a country name
	@Column(name = "label", nullable = false, unique = true)
	@NotNull(message = "label cannot be null.")
	private String label;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "type_collections", columnDefinition = "jsonb", nullable = false)
	@NotNull(message = "typeCollections attribute cannot be null.")
	private Set<TaxTypesEmb> typeCollections;

	public TaxType() {
	}

	public TaxType(String label, Set<TaxTypesEmb> typeCollections) {
		this.label = label;
		this.typeCollections = typeCollections;
	}

	public UUID getId() {
		return id;
	}

	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public Set<TaxTypesEmb> getTypeCollections() {
		return typeCollections;
	}

	public void setTypeCollections(Set<TaxTypesEmb> typeCollections) {
		this.typeCollections = typeCollections;
	}

}