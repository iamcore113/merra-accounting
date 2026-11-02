package org.merra.dto;

public record EmailVerificationStatusResponse(
        boolean exists,
        boolean isVerified,
        boolean isPendingVerification) {
}

