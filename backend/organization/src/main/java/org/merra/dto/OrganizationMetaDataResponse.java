package org.merra.dto;

import java.io.Serializable;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

import org.merra.enums.AddressEn;
import org.merra.enums.PaymentTermTypes;
import org.merra.enums.PaymentTermsEn;

public record OrganizationMetaDataResponse(
                Set<OrganizationTypesMetaData> organizationTypes,
                EnumSet<AddressEn> addresses,
                PaymentTermsMetaData paymentTerms,
                Set<OrganizationAddressType> organizationAddressTypes) implements Serializable {
        private static final long serialVersionUID = 1L;

        public record OrganizationTypesMetaData(
                        UUID id,
                        String name) implements Serializable {
                private static final long serialVersionUID = 1L;

                public OrganizationTypesMetaData {
                        if (id == null || name == null || name.isBlank()) {
                                throw new IllegalArgumentException(
                                                "Organization type metadata fields cannot be null or blank.");
                        }
                        if (name.isBlank() || name == null) {
                                throw new IllegalArgumentException("Organization type name cannot be null or blank.");
                        }
                }
        }

        public record PaymentTermsMetaData(
                        EnumSet<PaymentTermsEn> subElements,
                        EnumSet<PaymentTermTypes> types) implements Serializable {
                private static final long serialVersionUID = 1L;
        }

        public record OrganizationAddressType(
                        UUID id,
                        String name) implements Serializable {
                private static final long serialVersionUID = 1L;

                public OrganizationAddressType {
                        if (id == null || name == null || name.isBlank()) {
                                throw new IllegalArgumentException(
                                                "Organization address type metadata fields cannot be null or blank.");
                        }
                        if (name.isBlank() || name == null) {
                                throw new IllegalArgumentException(
                                                "Organization address type name cannot be null or blank.");
                        }
                }
        }
}
