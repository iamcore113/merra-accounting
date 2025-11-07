package org.merra.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/* Create and Manage assets */
@Entity
@Table(name = "fixed_assets")
public class FixedAsset {
    @Id @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    private UUID id;

    @Column(name = "asset_type_name", nullable = false)
    @NotBlank(message = "assetTypeName attribute is cannot be blank.")
    private String assetTypeName;

    @OneToOne(cascade = jakarta.persistence.CascadeType.ALL)
    @JoinColumn(name = "fixed_asset_account_id", referencedColumnName = "account_id", nullable = false)
    @NotNull(message = "fixedAssetAccount attribute cannot be null.")
    private Account fixedAssetAccount;

}
