package org.merra.services.phone;

import java.util.LinkedHashSet;
import java.util.Optional;

import org.merra.embedded.PhoneDetails;

public sealed interface PhoneServiceInterface permits PhoneService, ProxyPhoneService {
	LinkedHashSet<PhoneDetails> validatePhones(
			LinkedHashSet<PhoneDetails> phones,
			Optional<String> countryCode
	);
}
