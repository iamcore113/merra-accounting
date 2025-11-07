package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.TaxComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxComponentRepository extends JpaRepository<TaxComponent, UUID> {

}
