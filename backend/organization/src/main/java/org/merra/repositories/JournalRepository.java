package org.merra.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.merra.entities.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalRepository extends JpaRepository<Journal, UUID> {

	@Query("SELECT DISTINCT j FROM Journal j " +
			"LEFT JOIN FETCH j.journalLines " +
			"LEFT JOIN FETCH j.invoice inv " +
			"LEFT JOIN FETCH inv.contact " +
			"LEFT JOIN FETCH inv.type " +
			"WHERE j.organization.id = :organizationId " +
			"ORDER BY j.journalDate DESC, j.journalNumber DESC")
	List<Journal> findAllByOrganizationIdOrderByDateDesc(@Param("organizationId") UUID organizationId);

	@Query("SELECT DISTINCT j FROM Journal j " +
			"LEFT JOIN FETCH j.journalLines " +
			"LEFT JOIN FETCH j.invoice inv " +
			"LEFT JOIN FETCH inv.contact " +
			"LEFT JOIN FETCH inv.type " +
			"WHERE j.journalId = :journalId AND j.organization.id = :organizationId")
	Optional<Journal> findByJournalIdAndOrganizationId(
			@Param("journalId") UUID journalId,
			@Param("organizationId") UUID organizationId);

	@Query("SELECT DISTINCT j FROM Journal j " +
			"LEFT JOIN FETCH j.journalLines " +
			"LEFT JOIN FETCH j.invoice inv " +
			"LEFT JOIN FETCH inv.contact " +
			"LEFT JOIN FETCH inv.type " +
			"WHERE j.invoice.invoiceId = :invoiceId AND j.organization.id = :organizationId " +
			"ORDER BY j.journalDate DESC, j.journalNumber DESC")
	List<Journal> findByInvoiceIdAndOrganizationId(
			@Param("invoiceId") UUID invoiceId,
			@Param("organizationId") UUID organizationId);

	@Query("SELECT COUNT(j) > 0 FROM Journal j WHERE j.invoice.invoiceId = :invoiceId")
	boolean existsByInvoiceId(@Param("invoiceId") UUID invoiceId);
}
