package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.InvoiceStatusCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceStatusCodeRepository extends JpaRepository<InvoiceStatusCode, UUID> {
}
