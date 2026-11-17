package org.merra.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterAndAcceptInvitationRequest(
        @NotBlank(message = "Invitation token is required.")
        String token,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be valid.")
        String email,

        @NotBlank(message = "First name is required.")
        String firstName,

        @NotBlank(message = "Last name is required.")
        String lastName,

        @NotBlank(message = "Gender is required.")
        String gender,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, message = "Password must be at least 8 characters.")
        String password
) {
}
