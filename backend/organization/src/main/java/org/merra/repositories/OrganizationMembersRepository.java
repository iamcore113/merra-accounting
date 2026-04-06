package org.merra.repositories;

import java.util.List;
import java.util.UUID;

import org.merra.entities.OrganizationMembers;
import org.merra.entities.UserAccount;
import org.merra.repositories.projections.OrganizationsOnly;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationMembersRepository extends JpaRepository<OrganizationMembers, UUID> {
	List<OrganizationsOnly> findByOrganizationByUser(UserAccount user);
}
