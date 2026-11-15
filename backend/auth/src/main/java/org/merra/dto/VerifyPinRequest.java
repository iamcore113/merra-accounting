package org.merra.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyPinRequest(
    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "PIN code cannot be blank")
    @Pattern(regexp = "^\\d{4}$", message = "PIN code must be a 4-digit code")
    String pin
) {
}
