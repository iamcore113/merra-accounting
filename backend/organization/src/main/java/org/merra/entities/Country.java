package org.merra.entities;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "countries")
public class Country implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String common;
    @Column(nullable = false)
    private String official;
    @Column(name = "alpha_2")
    private String alpha2;
    @Column(name = "alpha_3")
    private String alpha3;
    @Column(name = "\"numeric\"")
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
