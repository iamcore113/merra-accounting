package org.merra.dto;

public record RestCountriesRequest(
        String common,
        String official,
        String alpha2,
        String alpha3,
        String numeric,
        String code, String symbol) {

}
