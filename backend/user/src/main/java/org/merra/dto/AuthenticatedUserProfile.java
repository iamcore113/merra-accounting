package org.merra.dto;

import java.util.UUID;

public record AuthenticatedUserProfile(
        UUID id,
        String gender,
        String email,
        String firstName,
        String lastName,
        String country) {
    public AuthenticatedUserProfile {
        if (id == null) {
            throw new IllegalArgumentException("id component cannot be null.");
        }
        if (email == null) {
            throw new IllegalArgumentException("email component cannot be null.");
        }
        if (firstName == null) {
            throw new IllegalArgumentException("firstName component cannot be null.");
        }
        if (lastName == null) {
            throw new IllegalArgumentException("lastName component cannot be null.");
        }
        if (country == null) {
            throw new IllegalArgumentException("country component cannot be null.");
            }
    }
}
