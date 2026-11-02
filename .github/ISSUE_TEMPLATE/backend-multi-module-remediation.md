# Refactor & Fix: Spring Boot Multi-Module Architecture & Scope Hygiene

## Summary
A comprehensive review of the Spring Boot backend identified multiple architectural issues, critical Maven dependency scope leaks that bundle test libraries into production runtime images, tight coupling between domain modules (`organization` -> `auth`), split-package anti-patterns, and several orphaned/dead code packages and configuration bugs.

---

## Key Problems Identified

### 1. Test Starters Leaking into Production Images (Critical)
Several test starter dependencies omit `<scope>test</scope>` (defaulting to `compile`), causing test harnesses (JUnit 6, AssertJ, ByteBuddy, Awaitility, Hamcrest, JSONassert) to be bundled directly into the production container (`backend/application/lib/`):
- `backend/commons/pom.xml`: `spring-boot-starter-data-jpa-test`
- `backend/user/pom.xml`: `spring-boot-starter-liquibase-test`
- `backend/auth/pom.xml`: `spring-boot-starter-liquibase-test`
- `backend/organization/pom.xml`: `spring-boot-starter-liquibase-test`, `spring-boot-starter-webmvc-test`

### 2. Architectural Coupling: Domain Module Depends on Auth
- `organization/pom.xml` imports `org.merra:auth` solely to call `authService.getCurrentAuthenticatedUser()`.
- Accounting domain logic should not be coupled to the authentication infrastructure.

### 3. Redundant / Unused Dependencies & Jar Bloat
- `spring-boot-starter-webflux` in `auth/pom.xml` is unused (no reactive / WebClient code) and pulls ~20MB of Netty/Reactor libraries into a Servlet/MVC application.
- `commons-text` in root POM `dependencyManagement` is unused.
- `spring-boot-starter-liquibase` in `auth/pom.xml` has no changelogs.
- `libphonenumber` in root & commons POMs is only referenced by dead phone service code.

### 4. Dead Code & Unused Packages
- `commons`:
  - `org.merra.dto.CountriesDTO` (0 usages)
  - `org.merra.validation` (`AllowedKeys`, `ValidAddressKeys`, `ValidAddressKeysValidator` - 0 usages)
  - `org.merra.services.phone` (`PhoneService`, `ProxyPhoneService`, `PhoneServiceInterface` - 0 callers; `OrganizationService` constructor accepts `PhoneService` without saving or using it)
  - `CountryNotFoundException` (never thrown)
- `organization`:
  - `OrganziationSelectionResponse` (spelling typo & 0 references)
  - `OrganizationElementResponse` & `RestCountriesRequest` (0 references)
  - `OrganizationConstants` (0 references, has typos like `CURRENY_JAPAN`)
  - Orphan `@Embeddable` classes not attached to any `@Entity`: `InvoiceSettingsEmb`, `LineItemSettingsEmb`, `OrganizationNameUpdate`, `TaxDetailEmb`
  - Unused repositories: `OrganizationMetadataRepository`, `PaymentTermRepository`, `SalesTaxBasisRepository`, `TaxComponentRepository`, `LineItemRepository`, `JournalLineRepository`, `OrganizationAddressesRepository`
  - Stub endpoint in `OrganizationMetadataController` returning `new String()`
- `user`:
  - `UserDetailResponse`, `UserAccountChangeEmailRequest` (0 references)
- `auth`:
  - `VisitorTokenResponse` (0 references)
- `main`:
  - `@RestController` and `@GetMapping` annotated directly on `Main.java`

### 5. Configuration Bugs & Security
- `backend/main/src/main/resources/ehcache.xml`: `<jsr107:defaults>` lacks the `xmlns:jsr107="http://www.ehcache.org/v3/jsr107"` namespace declaration.
- `backend/main/src/main/resources/db/changelog/db.changelog-master.xml`: `<runningAs username="brian" />` breaks runs in environments where DB user isn't `brian`.
- `backend/main/src/main/resources/application.properties`: Live API key hardcoded in `app.countries.code`.

---

## Proposed Remediation Checklist

### Phase 1: Dependency Scope & Root POM Hygiene
- [ ] Add `<scope>test</scope>` to `spring-boot-starter-data-jpa-test` in `commons/pom.xml`.
- [ ] Add `<scope>test</scope>` to `spring-boot-starter-liquibase-test` in `user/pom.xml`, `auth/pom.xml`, and `organization/pom.xml`.
- [ ] Add `<scope>test</scope>` to `spring-boot-starter-webmvc-test` in `organization/pom.xml`.
- [ ] Remove `spring-boot-starter-webflux` and `spring-boot-starter-liquibase` from `auth/pom.xml`.
- [ ] Move direct `<dependencies>` in root `pom.xml` (`springdoc-openapi-starter-webmvc-ui`, `io.netty:netty-resolver-dns-native-macos`) to `dependencyManagement` or runtime module (`main`).
- [ ] Remove unused `commons-text` from root `dependencyManagement`.

### Phase 2: Decouple `organization` from `auth`
- [ ] Create `SecurityUtils` in `commons` to retrieve the authenticated `UserAccount` from `SecurityContextHolder`.
- [ ] Update `OrganizationService` to use `SecurityUtils.getCurrentAuthenticatedUser()`.
- [ ] Remove `AuthService` and `PhoneService` parameters from `OrganizationService` constructor.
- [ ] Remove `<dependency><groupId>org.merra</groupId><artifactId>auth</artifactId></dependency>` from `organization/pom.xml`.

### Phase 3: Dead Code & Orphan Cleanup
- [ ] Remove unused classes in `commons`: `CountriesDTO`, `CountryNotFoundException`, `ValidAddressKeys`, `ValidAddressKeysValidator`, `AllowedKeys`, and `org.merra.services.phone.*`.
- [ ] Remove unused classes in `organization`: `OrganziationSelectionResponse`, `OrganizationElementResponse`, `RestCountriesRequest`, `OrganizationConstants`.
- [ ] Clean up orphan embeddables (`InvoiceSettingsEmb`, `LineItemSettingsEmb`, `TaxDetailEmb`, `OrganizationNameUpdate`).
- [ ] Remove unused DTOs in `user` (`UserDetailResponse`, `UserAccountChangeEmailRequest`) and `auth` (`VisitorTokenResponse`).
- [ ] Clean up `@RestController` and `@GetMapping` from `Main.java`.

### Phase 4: Configuration & Reliability Fixes
- [ ] Add `xmlns:jsr107="http://www.ehcache.org/v3/jsr107"` to `backend/main/src/main/resources/ehcache.xml`.
- [ ] Parameterize or remove `<runningAs username="brian" />` in `db.changelog-master.xml`.
- [ ] Parameterize `app.countries.code` with `${APP_COUNTRIES_CODE:...}` in `application.properties`.

---

## Acceptance Criteria
- [ ] Build succeeds: `./mvnw clean package -DskipTests` across all modules.
- [ ] Production JAR does not contain test dependencies (`junit`, `assertj`, `mockito`).
- [ ] `organization` has no direct dependency on `auth`.
- [ ] Application starts cleanly and OpenAPI documentation loads at `/swagger-ui.html`.
