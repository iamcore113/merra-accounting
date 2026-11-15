package org.merra.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record VerifyInvitationResponse(
        boolean valid,
        String message,
        String inviteeEmail,
        UUID organizationId,
        String organizationDisplayName,
        String organizationLegalName,
        String role,
        LocalDateTime expiresAt
) {
}
