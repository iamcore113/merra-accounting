package org.merra.dto;

import java.util.UUID;

public record CountriesResponse(
                UUID countryId,
                String countryName,
                String isoAlpha2Code,
                String isoAlpha3Code,
                String isoNumericCode, String symbol, String code) {

}
