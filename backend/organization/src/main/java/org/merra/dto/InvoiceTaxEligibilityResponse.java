package org.merra.dto;

import java.util.UUID;

public class InvoiceTaxEligibilityResponse {
    private UUID organizationId;
    private Boolean eligible;
    private String message;

    public InvoiceTaxEligibilityResponse() {
    }

    public InvoiceTaxEligibilityResponse(UUID organizationId, Boolean eligible, String message) {
        this.organizationId = organizationId;
        this.eligible = eligible;
        this.message = message;
    }

    public InvoiceTaxEligibilityResponse(UUID organizationId, Boolean eligible) {
        this.eligible = eligible;
        this.organizationId = organizationId;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public Boolean getEligible() {
        return eligible;
    }

    public void setEligible(Boolean eligible) {
        this.eligible = eligible;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
