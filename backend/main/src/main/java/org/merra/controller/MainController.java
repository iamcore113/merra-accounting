package org.merra.controller;

import java.util.List;

import org.merra.api.ApiResponse;
import org.merra.dto.CountriesResponse;
import org.merra.services.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/main/utilities/")
public class MainController {
    private final OrganizationService organizationService;

    public MainController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("countries")
    public ResponseEntity<ApiResponse<List<CountriesResponse>>> countries() {
        List<CountriesResponse> res = organizationService.fetchCountries();
        ApiResponse<List<CountriesResponse>> response = new ApiResponse<>(
                "Countries metadata found successfully.",
                true,
                HttpStatus.OK,
                res);
        return ResponseEntity.ok(response);
    }
}
