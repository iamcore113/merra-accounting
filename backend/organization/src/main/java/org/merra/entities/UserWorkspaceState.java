package org.merra.entities;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

// Implies the context (organization) in which the user is currently operating.
// This is used to determine the current organization for a user when they have access to multiple organizations.
@Entity
@Table(name = "user_workspace_state", schema = "merra_schema")
public class UserWorkspaceState {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", unique = true, nullable = false)
    private UserAccount user;

    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "current_organization", referencedColumnName = "id")
    private Organization currentOrganization;

    @Column(name = "last_active_at")
    private OffsetDateTime lastActiveAt;

    public UUID getId() {
        return id;
    }

    public UserAccount getUser() {
        return user;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public Organization getCurrentOrganization() {
        return currentOrganization;
    }

    public void setCurrentOrganization(Organization currentOrganization) {
        this.currentOrganization = currentOrganization;
    }

    public OffsetDateTime getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(OffsetDateTime lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    public UserWorkspaceState() {
    }

    public UserWorkspaceState(UserAccount user, Organization currentOrganization) {
        this.user = user;
        this.currentOrganization = currentOrganization;
    }

    public UserWorkspaceState(UserAccount user, Organization currentOrganization, OffsetDateTime lastActiveAt) {
        this.user = user;
        this.currentOrganization = currentOrganization;
        this.lastActiveAt = lastActiveAt;
    }

}
