package org.merra.dto;

import java.time.LocalDate;
import java.util.UUID;

public record OrganizationMemberResponse(
		UUID id,
		UUID userId,
		String fullName,
		String email,
		String role,
		String status,
		boolean isCreator,
		boolean isInvited,
		String invitedBy,
		LocalDate invitationDate,
		LocalDate dateJoined,
		boolean hasProfileImage
) {
	public OrganizationMemberResponse(
			UUID id,
			UUID userId,
			String fullName,
			String email,
			String role,
			String status,
			boolean isCreator,
			boolean isInvited,
			String invitedBy,
			LocalDate invitationDate,
			LocalDate dateJoined) {
		this(id, userId, fullName, email, role, status, isCreator, isInvited, invitedBy, invitationDate, dateJoined, false);
	}
}
