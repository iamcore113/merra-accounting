package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.OrganizationMembers;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationMembersRepository extends JpaRepository<OrganizationMembers, UUID> {

}
