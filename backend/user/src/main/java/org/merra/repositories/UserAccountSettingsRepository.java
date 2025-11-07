package org.merra.repositories;

import java.util.UUID;

import org.merra.entities.UserAccountSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAccountSettingsRepository extends JpaRepository<UserAccountSettings, UUID> {

}
