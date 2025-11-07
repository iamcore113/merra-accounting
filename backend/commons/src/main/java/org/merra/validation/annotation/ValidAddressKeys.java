package org.merra.validation.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.merra.validation.constraint.ValidAddressKeysValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidAddressKeysValidator.class)
@Documented
public @interface ValidAddressKeys {
    String message() default "Map contains invalid or disallowed keys.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

}
