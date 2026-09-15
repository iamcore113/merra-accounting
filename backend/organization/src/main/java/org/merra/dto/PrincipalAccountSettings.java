package org.merra.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PrincipalAccountSettings(
        UUID id,
        UUID pricipalId,
        Boolean autoAcceptInvitation,
        LocalDate emailChange) {
    public PrincipalAccountSettings {
        if (id == null)
            throw new IllegalArgumentException("id cannot be null.");
        if (pricipalId == null)
            throw new IllegalArgumentException("pricipalId cannot be null.");
    }
}
