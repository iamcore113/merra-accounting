package org.merra.services;

import org.merra.dto.InvoiceTaxEligibilityResponse;
import org.merra.entities.Organization;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.TaxTypeRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;

@Service
public class TaxService {

    private final TaxTypeRepository taxTypeRepository;
    private final UserWorkspaceStateRepository userWorkspaceStateRepository;

    public TaxService(TaxTypeRepository taxTypeRepository, UserWorkspaceStateRepository userWorkspaceStateRepository) {
        this.taxTypeRepository = taxTypeRepository;
        this.userWorkspaceStateRepository = userWorkspaceStateRepository;
    }

    /**
     * When the user creates an invoice (e.g. clicks the button for creating
     * new invoice) a request (GET) will be sent and this will be the response.
     * This method checks if tax can be applied to the invoice base on the
     * organization's country code.
     * 
     * @return - {@linkplain InvoiceTaxEligibilityResponse} object type.
     */
    public InvoiceTaxEligibilityResponse taxEligibility() {
        final Organization currentOrganization = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
        final String organizationCountryCode = currentOrganization.getCountry();
        Boolean isEligible = taxTypeRepository.existsByCountryCodeIgnoreCase(organizationCountryCode);

        InvoiceTaxEligibilityResponse taxEligibility = new InvoiceTaxEligibilityResponse(currentOrganization.getId(),
                isEligible);
        if (isEligible)
            taxEligibility.setMessage(TaxTypeRepository.COUNTRY_ELIGIBLE_FOR_TAX);
        else
            taxEligibility.setMessage(TaxTypeRepository.COUNTRY_INELIGIBLE_FOR_TAX);

        return taxEligibility;
    }
}
