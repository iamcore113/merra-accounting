package org.merra.dto;

import java.util.UUID;

public record AcceptInvitationResponse(
        UUID organizationId,
        String organizationDisplayName,
        String organizationLegalName,
        String role,
        String message,
        String accessToken,
        String refreshToken
) {
    public AcceptInvitationResponse(
            UUID organizationId,
            String organizationDisplayName,
            String organizationLegalName,
            String role,
            String message
    ) {
        this(organizationId, organizationDisplayName, organizationLegalName, role, message, null, null);
    }
}
