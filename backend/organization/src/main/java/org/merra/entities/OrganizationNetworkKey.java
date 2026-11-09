package org.merra.entities;

import java.util.UUID;

import org.merra.entities.templates.TenantAuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity(name = "OrganizationNetworkKey")
@Table(name = "organization_network_keys", uniqueConstraints = {
        @UniqueConstraint(name = "uq_org_network_keys_network_key", columnNames = { "network_key" })
})
public class OrganizationNetworkKey extends TenantAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, unique = true)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false, referencedColumnName = "id")
    @NotNull(message = "Organization cannot be null")
    private Organization organization;

    @Column(name = "network_key", nullable = false, unique = true)
    @NotBlank(message = "Network key cannot be blank")
    private String networkKey;

    @Column(name = "name")
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    public OrganizationNetworkKey() {
    }

    public OrganizationNetworkKey(Organization organization, String networkKey, String name) {
        this.organization = organization;
        this.networkKey = networkKey;
        this.name = name;
        this.isActive = Boolean.TRUE;
    }

    public UUID getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public String getNetworkKey() {
        return networkKey;
    }

    public void setNetworkKey(String networkKey) {
        this.networkKey = networkKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive != null ? isActive : Boolean.TRUE;
    }
}
