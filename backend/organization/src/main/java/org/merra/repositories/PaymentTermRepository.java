package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.PaymentTerms;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTermRepository extends JpaRepository<PaymentTerms, UUID> {

}
