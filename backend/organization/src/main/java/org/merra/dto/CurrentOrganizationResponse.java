package org.merra.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CurrentOrganizationResponse(
        UUID organizationId,
        Type organizationType,
        Names names,
        Contact address,
        String website,
        LocalDate createdDate,
        String status,
        FinancialYearEmb financialYear

) {

    public CurrentOrganizationResponse {
        if (organizationId == null) {
            throw new IllegalArgumentException("organizationId cannot be null");
        }
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("status cannot be null or blank");
        }
    }

    public record Type(UUID typeId, String name) {
        public Type {
            if (typeId == null || name == null) {
                throw new IllegalArgumentException("typeId and name cannot be null");
            }
        }
    }

    public record FinancialYearEmb(String yearEndDay, String yearEndMonth) {
        public FinancialYearEmb {
            if (yearEndDay == null || yearEndDay.isBlank()) {
                throw new IllegalArgumentException("yearEndDay cannot be null or blank");
            }
            if (yearEndMonth == null || yearEndMonth.isBlank()) {
                throw new IllegalArgumentException("yearEndMonth cannot be null or blank");
            }
        }
    }

    public record Contact(String email, String country, String currency, String timeZone, List<Address> addresses) {
        public Contact {
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("email cannot be null or blank.");
            }
            if (country == null || country.isBlank()) {
                throw new IllegalArgumentException("country cannot be null or blank");
            }
            if (currency == null || currency.isBlank()) {
                throw new IllegalArgumentException("currency cannot be null or blank");
            }
            if (timeZone == null || timeZone.isBlank()) {
                throw new IllegalArgumentException("timeZone cannot be null or blank");
            }
        }

        public record Address(String type, List<String> addresses, String city, String country, String postalCode) {
            public Address {
                if (type == null || type.isBlank()) {
                    throw new IllegalArgumentException("type cannot be null or blank");
                }
                if (addresses == null || addresses.isEmpty()) {
                    throw new IllegalArgumentException("addresses cannot be null or empty");
                }
                if (city == null || city.isBlank()) {
                    throw new IllegalArgumentException("city cannot be null or blank");
                }
                if (country == null || country.isBlank()) {
                    throw new IllegalArgumentException("country cannot be null or blank");
                }
                if (postalCode == null || postalCode.isBlank()) {
                    throw new IllegalArgumentException("postalCode cannot be null or blank");
                }
            }
        }
    }

    public record Names(String displayName, String legalName, String description) {
        public Names {
            if (displayName == null || displayName.isBlank()) {
                throw new IllegalArgumentException("displayName cannot be null or blank");
            }
            if (legalName == null || legalName.isBlank()) {
                throw new IllegalArgumentException("legalName cannot be null or blank");
            }
        }
    }
}
