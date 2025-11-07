package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.OrganizationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationTypeRepository extends JpaRepository<OrganizationType, UUID> {

}
