package org.merra;

import java.util.HashSet;
import java.util.Set;

import org.merra.entities.AccountCategory;
import org.merra.entities.Country;
import org.merra.repositories.AccountCategoryRepository;
import org.merra.repositories.CountryRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.utilities.AccountConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;

@Component
public class InitConfig implements CommandLineRunner {

    private final String restCountries;
    private final String restCountriesCode;

    private final AccountCategoryRepository accountCategoryRepository;
    private final OrganizationTypeRepository organizationTypeRepository;
    private final CountryRepository countryRepository;
    private final RestClient restClient;

    public InitConfig(AccountCategoryRepository accountCategoryRepository,
            OrganizationTypeRepository organizationTypeRepository,
            CountryRepository countryRepository,
            @Value("${app.countries.url}") String restCountries,
            @Value("${app.countries.code}") String restCountriesCode) {
        this.countryRepository = countryRepository;
        this.accountCategoryRepository = accountCategoryRepository;
        this.organizationTypeRepository = organizationTypeRepository;
        this.restCountries = restCountries;
        this.restCountriesCode = restCountriesCode;
        this.restClient = RestClient.builder().baseUrl(restCountries)
                .defaultHeader("Authorization", String.format("Bearer %s", restCountriesCode))
                .build();
    }

    private void seedAccountCategories() {
        if (accountCategoryRepository.findAll().isEmpty()) {
            accountCategoryRepository.saveAll(Set.of(
                    new AccountCategory(AccountConstants.ACC_CATEGORY_ASSET),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_EQUITY),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_EXPENSE),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_LIABILITY),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_REVENUE)));
        }
    }

    private void seedOrganizationTypes() {
        if (organizationTypeRepository.findAll().isEmpty()) {
            organizationTypeRepository.saveAll(Set.of(
                    new org.merra.entities.OrganizationType("INDIVIDUAL"),
                    new org.merra.entities.OrganizationType("SOLE_TRADER"),
                    new org.merra.entities.OrganizationType("PARTNERSHIP"),
                    new org.merra.entities.OrganizationType("COMPANY"),
                    new org.merra.entities.OrganizationType("TRUST"),
                    new org.merra.entities.OrganizationType("ESTATE"),
                    new org.merra.entities.OrganizationType("CLUB_OR_SOCIETY"),
                    new org.merra.entities.OrganizationType("NOT_FOR_PROFIT"),
                    new org.merra.entities.OrganizationType("GOVERNMENT_BODY"),
                    new org.merra.entities.OrganizationType("OTHER")));
        }
    }

    private void seedRestCountries() {
        try {
            JsonNode jsonResponse = this.restClient.get().retrieve().body(JsonNode.class);
            if (jsonResponse == null || !jsonResponse.isArray()) {
                System.err.println("RestCountries API returned non-array response or null: " + jsonResponse);
                if (countryRepository.findAll().isEmpty()) {
                    countryRepository.save(new Country("Philippines", "Philippines", "PH", "PHL", "608", "₱", "PHP"));
                }
                return;
            }
            Set<Country> countries = new HashSet<>();
            boolean philippinesPresent = false;
            for (JsonNode country : jsonResponse) {
                String common = country.path("names").path("common").asString();
                String official = country.path("names").path("official").asString();
                String alpha2 = country.path("codes").path("alpha_2").asString();
                String alpha3 = country.path("codes").path("alpha_3").asString();
                String numeric = country.path("codes").path("ccn3").asString();

                if (common.isEmpty() || alpha2.isEmpty()) {
                    continue;
                }

                JsonNode currencies = country.path("currencies");
                String code = "";
                String symbol = "";
                if (currencies.isArray() && !currencies.isEmpty()) {
                    JsonNode firstCurrency = currencies.get(0);
                    code = firstCurrency.path("code").asString();
                    symbol = firstCurrency.path("symbol").asString();
                }
                if ("PH".equalsIgnoreCase(alpha2) || "PHL".equalsIgnoreCase(alpha3)) {
                    philippinesPresent = true;
                }
                countries.add(new Country(common, official, alpha2, alpha3, numeric, symbol, code));
            }
            if (!philippinesPresent) {
                countries.add(new Country("Philippines", "Philippines", "PH", "PHL", "608", "₱", "PHP"));
            }
            countryRepository.saveAll(countries);
        } catch (Exception e) {
            System.err.println("Failed to seed countries from API: " + e.getMessage());
            if (countryRepository.findAll().isEmpty()) {
                countryRepository.save(new Country("Philippines", "Philippines", "PH", "PHL", "608", "₱", "PHP"));
            }
        }
    }

    @Override
    public void run(String... args) throws Exception {
        seedAccountCategories();
        seedOrganizationTypes();
        seedRestCountries();
    }

}
