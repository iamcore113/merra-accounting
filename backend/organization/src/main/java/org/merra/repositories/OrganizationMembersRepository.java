package org.merra.repositories;

import java.util.List;
import java.util.UUID;

import org.merra.entities.OrganizationMembers;
import org.merra.entities.UserAccount;
import org.merra.repositories.projections.OrganizationsOnly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationMembersRepository extends JpaRepository<OrganizationMembers, UUID> {
	
	@Query("SELECT DISTINCT om.organization AS organization " +
	       "FROM OrganizationMembers om " +
	       "WHERE om.user = :user")
	List<OrganizationsOnly> findByOrganizationByUser(@Param("user") UserAccount user);
}