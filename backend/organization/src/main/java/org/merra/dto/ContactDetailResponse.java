package org.merra.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ContactDetailResponse(
        UUID contactId,
        String name,
        String firstName,
        String lastName,
        String emailAddress,
        String accountNumber,
        Boolean isSupplier,
        Boolean isCustomer,
        String taxNumber,
        String companyNumber,
        String contactStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public ContactDetailResponse {
        isSupplier = Boolean.TRUE.equals(isSupplier);
        isCustomer = Boolean.TRUE.equals(isCustomer);
        contactStatus = (contactStatus != null && !contactStatus.isBlank()) ? contactStatus : "ACTIVE";
    }
}

