package org.merra.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "line_amount_type")
public class LineAmountType {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "type", nullable = false, unique = true)
    @NotBlank(message = "type attribute cannot be blank or null.")
    private String type;

    public LineAmountType() {
    }

    public LineAmountType(String type) {
        this.type = type;
    }

    public UUID getId() {
        return this.id;
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
