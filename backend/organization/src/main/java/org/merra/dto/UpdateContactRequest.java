package org.merra.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateContactRequest(
        String name,
        String firstName,
        String lastName,
        String emailAddress,
        String accountNumber,
        Boolean isSupplier,
        Boolean isCustomer,
        String taxNumber,
        String companyNumber,
        String contactStatus,
        Boolean isTenant,
        String counterpartyKey) {

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UpdateContactRequest(
            @JsonProperty("name") String name,
            @JsonProperty("firstName") String firstName,
            @JsonProperty("lastName") String lastName,
            @JsonProperty("emailAddress") String emailAddress,
            @JsonProperty("accountNumber") String accountNumber,
            @JsonProperty("isSupplier") Boolean isSupplier,
            @JsonProperty("isCustomer") Boolean isCustomer,
            @JsonProperty("taxNumber") String taxNumber,
            @JsonProperty("companyNumber") String companyNumber,
            @JsonProperty("contactStatus") String contactStatus,
            @JsonProperty("isTenant") Boolean isTenant,
            @JsonProperty("counterpartyKey") String counterpartyKey) {
        this.name = (name != null && !name.isBlank()) ? name.trim() : null;
        this.firstName = (firstName != null && !firstName.isBlank()) ? firstName.trim() : null;
        this.lastName = (lastName != null && !lastName.isBlank()) ? lastName.trim() : null;
        this.emailAddress = (emailAddress != null && !emailAddress.isBlank()) ? emailAddress.trim() : null;
        this.accountNumber = (accountNumber != null && !accountNumber.isBlank()) ? accountNumber.trim() : null;
        this.isSupplier = isSupplier != null ? isSupplier : Boolean.FALSE;
        this.isCustomer = isCustomer != null ? isCustomer : Boolean.FALSE;
        this.taxNumber = (taxNumber != null && !taxNumber.isBlank()) ? taxNumber.trim() : null;
        this.companyNumber = (companyNumber != null && !companyNumber.isBlank()) ? companyNumber.trim() : null;
        this.contactStatus = (contactStatus != null && !contactStatus.isBlank()) ? contactStatus.trim() : "ACTIVE";
        this.isTenant = isTenant != null ? isTenant : Boolean.FALSE;
        this.counterpartyKey = (counterpartyKey != null && !counterpartyKey.isBlank()) ? counterpartyKey.trim() : null;
    }
}
