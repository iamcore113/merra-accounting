package org.merra.dto;

public record VisitorAccessToken(String accessToken) {
    public VisitorAccessToken {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalArgumentException("accessToken cannot be blank");
        }
    }
}
