package org.merra.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EmailVerificationStatusResponse(
        boolean exists,
        @JsonProperty("isVerified") boolean isVerified,
        @JsonProperty("isPendingVerification") boolean isPendingVerification) {
}

