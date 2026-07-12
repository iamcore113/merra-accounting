package org.merra.config;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.merra.dto.CountriesCache;
import org.merra.dto.CountriesResponse;
import org.merra.entities.AccountCategory;
import org.merra.entities.AddressType;
import org.merra.entities.Country;
import org.merra.entities.InvoiceStatusCode;
import org.merra.entities.InvoiceType;
import org.merra.entities.LineAmountType;
import org.merra.entities.OrganizationType;
import org.merra.entities.TaxType;
import org.merra.entities.embedded.TaxTypesEmb;
import org.merra.repositories.AccountCategoryRepository;
import org.merra.repositories.AddressTypeRepository;
import org.merra.repositories.CountryRepository;
import org.merra.repositories.InvoiceStatusCodeRepository;
import org.merra.repositories.InvoiceTypeRepository;
import org.merra.repositories.LineAmountTypeRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.repositories.TaxTypeRepository;
import org.merra.utilities.AccountConstants;
import org.merra.utilities.RedisKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@Component
public class InitConfig implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(InitConfig.class);
    private final String restCountries;
    private final String restCountriesCode;

    private final AccountCategoryRepository accountCategoryRepository;
    private final TaxTypeRepository taxTypeRepository;
    private final OrganizationTypeRepository organizationTypeRepository;
    private final InvoiceStatusCodeRepository invoiceStatusCodeRepository;
    private final InvoiceTypeRepository invoiceTypeRepository;
    private final LineAmountTypeRepository lineAmountTypeRepository;
    private final CountryRepository countryRepository;
    private final AddressTypeRepository addressTypeRepository;
    private final RestClient restClient;
    private final RedisTemplate<String, Object> redisTemplate;

    public InitConfig(AccountCategoryRepository accountCategoryRepository,
            OrganizationTypeRepository organizationTypeRepository,
            TaxTypeRepository taxTypeRepository,
            InvoiceStatusCodeRepository invoiceStatusCodeRepository,
            InvoiceTypeRepository invoiceTypeRepository,
            LineAmountTypeRepository lineAmountTypeRepository,
            CountryRepository countryRepository,
            AddressTypeRepository addressTypeRepository,
            @Value("${app.countries.url}") String restCountries,
            @Value("${app.countries.code}") String restCountriesCode,
            RedisTemplate<String, Object> redisTemplate) {
        this.invoiceStatusCodeRepository = invoiceStatusCodeRepository;
        this.invoiceTypeRepository = invoiceTypeRepository;
        this.lineAmountTypeRepository = lineAmountTypeRepository;
        this.countryRepository = countryRepository;
        this.addressTypeRepository = addressTypeRepository;
        this.accountCategoryRepository = accountCategoryRepository;
        this.organizationTypeRepository = organizationTypeRepository;
        this.taxTypeRepository = taxTypeRepository;
        this.restCountries = restCountries;
        this.restCountriesCode = restCountriesCode;
        this.redisTemplate = redisTemplate;
        this.restClient = RestClient.builder().baseUrl(restCountries)
                .defaultHeader("Authorization", String.format("Bearer %s", restCountriesCode))
                .build();
    }

    private void seedInvoiceStatusCodes() {
        logger.debug("Seeding invoice status codes");
        if (invoiceStatusCodeRepository.findAll().isEmpty()) {
            invoiceStatusCodeRepository.saveAll(List.of(
                    new InvoiceStatusCode("DRAFT"),
                    new InvoiceStatusCode("SUBMITTED"),
                    new InvoiceStatusCode("VOID"),
                    new InvoiceStatusCode("AUTHORISED"),
                    new InvoiceStatusCode("PAID")));
        }
    }

    private void seedInvoiceTypes() {
        logger.debug("Seeding invoice types");
        if (invoiceTypeRepository.findAll().isEmpty()) {
            invoiceTypeRepository.saveAll(Set.of(
                    new InvoiceType("PAYABLE"),
                    new InvoiceType("RECEIVABLE")));
        }
    }

    private void seedLineAmountTypes() {
        logger.debug("Seeding line amount types");
        if (lineAmountTypeRepository.findAll().isEmpty()) {
            lineAmountTypeRepository.saveAll(Set.of(
                    new LineAmountType("NO_TAX"),
                    new LineAmountType("INCLUSIVE"),
                    new LineAmountType("EXCLUSIVE")));
        }
    }

    private void seedAccountCategories() {
        logger.debug("Seeding account categories");
        if (accountCategoryRepository.findAll().isEmpty()) {
            List<AccountCategory> categories = accountCategoryRepository.saveAll(Set.of(
                    new AccountCategory(AccountConstants.ACC_CATEGORY_ASSET),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_EQUITY),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_EXPENSE),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_LIABILITY),
                    new AccountCategory(AccountConstants.ACC_CATEGORY_REVENUE)));

            redisTemplate.opsForValue().set(RedisKeys.ACCOUNT_CATEGORIES, categories, RedisKeys.CONSTANT_DURATION);
        }
    }

    private void seedAddressTypes() {
        logger.debug("Seeding address types");
        if (addressTypeRepository.findAll().isEmpty()) {
            addressTypeRepository.saveAll(Set.of(
                    new AddressType("POBOX", "Post Office Box"),
                    new AddressType("STREET", "Street Address")));
        }
    }

    private void seedOrganizationTypes() {
        logger.debug("Seeding organization types");
        if (organizationTypeRepository.findAll().isEmpty()) {
            organizationTypeRepository.saveAll(Set.of(
                    new OrganizationType("INDIVIDUAL"),
                    new OrganizationType("SOLE_TRADER"),
                    new OrganizationType("PARTNERSHIP"),
                    new OrganizationType("COMPANY"),
                    new OrganizationType("TRUST"),
                    new OrganizationType("ESTATE"),
                    new OrganizationType("CLUB_OR_SOCIETY"),
                    new OrganizationType("NOT_FOR_PROFIT"),
                    new OrganizationType("GOVERNMENT_BODY"),
                    new OrganizationType("OTHER")));
        }
    }

    private void seedRestCountries() {
        if (countryRepository.findAll().isEmpty()) {
            try {
                JsonNode jsonResponse = this.restClient.get().retrieve().body(JsonNode.class);
                Set<Country> countries = new HashSet<>();
                if (jsonResponse != null) {
                    boolean philippinesPresent = false;
                    JsonNode objectsNode = jsonResponse.path("data").path("objects");
                    for (JsonNode country : objectsNode) {
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
                    List<CountriesResponse> countryList = countries.stream().map(country -> new CountriesResponse(
                            country.getId(),
                            country.getOfficial(),
                            country.getAlpha2(),
                            country.getAlpha3(),
                            country.getNumeric(),
                            country.getSymbol(),
                            country.getCode())).toList();
                    redisTemplate.opsForValue().set(RedisKeys.COUNTRY_METADATA, new CountriesCache(countryList),
                            RedisKeys.CONSTANT_DURATION);
                }
            } catch (Exception e) {
                System.err.println("Failed to seed countries from API: " + e.getMessage());
            }
        }
    }

    private void globalEditionTaxTypes() {
        if (!taxTypeRepository.existsGlobalTemplate("GLOBAL", "GL")) {
            final TaxType global = new TaxType("GLOBAL", "GL", Set.of(
                    new TaxTypesEmb("INPUT", 0.00, "Tax on purchases", null),
                    new TaxTypesEmb("NONE", 0.00, "Tax Exempt", Boolean.TRUE),
                    new TaxTypesEmb("OUTPUT", 0.00, "Tax on sales", null),
                    new TaxTypesEmb("GSTONIMPORTS", 0.00, "Sales Tax on Imports", Boolean.TRUE)));
            taxTypeRepository.save(global);
        }
    }

    private void seedTaxTypes() {
        logger.debug("Seeding tax types");
        if (taxTypeRepository.findAll().isEmpty()) {
            // When a country doesn't have its own dedicated MERRA edition (like Australia
            // or
            // the UK), MERRA gives them the Global Edition.
            globalEditionTaxTypes();
            final TaxType newZealand = new TaxType("NEW_ZEALAND", "NZ", Set.of(
                    new TaxTypesEmb("INPUT", 0.00, "Tax on purchases", null),
                    new TaxTypesEmb("NONE", 0.00, "Tax Exempt", Boolean.TRUE),
                    new TaxTypesEmb("OUTPUT", 0.00, "Tax on sales", null),
                    new TaxTypesEmb("GSTONIMPORTS", 0.00, "Sales Tax on Imports", Boolean.TRUE)));
            final TaxType australia = new TaxType("AUSTRALIA", "AU", Set.of(
                    new TaxTypesEmb("OUTPUT", 10.00, "GST on income", null),
                    new TaxTypesEmb("INPUT", 10.00, "GST on Expenses", null),
                    new TaxTypesEmb("EXEMPTEXPENSES", 0.00, "GST Free Expenses", Boolean.TRUE),
                    new TaxTypesEmb("EXEMPTOUTPUT", 0.00, "GST Free Income", null),
                    new TaxTypesEmb("BASEXCLUDED", 0.00, "BAS Excluded", null),
                    new TaxTypesEmb("GSTONIMPORTS", 0.00, "GST on Imports", Boolean.TRUE)));
            final TaxType unitedStates = new TaxType("UNITED_STATES", "US", Set.of(
                    new TaxTypesEmb("OUTPUT", 0.00, "Tax on Sales", null),
                    new TaxTypesEmb("INPUT", 0.00, "Tax on Purchases", null),
                    new TaxTypesEmb("NONE", 0.00, "Tax Exempt", Boolean.TRUE),
                    new TaxTypesEmb("GSTONIMPORTS", 0.00, "Sales Tax on Imports", Boolean.TRUE)));
            taxTypeRepository.saveAll(Set.of(newZealand, australia, unitedStates));
        }
    }

    @Override
    public void run(String... args) throws Exception {
        seedAccountCategories();
        seedOrganizationTypes();
        seedRestCountries();
        seedInvoiceStatusCodes();
        seedInvoiceTypes();
        seedLineAmountTypes();
        seedAddressTypes();
        seedTaxTypes();
    }

}
