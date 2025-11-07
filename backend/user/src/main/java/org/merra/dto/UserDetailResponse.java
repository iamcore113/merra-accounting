package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record UserDetailResponse(
    @NotNull(message = "userId component cannot be null.")
    UUID userId,
    @NotNull(message = "userEmail component cannot be null.")
    String userEmail,
    @NotNull(message = "userFullName component cannot be null.")
    String userFullName
) {

}
