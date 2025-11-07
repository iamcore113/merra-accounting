package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

	@Modifying
	@Transactional
	@Query("UPDATE Invoice i SET i.status = :status WHERE i.invoiceId = :invoiceId")
	int updateInvoiceStatus(
			@Param("invoiceId") UUID invoiceId,
			@Param("status") String status
	);
}
