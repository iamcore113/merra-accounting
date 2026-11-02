package org.merra.dto;

import java.io.Serializable;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record CountriesResponse(
                @JsonProperty("countryId") UUID countryId,
                @JsonProperty("countryName") String countryName,
                @JsonProperty("isoAlpha2Code") String isoAlpha2Code,
                @JsonProperty("isoAlpha3Code") String isoAlpha3Code,
                @JsonProperty("isoNumericCode") String isoNumericCode,
                @JsonProperty("symbol") String symbol,
                @JsonProperty("code") String code) implements Serializable {

        private static final long serialVersionUID = 1L;

        @JsonCreator
        public CountriesResponse {
        }
}
