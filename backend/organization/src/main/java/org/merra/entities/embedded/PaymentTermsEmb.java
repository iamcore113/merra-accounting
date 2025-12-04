package org.merra.entities.embedded;

import java.io.Serializable;

import jakarta.persistence.Embeddable;

@Embeddable
public class PaymentTermsEmb implements Serializable {
    private String term;
    private Elements elements;

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    @Embeddable
    public static class Elements implements Serializable {
        private int day;
        private String type;

        public Elements() {
        }

        public Elements(int day, String type) {
            this.day = day;
            this.type = type;
        }

        public int getDay() {
            return day;
        }

        public void setDay(int day) {
            this.day = day;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

    }

    public Elements getElements() {
        return elements;
    }

    public void setElements(Elements elements) {
        this.elements = elements;
    }

}
