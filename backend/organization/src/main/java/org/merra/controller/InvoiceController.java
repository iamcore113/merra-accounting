package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.CreateInvoiceRequest;
import org.merra.dto.InvoiceDetailResponse;
import org.merra.dto.InvoiceListResponse;
import org.merra.dto.InvoiceMetaDataResponse;
import org.merra.dto.UpdateInvoiceResponse;
import org.merra.services.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

	@GetMapping("check-invoice-number")
	public ResponseEntity<ApiResponse<Boolean>> checkInvoiceNumber(
			@RequestParam("invoiceNumber") String invoiceNumber) {
		boolean exists = invoicesService.checkInvoiceNumberExists(invoiceNumber);
		ApiResponse<Boolean> response = new ApiResponse<>();
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		response.setData(exists);
		return ResponseEntity.ok(response);
	}

	@GetMapping("all")
	public ResponseEntity<ApiResponse<List<InvoiceListResponse>>> allInvoices() {
		List<InvoiceListResponse> invoices = invoicesService.getAllInvoicesByCurrentOrganization();
		ApiResponse<List<InvoiceListResponse>> response = new ApiResponse<>();
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		response.setData(invoices);
		return ResponseEntity.ok(response);
	}

	@GetMapping("{invoiceId}")
	public ResponseEntity<ApiResponse<InvoiceDetailResponse>> getInvoice(@PathVariable("invoiceId") UUID invoiceId) {
		InvoiceDetailResponse invoice = invoicesService.getInvoiceDetail(invoiceId);
		ApiResponse<InvoiceDetailResponse> response = new ApiResponse<>();
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		response.setData(invoice);
		return ResponseEntity.ok(response);
	}

	/**
	 * This will handle invoice create requests.
	 * 
	 * @param request - accepts {@linkplain CreateInvoiceRequest} object type
	 * @return
	 */
	@PostMapping("new")
	public ResponseEntity<ApiResponse<Void>> newInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
		invoicesService.createNewInvoiceObject(request);
		ApiResponse<Void> response = new ApiResponse<>();
		response.setMessage("Invoice created successfully");
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		return ResponseEntity.ok(response);
	}

	@PutMapping("{invoiceId}")
	public ResponseEntity<ApiResponse<InvoiceDetailResponse>> updateInvoice(
			@PathVariable("invoiceId") UUID invoiceId,
			@Valid @RequestBody CreateInvoiceRequest request) {
		InvoiceDetailResponse updated = invoicesService.updateInvoice(invoiceId, request);
		ApiResponse<InvoiceDetailResponse> response = new ApiResponse<>();
		response.setMessage("Invoice updated successfully");
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		response.setData(updated);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("{invoiceId}/status")
	public ResponseEntity<ApiResponse<UpdateInvoiceResponse>> updateInvoiceStatus(
			@PathVariable("invoiceId") UUID invoiceId,
			@RequestParam("status") String status) {
		UpdateInvoiceResponse updated = invoicesService.updateInvoiceStatus(invoiceId, status);
		ApiResponse<UpdateInvoiceResponse> response = new ApiResponse<>();
		response.setMessage("Invoice status updated successfully");
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		response.setData(updated);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("{invoiceId}")
	public ResponseEntity<ApiResponse<Void>> deleteInvoice(@PathVariable("invoiceId") UUID invoiceId) {
		invoicesService.deleteInvoice(invoiceId);
		ApiResponse<Void> response = new ApiResponse<>();
		response.setMessage("Invoice deleted successfully");
		response.setSuccess(true);
		response.setResponse(HttpStatus.OK);
		return ResponseEntity.ok(response);
	}
}
