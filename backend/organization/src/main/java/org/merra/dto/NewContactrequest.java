package org.merra.dto;

public record NewContactrequest(
        String firstName,
        String lastName) {
    public NewContactrequest {
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("First name is required");
        }
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("Last name is required");
        }
    }
}
