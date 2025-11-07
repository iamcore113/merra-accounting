package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.LineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LineItemRepository extends JpaRepository<LineItem, UUID> {
	// LineAmount types
	static final String LINE_AMOUNT_TYPE_EXCLUSIVE = "EXCLUSIVE"; //Line items are exclusive of tax
	static final String LINE_AMOUNT_TYPE_INCLUSIVE = "INCLUSIVE"; //Line items are inclusive tax
	static final String LINE_AMOUNT_TYPE_NO_TAX = "NO_TAX"; //Line have no tax
}
