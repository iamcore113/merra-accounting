package org.merra.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.persistence.Id;

@Entity
@Table(name = "invoice_status_codes")
public class InvoiceStatusCode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 255, nullable = false, unique = true)
    @NotBlank(message = "Code attribute is required")
    private String code;

    @Column(nullable = true)
    private String description;

    public InvoiceStatusCode() {
    }

    public InvoiceStatusCode(@NotBlank(message = "Code attribute is required") String code, String description) {
        this.code = code;
        this.description = description;
    }

    public InvoiceStatusCode(@NotBlank(message = "Code attribute is required") String code) {
        this.code = code;
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
