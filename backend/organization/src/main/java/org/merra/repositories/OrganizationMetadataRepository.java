package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.OrganizationMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationMetadataRepository extends JpaRepository<OrganizationMetadata, UUID> {

}
