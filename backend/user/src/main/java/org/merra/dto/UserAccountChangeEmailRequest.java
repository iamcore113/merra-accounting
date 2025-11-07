package org.merra.dto;

import jakarta.validation.constraints.NotNull;

public record UserAccountChangeEmailRequest(
		@NotNull(message = "currentEmailAddress component cannot be null.")
		String currentEmailAddress,
		@NotNull(message = "newEmailAddress component cannot be null.")
		String newEmailAddress
) {

}

