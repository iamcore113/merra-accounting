package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.AcceptInvitationRequest;
import org.merra.dto.AcceptInvitationResponse;
import org.merra.dto.CreateInvitationRequest;
import org.merra.dto.InvitationResponse;
import org.merra.dto.RegisterAndAcceptInvitationRequest;
import org.merra.dto.VerifyInvitationResponse;
import org.merra.services.OrganizationInvitationService;
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

import jakarta.validation.Valid;

@RestController
@RequestMapping("api/business/organization/invitation/")
public class OrganizationInvitationController {

    private final OrganizationInvitationService invitationService;

    public OrganizationInvitationController(OrganizationInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getInvitations() {
        List<InvitationResponse> invitations = invitationService.getOrganizationInvitations();
        ApiResponse<List<InvitationResponse>> response = new ApiResponse<>(
                "Active organization invitations retrieved successfully.",
                true,
                HttpStatus.OK,
                invitations);
        return ResponseEntity.ok(response);
    }

    @PostMapping("create")
    public ResponseEntity<ApiResponse<InvitationResponse>> createInvitation(
            @Valid @RequestBody CreateInvitationRequest request) {
        InvitationResponse created = invitationService.createInvitation(request);
        String msg = created.emailSent()
                ? "Invitation created and sent to " + created.inviteeEmail() + "."
                : "Invitation token generated successfully.";
        ApiResponse<InvitationResponse> response = new ApiResponse<>(
                msg,
                true,
                HttpStatus.CREATED,
                created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<ApiResponse<Void>> revokeInvitation(@PathVariable("id") UUID id) {
        invitationService.revokeInvitation(id);
        ApiResponse<Void> response = new ApiResponse<>(
                "Invitation revoked successfully.",
                true,
                HttpStatus.OK,
                null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("verify")
    public ResponseEntity<ApiResponse<VerifyInvitationResponse>> verifyInvitation(
            @RequestParam("token") String token) {
        VerifyInvitationResponse result = invitationService.verifyInvitationToken(token);
        ApiResponse<VerifyInvitationResponse> response = new ApiResponse<>(
                result.message(),
                result.valid(),
                result.valid() ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
                result);
        return ResponseEntity.status(result.valid() ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("accept")
    public ResponseEntity<ApiResponse<AcceptInvitationResponse>> acceptInvitation(
            @Valid @RequestBody AcceptInvitationRequest request) {
        AcceptInvitationResponse result = invitationService.acceptInvitation(request.token());
        ApiResponse<AcceptInvitationResponse> response = new ApiResponse<>(
                result.message(),
                true,
                HttpStatus.OK,
                result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("register-and-accept")
    public ResponseEntity<ApiResponse<AcceptInvitationResponse>> registerAndAcceptInvitation(
            @Valid @RequestBody RegisterAndAcceptInvitationRequest request) {
        AcceptInvitationResponse result = invitationService.registerAndAcceptInvitation(request);
        ApiResponse<AcceptInvitationResponse> response = new ApiResponse<>(
                result.message(),
                true,
                HttpStatus.CREATED,
                result);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
