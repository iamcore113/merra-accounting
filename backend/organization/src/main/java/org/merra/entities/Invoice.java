package org.merra.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.merra.entities.embedded.InvoiceActionsEmb;
import org.merra.repositories.InvoiceRepository;
import org.merra.utilities.InvoiceConstants;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

@Entity
@Table(name = "invoice", schema = "merra_schema")
public class Invoice {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "invoice_id", nullable = false, unique = true)
	private UUID invoiceId;

	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "organization", nullable = false)
	@NotNull(message = "organization attribute cannot be null.")
	private Organization organization;

	@Column(name = "invoice_type", nullable = false)
	@NotNull(message = "Invoice type cannot be null")
	private String type;

	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "contact", referencedColumnName = "contact_id", nullable = false)
	@NotNull(message = "contact attribute cannot be null.")
	private Contact contact;

	@OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, mappedBy = "invoice")
	private Set<LineItem> lineItems;

	@Column(name = "line_amount_type")
	private String lineAmountTypes;

	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	@PastOrPresent(message = "Invalid value for date field.")
	@Column(name = "invoice_date")
	private LocalDate date;

	@Column(name = "due_date", nullable = false)
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	@FutureOrPresent(message = "Due date must be today or in the future")
	@NotNull(message = "Due date cannot be null")
	private LocalDate dueDate;

	@NotBlank(message = "Status cannot be blank")
	@Column(name = "invoice_status", nullable = false)
	private String status = "DRAFT";

	@Column(name = "reference")
	@NotBlank(message = "Reference cannot be blank")
	private String reference;

	@Column(name = "sub_total", nullable = false)
	@NotNull(message = "subTotal cannot be null.")
	private Double subTotal;

	@Column(name = "grand_total", nullable = false)
	@NotNull(message = "grandTotal cannot be null.")
	private BigDecimal grandTotal;

	@Column(name = "total_tax")
	private BigDecimal totalTax; // value-added tax

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "actions", nullable = false, columnDefinition = "jsonb")
	@NotNull(message = "actions attribute cannot be null.")
	private InvoiceActionsEmb actions;

	public void setLineAmountTypes(String lineAmountTypes) {
		if (lineAmountTypes.isEmpty() || lineAmountTypes.isBlank()) {
			this.lineAmountTypes = null;
		} else if (!Set.of("EXCLUSIVE", "INCLUSIVE", "NO_TAX").contains(lineAmountTypes)) {
			throw new NoSuchElementException("Invalid line amount type.");
		} else {
			this.lineAmountTypes = lineAmountTypes;
		}
	}

	public void setType(String type) {
		if (!Set.of(InvoiceConstants.INVOICE_TYPE_CUSTOMER_INVOICE, InvoiceConstants.INVOICE_TYPE_SUPPLIER_INVOICE)
				.contains(type.toLowerCase())) {
			throw new NoSuchElementException("Invalid invoice type value.");
		} else {
			this.type = type.toUpperCase();
		}
	}

	public Invoice() {
	}

	public Invoice(@NotNull(message = "organization attribute cannot be null.") Organization organization,
			@NotNull(message = "Invoice type cannot be null") String type,
			@NotNull(message = "contact attribute cannot be null.") Contact contact, Set<LineItem> lineItems,
			String lineAmountTypes, @PastOrPresent(message = "Invalid value for date field.") LocalDate date,
			@FutureOrPresent(message = "Due date must be today or in the future") @NotNull(message = "Due date cannot be null") LocalDate dueDate,
			@NotBlank(message = "Status cannot be blank") String status,
			@NotBlank(message = "Reference cannot be blank") String reference,
			@NotNull(message = "subTotal cannot be null.") Double subTotal,
			@NotNull(message = "grandTotal cannot be null.") BigDecimal grandTotal, BigDecimal totalTax,
			@NotNull(message = "actions attribute cannot be null.") InvoiceActionsEmb actions) {
		this.organization = organization;
		this.type = type;
		this.contact = contact;
		this.lineItems = lineItems;
		this.lineAmountTypes = lineAmountTypes;
		this.date = date;
		this.dueDate = dueDate;
		this.status = status;
		this.reference = reference;
		this.subTotal = subTotal;
		this.grandTotal = grandTotal;
		this.totalTax = totalTax;
		this.actions = actions;
	}

	public Invoice(UUID invoiceId,
			@NotNull(message = "organization attribute cannot be null.") Organization organization,
			@NotNull(message = "Invoice type cannot be null") String type,
			@NotNull(message = "contact attribute cannot be null.") Contact contact, Set<LineItem> lineItems,
			String lineAmountTypes, @PastOrPresent(message = "Invalid value for date field.") LocalDate date,
			@FutureOrPresent(message = "Due date must be today or in the future") @NotNull(message = "Due date cannot be null") LocalDate dueDate,
			@NotBlank(message = "Status cannot be blank") String status,
			@NotBlank(message = "Reference cannot be blank") String reference,
			@NotNull(message = "subTotal cannot be null.") Double subTotal,
			@NotNull(message = "grandTotal cannot be null.") BigDecimal grandTotal, BigDecimal totalTax,
			@NotNull(message = "actions attribute cannot be null.") InvoiceActionsEmb actions) {

		this(organization, type, contact, lineItems, lineAmountTypes, date, dueDate, status, reference, subTotal,
				grandTotal, totalTax, actions);
		this.invoiceId = invoiceId;
	}

	public UUID getInvoiceId() {
		return invoiceId;
	}

	public Organization getOrganization() {
		return organization;
	}

	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	public String getType() {
		return type;
	}

	public Contact getContact() {
		return contact;
	}

	public void setContact(Contact contact) {
		this.contact = contact;
	}

	public Set<LineItem> getLineItems() {
		return lineItems;
	}

	public void setLineItems(Set<LineItem> lineItems) {
		this.lineItems = lineItems;
		lineItems.forEach(lt -> lt.setInvoice(this));
	}

	public String getLineAmountTypes() {
		return lineAmountTypes;
	}

	public LocalDate getDate() {
		return date;
	}

	public void setDate(LocalDate date) {
		this.date = date;
	}

	public LocalDate getDueDate() {
		return dueDate;
	}

	public void setDueDate(LocalDate dueDate) {
		this.dueDate = dueDate;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getReference() {
		return reference;
	}

	public void setReference(String reference) {
		this.reference = reference;
	}

	public Double getSubTotal() {
		return subTotal;
	}

	public void setSubTotal(Double subTotal) {
		this.subTotal = subTotal;
	}

	public BigDecimal getGrandTotal() {
		return grandTotal;
	}

	public void setGrandTotal(BigDecimal grandTotal) {
		this.grandTotal = grandTotal;
	}

	public BigDecimal getTotalTax() {
		return totalTax;
	}

	public void setTotalTax(BigDecimal totalTax) {
		this.totalTax = totalTax;
	}

	public InvoiceActionsEmb getActions() {
		return actions;
	}

	public void setActions(InvoiceActionsEmb actions) {
		this.actions = actions;
	}

}
