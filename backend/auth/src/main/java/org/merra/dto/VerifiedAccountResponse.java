package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifiedAccountResponse(
        boolean isVerified,
        @NotNull(message = "accountId component cannot be null.") UUID accountId,
        @NotBlank(message = "accountEmail component cannot be blank.") String accountEmail) {

}
