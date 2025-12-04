package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

@Embeddable
public class FinancialYearEmb implements Serializable {
    private int yearEndDay;
    private int yearEndMonth;

    public FinancialYearEmb(int yearEndDay, int yearEndMonth) {
        this.yearEndDay = yearEndDay;
        this.yearEndMonth = yearEndMonth;
    }

    public int getYearEndDay() {
        return yearEndDay;
    }

    public void setYearEndDay(int yearEndDay) {
        this.yearEndDay = yearEndDay;
    }

    public int getYearEndMonth() {
        return yearEndMonth;
    }

    public void setYearEndMonth(int yearEndMonth) {
        this.yearEndMonth = yearEndMonth;
    }

}
