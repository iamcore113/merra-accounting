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
                        @NotNull(message = "ID cannot be null") UUID id,
                        @NotBlank(message = "Name cannot be blank") String name) {
        }

        public record PaymentTermsMetaData(
                        EnumSet<PaymentTermsEn> subElements,
                        EnumSet<PaymentTermTypes> types) {
        }
}
