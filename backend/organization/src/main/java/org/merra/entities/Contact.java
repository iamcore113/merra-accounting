package org.merra.entities;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TimeZoneStorage;
import org.hibernate.annotations.TimeZoneStorageType;
import org.hibernate.type.SqlTypes;
import org.merra.embedded.PhoneDetails;

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
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * field @name is the only non optional attribute in this entity.
 */
@Entity(name = "Contact")
@Table(name = "contacts", schema = "merra_schema")
public class Contact {

	@Id @GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "contact_id", nullable = false, unique = true)
	private UUID id;
	
	@ManyToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "organization", nullable = false, referencedColumnName = "id")
	private Organization organization;
	
	// Full name of contact / organization
	@Column(name = "name", nullable = false, unique = true)
	@NotBlank(message = "Name cannot be blank")
	private String name;
	
	@Column(name = "first_name")
	private String firstName;
	
	@Column(name = "last_name")
	private String lastName;
	
	@Column(name = "email_address")
	@Email(message = "Email address must be valid")
	private String emailAddress;
	
	@JdbcTypeCode(SqlTypes.JSON_ARRAY)
	@Column(name = "phone_no", nullable = false, columnDefinition = "jsonb[]")
	private LinkedHashSet<PhoneDetails> phoneNo;
	
	@Column(name = "account_number")
	private String accountNumber;
	
	// Company registration number
	@Column(name = "company_number")
	private String companyNumber;
	
	@Column(name = "default_discount")
	private Integer defaultDiscount;
	
	// Tax number
	@Column(name = "tax_number")
	private String taxNumber;
	
	@Column(name = "contact_status", nullable = false)
	private String contactStatus = "ACTIVE";
	
	@Column(name = "is_supplier", nullable = false)
	@NotNull(message = "Supplier status cannot be null")
	private Boolean isSupplier;
	
	@Column(name = "is_customer", nullable = false)
	@NotNull(message = "Customer status cannot be null")
	private Boolean isCustomer;
	
	
	// Only shown in GET response, not in POST/PUT
	@JdbcTypeCode(SqlTypes.JSON_ARRAY)
	@Column(name = "address", columnDefinition = "jsonb")
	private Map<String, Object> address;
	
	// Returned in GET response, not in POST/PUT
	@ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
	@JoinColumn(name = "payment_terms", referencedColumnName = "payment_term_id")
	private PaymentTerms paymentTerms;
	
	// Returned in GET response, not in POST/PUT
	@Column(name = "updated_date_utc")
	@TimeZoneStorage(TimeZoneStorageType.NORMALIZE_UTC)
	private Instant updatedDateUTC;

	public Contact() {
		// default constructor
	}
	
	public Contact(@NotBlank String name, @NotNull Organization organization) {
		this.name = name;
		this.organization = organization;
	}
	
	public void setIsSupplier(Boolean sup) {
		this.isSupplier = sup ? Boolean.TRUE : Boolean.FALSE;
	}
	
	public void setIsCustomer(Boolean cus) {
		this.isCustomer = cus ? Boolean.TRUE : Boolean.FALSE;
	}

	public UUID getId() {
		return id;
	}

	public Organization getOrganization() {
		return organization;
	}

	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getEmailAddress() {
		return emailAddress;
	}

	public void setEmailAddress(String emailAddress) {
		this.emailAddress = emailAddress;
	}

	public LinkedHashSet<PhoneDetails> getPhoneNo() {
		return phoneNo;
	}

	public void setPhoneNo(LinkedHashSet<PhoneDetails> phoneNo) {
		this.phoneNo = phoneNo;
	}

	public String getAccountNumber() {
		return accountNumber;
	}

	public void setAccountNumber(String accountNumber) {
		this.accountNumber = accountNumber;
	}

	public String getCompanyNumber() {
		return companyNumber;
	}

	public void setCompanyNumber(String companyNumber) {
		this.companyNumber = companyNumber;
	}

	public Integer getDefaultDiscount() {
		return defaultDiscount;
	}

	public void setDefaultDiscount(Integer defaultDiscount) {
		this.defaultDiscount = defaultDiscount;
	}

	public String getTaxNumber() {
		return taxNumber;
	}

	public void setTaxNumber(String taxNumber) {
		this.taxNumber = taxNumber;
	}

	public String getContactStatus() {
		return contactStatus;
	}

	public void setContactStatus(String contactStatus) {
		this.contactStatus = contactStatus;
	}

	public Boolean getIsSupplier() {
		return isSupplier;
	}

	public Boolean getIsCustomer() {
		return isCustomer;
	}

	public Map<String, Object> getAddress() {
		return address;
	}

	public void setAddress(Map<String, Object> address) {
		this.address = address;
	}

	public PaymentTerms getPaymentTerms() {
		return paymentTerms;
	}

	public void setPaymentTerms(PaymentTerms paymentTerms) {
		this.paymentTerms = paymentTerms;
	}

	public Instant getUpdatedDateUTC() {
		return updatedDateUTC;
	}

	public void setUpdatedDateUTC(Instant updatedDateUTC) {
		this.updatedDateUTC = updatedDateUTC;
	}

	
}
