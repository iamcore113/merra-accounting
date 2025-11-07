package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.OrganizationSettings;
import org.merra.entities.embedded.InvoiceSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationSettingsRepository extends JpaRepository<OrganizationSettings, UUID> {
	@Query("SELECT os.invoiceSettings FROM OrganizationSettings os WHERE os.organization.id = :orgnUuid")
	InvoiceSettings findSettingsByOrganizationId(@Param("organizationID") UUID orgnUuid);
}
