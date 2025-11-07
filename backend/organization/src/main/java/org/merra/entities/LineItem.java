package org.merra.entities;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.merra.entities.embedded.LineItemByAccountCode;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 *  the "LineItems" collection holds all the granular detail
 *  about what is being bought or sold on that particular invoice.
 *  When you create an invoice in Xero, you add multiple "line items"
 *  to build up the total amount.
 */
@Entity
@Table(name = "line_item", schema = "merra_schema")
public class LineItem {

	@Id @GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;
	
	// Shouldn't be include at any JSON response -- FOR NOW
	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "invoice_id", referencedColumnName = "invoice_id")
	@NotNull(message = "Invoice cannot be null")
	private Invoice invoice;
	
	// A clear explanation of the product or service provided.
	@Column(name = "lineitem_description", nullable = false)
	@NotBlank(message = "Description cannot be blank")
	private String description;
	
	// Unique identifier assigned by the application itself to each individual line item
	@Column(name = "line_item_id", nullable = false, unique = true)
	@NotBlank(message = "Line item ID cannot be blank")
	private String lineItemId;
	
	// How many units of that product or service were provided.
	@Column(name = "quantity", nullable = false)
	@NotNull(message = "Quantity cannot be blank")
	private Double quantity;
	
	// The cost of one unit of that product or service.
	@Column(name = "unit_amount", nullable = false)
	@NotNull(message = "Unit amount cannot be blank")
	private Double unitAmount;
	
	@Column(name = "account_code", nullable = false)
	@NotBlank(message = "Account code cannot be blank")
	private String accountCode;
	
	// This is automatically calculated
	// total value for that specific line item -- LineAmount = Quantity * UnitAmount
	@Column(name = "line_amount", nullable = false)
	@NotNull(message = "Line amount cannot be blank")
	private Double lineAmount;
	
	@Column(name = "tax_type", nullable = false)
	@NotBlank(message = "taxType attribute cannot be blank.")
	private String taxType;
	
	// auto-calculated
	@Column(name = "tax_amount", nullable = false, precision = 7, scale = 2)
	@NotNull(message = "Tax amount cannot be null")
	private BigDecimal taxAmount;
	
	@Column(name = "discount_rate")
	private Integer discountRate;
	
	@Column(nullable = false, precision = 7, scale = 2)
	@NotNull(message = "total attribute cannot be null.")
	private BigDecimal total;
	
	public static List<LineItemByAccountCode> getLineItemByAccountCode(Set<LineItem> lineItems) {
		List<LineItemByAccountCode> response = new ArrayList<>();
		for (LineItem lt: lineItems) {
			int total = Collections.frequency(lineItems, lt.getAccountCode());
			List<LineItem> getLineItems = lineItems.stream()
					.filter(dt -> dt.getAccountCode().equals(lt.getAccountCode()))
					.toList();
			
			response.add(new LineItemByAccountCode(lt.getAccountCode(), total, getLineItems));
		}
		return response;
	}

	public LineItem() {
	}

	public LineItem(UUID id, @NotNull(message = "Invoice cannot be null") Invoice invoice,
			@NotBlank(message = "Description cannot be blank") String description,
			@NotBlank(message = "Line item ID cannot be blank") String lineItemId,
			@NotNull(message = "Quantity cannot be blank") Double quantity,
			@NotNull(message = "Unit amount cannot be blank") Double unitAmount,
			@NotBlank(message = "Account code cannot be blank") String accountCode,
			@NotNull(message = "Line amount cannot be blank") Double lineAmount,
			@NotBlank(message = "taxType attribute cannot be blank.") String taxType,
			@NotNull(message = "Tax amount cannot be null") BigDecimal taxAmount, Integer discountRate,
			@NotNull(message = "total attribute cannot be null.") BigDecimal total) {
		this(invoice, description, lineItemId, quantity, unitAmount, accountCode, lineAmount, taxType, taxAmount, discountRate, total);
		this.id = id;
	}

	public LineItem(@NotNull(message = "Invoice cannot be null") Invoice invoice,
			@NotBlank(message = "Description cannot be blank") String description,
			@NotBlank(message = "Line item ID cannot be blank") String lineItemId,
			@NotNull(message = "Quantity cannot be blank") Double quantity,
			@NotNull(message = "Unit amount cannot be blank") Double unitAmount,
			@NotBlank(message = "Account code cannot be blank") String accountCode,
			@NotNull(message = "Line amount cannot be blank") Double lineAmount,
			@NotBlank(message = "taxType attribute cannot be blank.") String taxType,
			@NotNull(message = "Tax amount cannot be null") BigDecimal taxAmount, Integer discountRate,
			@NotNull(message = "total attribute cannot be null.") BigDecimal total) {
		this.invoice = invoice;
		this.description = description;
		this.lineItemId = lineItemId;
		this.quantity = quantity;
		this.unitAmount = unitAmount;
		this.accountCode = accountCode;
		this.lineAmount = lineAmount;
		this.taxType = taxType;
		this.taxAmount = taxAmount;
		this.discountRate = discountRate;
		this.total = total;
	}

	public UUID getId() {
		return id;
	}

	public Invoice getInvoice() {
		return invoice;
	}

	public void setInvoice(Invoice invoice) {
		this.invoice = invoice;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getLineItemId() {
		return lineItemId;
	}

	public void setLineItemId(String lineItemId) {
		this.lineItemId = lineItemId;
	}

	public Double getQuantity() {
		return quantity;
	}

	public void setQuantity(Double quantity) {
		this.quantity = quantity;
	}

	public Double getUnitAmount() {
		return unitAmount;
	}

	public void setUnitAmount(Double unitAmount) {
		this.unitAmount = unitAmount;
	}

	public String getAccountCode() {
		return accountCode;
	}

	public void setAccountCode(String accountCode) {
		this.accountCode = accountCode;
	}

	public Double getLineAmount() {
		return lineAmount;
	}

	public void setLineAmount(Double lineAmount) {
		this.lineAmount = lineAmount;
	}

	public String getTaxType() {
		return taxType;
	}

	public void setTaxType(String taxType) {
		this.taxType = taxType;
	}

	public BigDecimal getTaxAmount() {
		return taxAmount;
	}

	public void setTaxAmount(BigDecimal taxAmount) {
		this.taxAmount = taxAmount;
	}

	public Integer getDiscountRate() {
		return discountRate;
	}

	public void setDiscountRate(Integer discountRate) {
		this.discountRate = discountRate;
	}

	public BigDecimal getTotal() {
		return total;
	}

	public void setTotal(BigDecimal total) {
		this.total = total;
	}

	
}
