package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.InvoiceType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceTypeRepository extends JpaRepository<InvoiceType, UUID> {

}
