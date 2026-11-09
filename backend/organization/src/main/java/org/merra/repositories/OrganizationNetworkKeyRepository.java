package org.merra.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.merra.entities.OrganizationNetworkKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationNetworkKeyRepository extends JpaRepository<OrganizationNetworkKey, UUID> {

    @Query("""
            SELECT k
            FROM OrganizationNetworkKey k
            WHERE k.organization.id = :organizationId
              AND k.isActive = true
            ORDER BY k.createdAt DESC
            """)
    List<OrganizationNetworkKey> findActiveKeysByOrganizationId(UUID organizationId);

    @Query("""
            SELECT k
            FROM OrganizationNetworkKey k
            JOIN FETCH k.organization o
            WHERE k.networkKey = :networkKey
              AND k.isActive = true
            """)
    Optional<OrganizationNetworkKey> findByNetworkKeyAndIsActiveTrue(String networkKey);

    Optional<OrganizationNetworkKey> findByNetworkKey(String networkKey);

    @Query("""
            SELECT k
            FROM OrganizationNetworkKey k
            WHERE k.id = :keyId
              AND k.organization.id = :organizationId
            """)
    Optional<OrganizationNetworkKey> findByIdAndOrganizationId(UUID keyId, UUID organizationId);

    @Query("""
            SELECT COUNT(k) > 0
            FROM OrganizationNetworkKey k
            WHERE k.organization.id = :organizationId
              AND k.networkKey = :networkKey
              AND k.isActive = true
            """)
    boolean existsActiveKeyForOrganization(UUID organizationId, String networkKey);
}
