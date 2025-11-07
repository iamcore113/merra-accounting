package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.PaymentTerms;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTermRepository extends JpaRepository<PaymentTerms, UUID> {

}
