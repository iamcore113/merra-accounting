package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.AddressType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressTypeRepository extends JpaRepository<AddressType, UUID> {

}
