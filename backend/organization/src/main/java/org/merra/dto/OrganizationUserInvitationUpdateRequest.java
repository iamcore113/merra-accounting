package org.merra.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrganizationUserInvitationUpdateRequest (
		@NotNull(message = "invitationBy component cannot be null.")
		UUID invitationBy,
		@NotNull(message = "invitationTo component cannot be null")
		UUID invitationTo,
		@NotNull(message = "updatedBy component cannot be null.")
		UUID updatedBy,
		@NotBlank(message = "invitationStatus component cannot be blank.")
		String invitationStatus
) {

}