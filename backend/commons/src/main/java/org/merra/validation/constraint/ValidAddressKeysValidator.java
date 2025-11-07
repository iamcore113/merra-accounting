package org.merra.validation.constraint;

import java.util.Map;
import java.util.Set;

import org.merra.validation.AllowedKeys;
import org.merra.validation.annotation.ValidAddressKeys;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;


public class ValidAddressKeysValidator implements ConstraintValidator<ValidAddressKeys, Object> {
	private Set<String> allowedMapKeys;
	
	@Override
	public void initialize(ValidAddressKeys constraintAnnotation) {
		allowedMapKeys = AllowedKeys.ADDRESS_KEYS;
	}
	
	@Override
	public boolean isValid(Object val, ConstraintValidatorContext context) {
        if (val == null) {
            // Null maps can be handled by @NotNull if desired.
            // This validator focuses on the keys if the map exists.
            return true;
        }
        
        if (val instanceof Map single) {
            for (Object keyObject : single.keySet()) {
            	if(!validateKeys(keyObject, context)) {
            		return false;
            	}
            }
        } else if (val instanceof Set collections) {
        	for (Object objectSet: collections) {
        		if (objectSet instanceof Map single) {
                    for (Object keyObject : single.keySet()) {
                    	if(!validateKeys(keyObject, context)) {
                    		return false;
                    	}
                    }
        		}
        	}
        }

        return true; // All keys are allowed
	}
	
	private boolean validateKeys(Object keyObject, ConstraintValidatorContext context) {
        if (!(keyObject instanceof String)) {
            // This handles cases where the map's keys are not strings
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                            "Map key is not a String: '" + keyObject + "'. All keys must be strings.")
                   .addConstraintViolation();
            return false;
        }
        
        String key = (String) keyObject; // Safe cast after instanceof check

        if (!allowedMapKeys.contains(key)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                            "Invalid key found: '" + key + "'. Allowed keys are: " + allowedMapKeys)
                   .addConstraintViolation();
            return false;
        }
		return true;
	}

}
