package org.merra.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GenerateNetworkKeyRequest(String name) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public GenerateNetworkKeyRequest(@JsonProperty("name") String name) {
        this.name = (name != null && !name.isBlank()) ? name.trim() : null;
    }
}
