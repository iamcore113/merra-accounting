package org.merra.repositories;

import java.util.Optional;
import java.util.UUID;

import org.merra.entities.AccountCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountCategoryRepository extends JpaRepository<AccountCategory, UUID> {
	Optional<AccountCategory> findByNameIgnoreCase(String name);
}
