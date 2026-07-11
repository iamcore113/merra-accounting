package org.merra.controller;

import org.merra.api.ApiResponse;
import org.merra.dto.InvoiceTaxEligibilityResponse;
import org.merra.services.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("api/business/tax/")
@RestController
public class TaxController {
    private final InvoiceService invoicesService;

    public TaxController(InvoiceService invoicesService) {
        this.invoicesService = invoicesService;
    }

    // TODO: NEXT work on this one
    /**
     * When the user creates an invoice (e.g. clicks the button for creating
     * new invoice) a request will be sent to this and this will be the response.
     * 
     * @return - {@linkplain ResponseEntity} object type that holds
     *         {@linkplain ApiResponse} type.
     */
    @GetMapping("eligibility")
    public ResponseEntity<ApiResponse<InvoiceTaxEligibilityResponse>> checkInvoiceTaxEligibility() {
        ApiResponse<InvoiceTaxEligibilityResponse> response = new ApiResponse<>();
        InvoiceTaxEligibilityResponse invoiceTaxEligibility = invoicesService.taxEligibility();
        response.setData(invoiceTaxEligibility);
        return ResponseEntity.ok(response);
    }
}
