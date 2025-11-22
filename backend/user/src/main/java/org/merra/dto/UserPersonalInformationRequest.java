package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record UserPersonalInformationRequest(
    @NotBlank(message = "email component cannot be blank.")
    String email,
    @NotBlank(message = "firstName component cannot be blank.")
    String firstName,
    @NotBlank(message = "lastName component cannot be blank.")
    String lastName,
    @NotBlank(message = "country component cannot be blank.")
    String country
) {

}
