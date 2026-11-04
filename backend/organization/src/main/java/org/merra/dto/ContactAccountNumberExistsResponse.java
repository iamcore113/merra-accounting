package org.merra.dto;

public record ContactAccountNumberExistsResponse(
		String accountNumber,
		boolean exists
) {}

