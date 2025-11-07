package org.merra.entities;

import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.merra.entities.embedded.InvoiceSettings;
import org.merra.entities.embedded.LineItemSettings;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * This is a configuration settings for organization object.
 * Setting default functionalities or values happen here.
 */
@Entity
@Table(name = "organization_setting", schema = "merra_schema")
public class OrganizationSettings {

	@Id @GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "setting_id", nullable = false, unique = true)
	private UUID settingId;
	
	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "organization_id", unique = true, referencedColumnName = "id")
	private Organization organization;
	
	// Default settings for invoices
	@Embedded
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "invoice_settings")
	private InvoiceSettings invoiceSettings;
	
	// Default settings for line items
	@Embedded
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "line_item_settings")
	private LineItemSettings lineItemSettings;

	public OrganizationSettings() {
	}

	public OrganizationSettings(UUID settingId, Organization organization, InvoiceSettings invoiceSettings,
			LineItemSettings lineItemSettings) {
		this(organization, invoiceSettings, lineItemSettings);
		this.settingId = settingId;
	}

	public OrganizationSettings(Organization organization, InvoiceSettings invoiceSettings,
			LineItemSettings lineItemSettings) {
		this.organization = organization;
		this.invoiceSettings = invoiceSettings;
		this.lineItemSettings = lineItemSettings;
	}

	public UUID getSettingId() {
		return settingId;
	}


	public Organization getOrganization() {
		return organization;
	}

	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	public InvoiceSettings getInvoiceSettings() {
		return invoiceSettings;
	}

	public void setInvoiceSettings(InvoiceSettings invoiceSettings) {
		this.invoiceSettings = invoiceSettings;
	}

	public LineItemSettings getLineItemSettings() {
		return lineItemSettings;
	}

	public void setLineItemSettings(LineItemSettings lineItemSettings) {
		this.lineItemSettings = lineItemSettings;
	}

	
}

