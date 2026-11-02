package org.merra.dto;

import java.io.Serializable;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record CountriesCache(
        @JsonProperty("countries") List<CountriesResponse> countries) implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonCreator
    public CountriesCache {
    }
}
