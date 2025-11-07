package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, UUID> {

}
