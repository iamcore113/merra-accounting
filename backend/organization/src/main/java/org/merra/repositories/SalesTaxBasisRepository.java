package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.SalesTaxBasis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesTaxBasisRepository extends JpaRepository<SalesTaxBasis, UUID> {

}
