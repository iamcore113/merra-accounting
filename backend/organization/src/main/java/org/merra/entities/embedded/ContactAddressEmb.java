package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

@Embeddable
public class ContactAddressEmb implements Serializable {
    private String label;
    private String address;

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public ContactAddressEmb(String label, String address) {
        this.label = label;
        this.address = address;
    }
}
