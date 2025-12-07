package org.merra.services.phone;

import java.util.LinkedHashSet;
import java.util.Optional;

import org.merra.embedded.PhoneDetailsEmb;

public sealed interface PhoneServiceInterface permits PhoneService, ProxyPhoneService {
	LinkedHashSet<PhoneDetailsEmb> validatePhones(
			LinkedHashSet<PhoneDetailsEmb> phones,
			Optional<String> countryCode);
}
