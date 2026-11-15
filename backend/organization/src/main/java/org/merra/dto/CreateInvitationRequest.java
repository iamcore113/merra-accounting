package org.merra.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateInvitationRequest(
        @NotBlank(message = "Invitee email is required")
        @Email(message = "Invitee email must be a valid email address")
        String inviteeEmail,

        @NotBlank(message = "Role is required")
        String role,

        boolean sendEmail
) {
}
