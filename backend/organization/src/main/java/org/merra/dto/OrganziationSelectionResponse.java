package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrganziationSelectionResponse(
    @NotNull(message = "organizationId cannot be null")
    UUID organizationId,
    @NotBlank(message = "displayName cannot be blank")
    String displayName,
    @NotBlank(message = "legalName cannot be blank")
    String legalName,
    String description,
    @NotBlank(message = "status cannot be blank")
    String status
) {

}
