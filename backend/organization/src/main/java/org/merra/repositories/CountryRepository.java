package org.merra.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

import org.merra.entities.Country;

public interface CountryRepository extends JpaRepository<Country, UUID> {

}
