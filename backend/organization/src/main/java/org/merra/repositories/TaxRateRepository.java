package org.merra.repositories;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.merra.entities.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {
	
	@Query("SELECT tr FROM TaxRate tr WHERE tr.organization = :organizationID")
	Optional<TaxRate> findTaxRateByOrganization(@Param("organizationID") UUID organizationID);
	
	@Query(
			"SELECT tr.effectiveRate FROM TaxRate tr WHERE tr.organization = :organizationId" +
			" AND tr.taxType = :type"
	)
	Optional<BigDecimal> findEffectiveRateByOrganziationId(
			@Param("organizationID") UUID organizationId,
			@Param("type") String type
	);
	
	@Query(
			"SELECT tr.name FROM TaxRate tr WHERE tr.systemDefinedName = :systemDefinedName " +
			" AND tr.organization = :organizationId"
	)
	Optional<String> findBySystemDefinedNameAndOrganizationId(
			@Param("systemDefinedName") String systemDefinedName,
			@Param("organizationId") UUID organizationId
	);
}
