package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateInvoiceRequest;
import org.merra.dto.InvoiceMetaDataResponse;
import org.merra.services.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("api/business/invoice/")
public class InvoiceController {
	private final InvoiceService invoicesService;

	public InvoiceController(InvoiceService invoicesService) {
		this.invoicesService = invoicesService;
	}

	@GetMapping(path = "metadata")
	public ResponseEntity<ApiResponse<InvoiceMetaDataResponse>> metadata() {
		InvoiceMetaDataResponse metadata = invoicesService.metadata();
		ApiResponse<InvoiceMetaDataResponse> response = new ApiResponse<>(
				"Invoice metadata retrieved successfully.",
				true,
				HttpStatus.OK,
				metadata);
		return ResponseEntity.ok(response);
	}

	/**
	 * This will handle invoice create requests.
	 * 
	 * @param request - accepts {@linkplain CreateInvoiceRequest} object type
	 * @return
	 */
	@PostMapping("new")
	public ResponseEntity<?> newInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
		return null;
	}
}
