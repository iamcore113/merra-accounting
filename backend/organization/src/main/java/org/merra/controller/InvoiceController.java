package org.merra.controller;

import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateInvoiceRequest;
import org.merra.dto.InvoiceTaxEligibility;
import org.merra.services.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("api/v1/business/organization/")
public class InvoiceController {
	private final InvoiceService invoicesService;

	public InvoiceController(InvoiceService invoicesService) {
		this.invoicesService = invoicesService;
	}

	@GetMapping
	public String getMethodName() {
		return new String("Hello world");
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
	public ResponseEntity<ApiResponse> checkInvoiceTaxEligibility(
			@PathVariable("organizationId") UUID organizationId) {
		ApiResponse response = new ApiResponse();

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
	@PostMapping(path = "{organizationId}/invoice/create")
	public ResponseEntity<?> create(
			@PathVariable("organizationId") UUID organizationId,
			@Valid @RequestBody CreateInvoiceRequest request) {
		return null;
	}
}
