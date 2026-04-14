package org.merra.dto;

import java.util.UUID;

public record UserDetailResponse(
        UUID userId,
        String userEmail,
        String userFullName) {
    public UserDetailResponse {
        if (userId == null) {
            throw new IllegalArgumentException("userId component cannot be null.");
        }
        if (userEmail == null) {
            throw new IllegalArgumentException("userEmail component cannot be null.");
        }
        if (userFullName == null) {
            throw new IllegalArgumentException("userFullName component cannot be null.");
        }
    }
}
