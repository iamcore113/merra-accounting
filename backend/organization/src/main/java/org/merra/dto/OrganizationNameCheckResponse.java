package org.merra.dto;

public record OrganizationNameCheckResponse(
        String name,
        Boolean alreadyExists) {
    public OrganizationNameCheckResponse {
        if (name == null || name.isEmpty())
            throw new IllegalArgumentException("Organization name cannot be null or empty.");
        if (alreadyExists == null)
            throw new IllegalArgumentException("Already exists flag cannot be null.");
    }
}
