package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.LineAmountType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LineAmountTypeRepository extends JpaRepository<LineAmountType, UUID> {
}
