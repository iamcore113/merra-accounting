package org.merra.repositories;

import org.merra.entities.FixedAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FixedAssetRepository extends JpaRepository<FixedAsset, java.util.UUID> {
}
