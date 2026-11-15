package org.merra.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record InvitationResponse(
        UUID id,
        UUID organizationId,
        String organizationDisplayName,
        String organizationLegalName,
        String inviteeEmail,
        String role,
        String invitationToken,
        String invitationLink,
        boolean emailSent,
        boolean isActive,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {
}
