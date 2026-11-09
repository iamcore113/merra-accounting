package org.merra.controller;

import java.util.List;
import java.util.UUID;

import org.merra.api.ApiResponse;
import org.merra.dto.JournalResponse;
import org.merra.services.JournalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only controller for retrieving accounting journal entries recorded by the system.
 */
@RestController
@RequestMapping("api/business/journal/")
public class JournalController {
	private final JournalService journalService;

	public JournalController(JournalService journalService) {
		this.journalService = journalService;
	}

	@GetMapping("all")
	public ResponseEntity<ApiResponse<List<JournalResponse>>> getAllJournals() {
		List<JournalResponse> journals = journalService.getAllJournalsByCurrentOrganization();
		ApiResponse<List<JournalResponse>> response = new ApiResponse<>(
				"Journals retrieved successfully.",
				true,
				HttpStatus.OK,
				journals);
		return ResponseEntity.ok(response);
	}

	@GetMapping("{journalId}")
	public ResponseEntity<ApiResponse<JournalResponse>> getJournalById(
			@PathVariable("journalId") UUID journalId) {
		JournalResponse journal = journalService.getJournalById(journalId);
		ApiResponse<JournalResponse> response = new ApiResponse<>(
				"Journal retrieved successfully.",
				true,
				HttpStatus.OK,
				journal);
		return ResponseEntity.ok(response);
	}

	@GetMapping("invoice/{invoiceId}")
	public ResponseEntity<ApiResponse<List<JournalResponse>>> getJournalsByInvoiceId(
			@PathVariable("invoiceId") UUID invoiceId) {
		List<JournalResponse> journals = journalService.getJournalsByInvoiceId(invoiceId);
		ApiResponse<List<JournalResponse>> response = new ApiResponse<>(
				"Invoice journals retrieved successfully.",
				true,
				HttpStatus.OK,
				journals);
		return ResponseEntity.ok(response);
	}
}
