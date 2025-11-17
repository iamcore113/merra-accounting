package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

public record VerificationResponse(
        boolean resent,
        @NotBlank(message = "verificationToken component cannot be blank.") String verificationToken,
        @NotBlank(message = "userId component cannot be blank.") UUID userId,
        @NotBlank(message = "email component cannot be blank.") String email) {

}
