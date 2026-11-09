package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.GenerateNetworkKeyRequest;
import org.merra.dto.NetworkKeyResponse;
import org.merra.dto.ResolveNetworkKeyResponse;
import org.merra.services.NetworkKeyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/business/network-key/")
public class NetworkKeyController {

    private final NetworkKeyService networkKeyService;

    public NetworkKeyController(NetworkKeyService networkKeyService) {
        this.networkKeyService = networkKeyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NetworkKeyResponse>>> getActiveKeys() {
        List<NetworkKeyResponse> keys = networkKeyService.getOrganizationKeys();
        ApiResponse<List<NetworkKeyResponse>> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setResponse(HttpStatus.OK);
        response.setMessage("Active network keys retrieved successfully");
        response.setData(keys);
        return ResponseEntity.ok(response);
    }

    @PostMapping("generate")
    public ResponseEntity<ApiResponse<NetworkKeyResponse>> generateKey(
            @RequestBody(required = false) GenerateNetworkKeyRequest request) {
        String name = request != null ? request.name() : null;
        NetworkKeyResponse key = networkKeyService.generateNetworkKey(name);
        ApiResponse<NetworkKeyResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setResponse(HttpStatus.CREATED);
        response.setMessage("Network key generated successfully");
        response.setData(key);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKey(@PathVariable("id") UUID keyId) {
        networkKeyService.deleteNetworkKey(keyId);
        ApiResponse<Void> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setResponse(HttpStatus.OK);
        response.setMessage("Network key deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("resolve")
    public ResponseEntity<ApiResponse<ResolveNetworkKeyResponse>> resolveKey(
            @RequestParam("key") String networkKey) {
        ResolveNetworkKeyResponse result = networkKeyService.resolveNetworkKey(networkKey);
        ApiResponse<ResolveNetworkKeyResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setResponse(HttpStatus.OK);
        response.setMessage(result.message());
        response.setData(result);
        return ResponseEntity.ok(response);
    }
}
