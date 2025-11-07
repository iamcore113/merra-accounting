package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {
	// Contact status
	static final String CONTACT_STATUS_ACTIVE = "ACTIVE"; // The Contact is active and can be used in transactions
	static final String CONTACT_STATUS_ARCHIVED = "ARCHIVED"; // The Contact is archived and can no longer be used in transactions
	static final String CONTACT_STATUS_GDPRREQUEST = "GDPRREQUEST"; // The Contact is the subject of a GDPR erasure request and can no longer be used in transactions
}
