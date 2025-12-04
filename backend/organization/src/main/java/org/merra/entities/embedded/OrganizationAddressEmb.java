package org.merra.entities.embedded;

import java.io.Serializable;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.Embeddable;

@Embeddable
public class OrganizationAddressEmb implements Serializable {
    private String addressType;
    private Set<String> linkedSet; // new LinkedHashSet<>()
    private String city;
    private String postalCode;
    private String country;
    private String attentionTo;

    public OrganizationAddressEmb() {
    }

    public OrganizationAddressEmb(String addressType, Set<String> linkedSet, String city, String postalCode,
            String country, String attentionTo) {
        this.addressType = addressType;
        this.linkedSet = linkedSet;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.attentionTo = attentionTo;
    }

    public String getAddressType() {
        return addressType;
    }

    public void setAddressType(String addressType) {
        this.addressType = addressType;
    }

    public Set<String> getLinkedSet() {
        return linkedSet;
    }

    public void setLinkedSet(LinkedHashSet<String> linkedSet) {
        this.linkedSet = linkedSet;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getAttentionTo() {
        return attentionTo;
    }

    public void setAttentionTo(String attentionTo) {
        this.attentionTo = attentionTo;
    }

}
