package org.merra.dto;

import java.util.UUID;

public record AcceptInvitationResponse(
        UUID organizationId,
        String organizationDisplayName,
        String organizationLegalName,
        String role,
        String message
) {
}
