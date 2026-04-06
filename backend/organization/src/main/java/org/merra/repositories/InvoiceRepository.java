package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.Invoice;
import org.merra.entities.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

	/**
	 * Updates the status of a specific invoice identified by its ID.
	 * Returns the number of rows affected (1 if successful, 0 if invoice not found).
	 *
	 * @param invoiceId The UUID of the invoice to update
	 * @param status    The new status to set (e.g., "DRAFT", "SUBMITTED", "AUTHORISED")
	 * @return The number of rows updated
	 */
	@Modifying
	@Transactional
	@Query("UPDATE Invoice i SET i.status = :status WHERE i.invoiceId = :invoiceId")
	int updateInvoiceStatus(
			@Param("invoiceId") UUID invoiceId,
			@Param("status") String status);
	
	/**
	 * Counts the number of invoices with a given status for a specific organization.
	 * Used to populate the organization dashboard with invoice status breakdowns.
	 *
	 * @param status       The invoice status to filter by (e.g., "DRAFT", "SUBMITTED", "AUTHORISED")
	 * @param organization The organization entity to scope the count to
	 * @return The total number of invoices matching the status and organization
	 */
	@Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status AND i.organization = :organization")
	Integer countInvoiceStatusByOrganization(String status, Organization organization);
	
	/**
	 * Retrieves the next value from the invoice_num_seq database sequence.
	 * Used to generate unique, sequential invoice numbers.
	 *
	 * @return The next available invoice sequence number
	 */
	@Query(value = "SELECT nextval('invoice_num_seq')", nativeQuery = true)
    Long getNextInvoiceSequence();
}
