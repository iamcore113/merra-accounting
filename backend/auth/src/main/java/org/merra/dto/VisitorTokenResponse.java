package org.merra.dto;

import jakarta.validation.constraints.NotBlank;

public record VisitorTokenResponse(
        @NotBlank(message = "token component cannot be blank.") String token) {

}
