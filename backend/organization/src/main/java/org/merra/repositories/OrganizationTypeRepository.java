package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.OrganizationType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationTypeRepository extends JpaRepository<OrganizationType, UUID> {

}
