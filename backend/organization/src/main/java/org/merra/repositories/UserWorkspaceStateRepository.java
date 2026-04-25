package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.Organization;
import org.merra.entities.UserWorkspaceState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserWorkspaceStateRepository extends JpaRepository<UserWorkspaceState, UUID> {
    @Query("select w.organization from UserWorkspaceState w where w.user.userId = ?#{ principal?.id }")
    Organization findCurrentOrganizationByPrincipal();
}
