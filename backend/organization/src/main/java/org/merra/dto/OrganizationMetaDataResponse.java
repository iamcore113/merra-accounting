package org.merra.dto;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

import org.merra.enums.AddressEn;
import org.merra.enums.PaymentTermTypes;
import org.merra.enums.PaymentTermsEn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrganizationMetaDataResponse(
                Set<OrganizationTypesMetaData> organizationTypes,
                EnumSet<AddressEn> addresses,
                PaymentTermsMetaData paymentTerms

) {
        public record OrganizationTypesMetaData(
                        UUID id,
                        String name) {
        	public OrganizationTypesMetaData {
				if (id == null || name == null || name.isBlank()) {
					throw new IllegalArgumentException("Organization type metadata fields cannot be null or blank.");
				}
				if (name.isBlank() || name == null) {
					throw new IllegalArgumentException("Organization type name cannot be null or blank.");
				}
			}
        }

        public record PaymentTermsMetaData(
                        EnumSet<PaymentTermsEn> subElements,
                        EnumSet<PaymentTermTypes> types) {
        }
}
