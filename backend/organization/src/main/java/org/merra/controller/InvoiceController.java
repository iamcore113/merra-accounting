package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateInvoiceRequest;
import org.merra.dto.InvoiceMetaDataResponse;
import org.merra.dto.InvoiceTaxEligibility;
import org.merra.services.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
	 * When the user creates an invoice (e.g. clicks the button for creating
	 * new invoice) a request will be sent to this and this will be the response.
	 * 
	 * @param organizationId - accepts {@linkplain java.util.UUID} object type.
	 * @return - {@linkplain ResponseEntity} object type that holds
	 *         {@linkplain ApiResponse} type.
	 */
	@GetMapping(path = "{organizationId}/invoice/tax/eligibility")
	public ResponseEntity<ApiResponse<InvoiceTaxEligibility>> checkInvoiceTaxEligibility(
			@PathVariable("organizationId") UUID organizationId) {
		ApiResponse<InvoiceTaxEligibility> response = new ApiResponse<>();

		InvoiceTaxEligibility invoiceTaxEligibility = invoicesService.taxEligibility(organizationId);

		response.setData(invoiceTaxEligibility);
		return ResponseEntity.ok(response);
	}

	/**
	 * This will handle invoice create requests.
	 * 
	 * @param organizationId - accepts {@linkplain java.util.UUID} object type
	 * @param request        - accepts {@linkplain CreateInvoiceRequest} object type
	 * @return
	 */
	@PostMapping(path = "new")
	public ResponseEntity<?> newInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
		return null;
	}
}
