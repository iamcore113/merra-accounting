package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.OrganizationMetaDataResponse;
import org.merra.services.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/metadata/organization/")
public class OrganizationMetadataController {
    private final OrganizationService organizationService;

    public OrganizationMetadataController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<OrganizationMetaDataResponse>> getOrganizationMetadata() {
        var res = organizationService.returnOrganizationMetaData();
        ApiResponse<OrganizationMetaDataResponse> response = new ApiResponse<>(
                "Organization metadata found successfully.",
                true,
                HttpStatus.OK,
                res);
        return ResponseEntity.ok(response);
    }

    @GetMapping("user/{userId}/metadata")
    public String getUserOrganizationMetadata(@PathVariable("userId") String userId) {
        return new String();
    }

}
