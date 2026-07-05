package org.merra.dto;

public record CompleteContactRequest(
		String name,
		String firstName,
		String lastName,
		String emailAddress,
		String accountNumber,
		String companyNumber,
		String contactStatus) {
	public CompleteContactRequest {
		if (name == null || name.isBlank()) {
			throw new IllegalArgumentException("name cannot be null or blank");
		}
		if (contactStatus == null || contactStatus.isBlank()) {
			throw new IllegalArgumentException("contactStatus cannot be null or blank");
		}
	}
}
