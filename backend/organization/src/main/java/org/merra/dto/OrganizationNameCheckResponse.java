package org.merra.dto;

public record OrganizationNameCheckResponse(
        String name,
        Boolean isAvailable) {
    public OrganizationNameCheckResponse {
        if (name == null || name.isEmpty())
            throw new IllegalArgumentException("Organization name cannot be null or empty.");
        if (isAvailable == null)
            throw new IllegalArgumentException("Is available flag cannot be null.");
    }
}
