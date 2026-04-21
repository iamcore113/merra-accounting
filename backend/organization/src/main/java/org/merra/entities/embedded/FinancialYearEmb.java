
package org.merra.entities.embedded;

import java.io.Serializable;

/**
 * Embeddable class representing the end of a financial year.
 * Stores the day and month when the financial year ends.
 */
public class FinancialYearEmb implements Serializable {
    /**
     * The day of the month when the financial year ends (1-31).
     */
    private int yearEndDay;

    /**
     * The month when the financial year ends (1-12).
     */
    private int yearEndMonth;

    /**
     * Default constructor.
     */
    public FinancialYearEmb() {
    }

    /**
     * Constructs a FinancialYearEmb with the specified end day and month.
     *
     * @param yearEndDay   the day of the month when the financial year ends
     * @param yearEndMonth the month when the financial year ends
     */
    public FinancialYearEmb(int yearEndDay, int yearEndMonth) {
        this.yearEndDay = yearEndDay;
        this.yearEndMonth = yearEndMonth;
    }

    /**
     * Gets the day of the month when the financial year ends.
     *
     * @return the year end day
     */
    public int getYearEndDay() {
        return yearEndDay;
    }

    /**
     * Sets the day of the month when the financial year ends.
     *
     * @param yearEndDay the year end day to set
     */
    public void setYearEndDay(int yearEndDay) {
        this.yearEndDay = yearEndDay;
    }

    /**
     * Gets the month when the financial year ends.
     *
     * @return the year end month
     */
    public int getYearEndMonth() {
        return yearEndMonth;
    }

    /**
     * Sets the month when the financial year ends.
     *
     * @param yearEndMonth the year end month to set
     */
    public void setYearEndMonth(int yearEndMonth) {
        this.yearEndMonth = yearEndMonth;
    }

}
