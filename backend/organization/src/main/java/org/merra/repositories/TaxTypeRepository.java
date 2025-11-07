package org.merra.repositories;

import java.util.Optional;
import java.util.UUID;

import org.merra.entities.TaxType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxTypeRepository extends JpaRepository<TaxType, UUID> {
	// Tax types
	static final String TAX_TYPE_OUTPUT = "OUTPUT";
	static final String TAX_TYPE_INPUT = "INPUT";
	static final String TAX_TYPE_NONE = "NONE";
	static final String TAX_TYPE_BASEEXCLUDED = "BASEEXCLUDED";
	static final String TAX_TYPE_GSTONIMPORTS = "GSTONIMPORTS";
	
	static final String COUNTRY_INELIGIBLE_FOR_TAX = """
			Unable to apply tax to this invoice because the organization's specified
			country is not yet supported within our system.
			""";
	
	static final String COUNTRY_ELIGIBLE_FOR_TAX = """
			Tax can be applied to this invoice.
			""";
	
	// query a tax type by country name - label holds a country name
	Optional<TaxType> findByLabelIgnoreCase(String label);
	
	/**
	 * This will check if a record label exists.
	 * @param label - accepts {@linkplain java.util.String} object type.
	 * @return - {@linkplain Boolean}
	 */
	Boolean existsByLabelIgnoreCase(String label);
}
