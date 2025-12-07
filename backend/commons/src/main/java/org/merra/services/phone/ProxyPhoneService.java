package org.merra.services.phone;

import java.util.LinkedHashSet;
import java.util.Optional;

import org.merra.embedded.PhoneDetailsEmb;
import org.springframework.stereotype.Service;

/**
 * In this phone service. country codes on every phone details
 * are required and must be checked before proceeding.
 */
@Service
public final class ProxyPhoneService implements PhoneServiceInterface {
	private final PhoneService phoneService;

	public ProxyPhoneService(PhoneService phoneService) {
		this.phoneService = phoneService;
	}

	@Override
	public LinkedHashSet<PhoneDetailsEmb> validatePhones(LinkedHashSet<PhoneDetailsEmb> phones,
			Optional<String> countryCode) {
		// Validate phone numbers
		// For contacts phone country code cannot be null.
		phones.stream()
				.forEach(pn -> {
					if (pn.getPhoneCountryCode().isBlank()) {
						throw new IllegalArgumentException("Phone country code cannot be null.");
					}
				});
		return phoneService.validatePhones(phones, Optional.empty());
	}

}
