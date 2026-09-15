package org.merra.repositories;

import java.util.Optional;
import java.util.UUID;

import org.merra.entities.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountTypeRepository extends JpaRepository<AccountType, UUID> {
	Optional<AccountType> findByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCase(String code);
}
