package org.merra.entities;

import java.util.UUID;

import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "countries")
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
public class Country {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String common;
    @Column(nullable = false)
    private String official;
    @Column(name = "alpha_2", nullable = false)
    private String alpha2;
    @Column(name = "alpha_3", nullable = false)
    private String alpha3;
    @Column(name = "numeric", nullable = false)
    private String numeric;
    private String symbol;
    private String code;

    public Country() {
    }

    public Country(String common, String official, String alpha2, String alpha3, String numeric, String symbol,
            String code) {
        this.common = common;
        this.official = official;
        this.alpha2 = alpha2;
        this.alpha3 = alpha3;
        this.numeric = numeric;
        this.symbol = symbol;
        this.code = code;
    }

    public UUID getId() {
        return id;
    }

    public String getCommon() {
        return common;
    }

    public void setCommon(String common) {
        this.common = common;
    }

    public String getOfficial() {
        return official;
    }

    public void setOfficial(String official) {
        this.official = official;
    }

    public String getAlpha2() {
        return alpha2;
    }

    public void setAlpha2(String alpha2) {
        this.alpha2 = alpha2;
    }

    public String getAlpha3() {
        return alpha3;
    }

    public void setAlpha3(String alpha3) {
        this.alpha3 = alpha3;
    }

    public String getNumeric() {
        return numeric;
    }

    public void setNumeric(String numeric) {
        this.numeric = numeric;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

}
