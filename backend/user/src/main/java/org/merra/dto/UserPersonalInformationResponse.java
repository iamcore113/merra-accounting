package org.merra.dto;

public record UserPersonalInformationResponse(
    boolean isInformationFilled,
    String userId,
    String email
) {

}
