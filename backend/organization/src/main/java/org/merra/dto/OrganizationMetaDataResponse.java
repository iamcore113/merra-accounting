package org.merra.dto;

import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrganizationMetaDataResponse(
        Set<OrganizationTypesMetaData> types) {
    public record OrganizationTypesMetaData(
            @NotNull(message = "ID cannot be null") UUID id,
            @NotBlank(message = "Name cannot be blank") String name) {
    }
}
