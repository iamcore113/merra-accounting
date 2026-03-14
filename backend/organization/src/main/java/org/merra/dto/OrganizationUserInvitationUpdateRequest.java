package org.merra.dto;

import java.util.UUID;

public record OrganizationUserInvitationUpdateRequest (
		UUID invitationBy,
		UUID invitationTo,
		UUID updatedBy,
		String invitationStatus
) {
	public OrganizationUserInvitationUpdateRequest {
		if (invitationStatus == null || invitationStatus.isBlank()) {
			throw new IllegalArgumentException("invitationStatus cannot be null or blank");
		}
		if (invitationBy == null) {
			throw new IllegalArgumentException("invitationBy cannot be null");
		}
		if (invitationTo == null) {
			throw new IllegalArgumentException("invitationTo cannot be null");
		}
		if (updatedBy == null) {
			throw new IllegalArgumentException("updatedBy cannot be null");
		}
	}
}