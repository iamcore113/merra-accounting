package org.merra.dto;

import java.util.UUID;

public record PrincipalDetailsResponse(
        UUID id,
        String firstName,
        String lastName,
        String fullName,
        String gender,
        String country,
        String email,
        UserOrganizationAffiliation organizationAffiliation,
        Boolean isEnabled) {
    public PrincipalDetailsResponse(
            UUID id,
            String firstName,
            String lastName,
            String fullName,
            String gender,
            String country,
            String email,
            UserOrganizationAffiliation organizationAffiliation) {
        this(id, firstName, lastName, fullName, gender, country, email, organizationAffiliation, Boolean.TRUE);
    }

    public PrincipalDetailsResponse {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null.");
        }
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("First name cannot be null or blank.");
        }
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("Last name cannot be null or blank.");
        }
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Full name cannot be null or blank.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or blank.");
        }
        if (country == null) {
            country = "";
        }
        if (gender == null || gender.isBlank()) {
            throw new IllegalArgumentException("Gender cannot be null or blank.");
        }
        if (isEnabled == null) {
            isEnabled = Boolean.TRUE;
        }
    }
}
