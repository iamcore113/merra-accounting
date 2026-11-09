package org.merra.validation.constraint;

import org.merra.dto.CreateInvoiceRequest;
import org.merra.validation.annotation.ValidateInvoice;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class InvoiceConditionalValidator implements ConstraintValidator<ValidateInvoice, CreateInvoiceRequest> {

	@Override
	public boolean isValid(CreateInvoiceRequest value, ConstraintValidatorContext context) {
		if (value == null) return true; // let @NotNull handle the null DTO itself
		
		/**
		 * If taxEligible is set to false, no tax type must be set.
		 * return false if tax type is found while taxEligible is
		 * set to false.
		 */
		if (Boolean.FALSE.equals(value.taxEligible()) && value.lineItems() != null) {
			boolean presentTaxType = value.lineItems()
					.stream().anyMatch(el -> el.overrideTaxType() != null && !el.overrideTaxType().isBlank());
			if (presentTaxType) {
				return false;
			}
		}
		return true;
	}

}
