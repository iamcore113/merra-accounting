package org.merra.validation.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.merra.validation.constraint.InvoiceConditionalValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ElementType.TYPE, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = InvoiceConditionalValidator.class)
@Documented
public @interface ValidateInvoice {
    String message() default "Invalid CreateInvoiceRequest components.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}