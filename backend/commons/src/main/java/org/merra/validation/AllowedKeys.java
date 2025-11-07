package org.merra.validation;

import java.util.Collections;
import java.util.Set;

public class AllowedKeys {
	public static final Set<String> ADDRESS_KEYS;
	
	static {
		ADDRESS_KEYS = Collections.unmodifiableSet(Set.of(
				"addressLine1",
				"addressLine2",
				"addressLine3",
				"addressLine4",
				"city",
				"region",
				"country",
				"postalCode",
				"attentionTo"
		));
	}
}
