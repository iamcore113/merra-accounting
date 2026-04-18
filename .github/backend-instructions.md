## merra-accounting — Backend Instructions (Java/Spring Boot)

This file provides concise, actionable facts for AI coding agents working on the merra-accounting backend.

---

## Backend Overview

- Multi-module Maven backend under `backend/` (Java 25, Spring Boot 4.0.5).
- Top-level modules (declared in [`backend/pom.xml`](backend/pom.xml)): `main`, `auth`, `commons`, `user`, `organization`.
- `main` is the Spring Boot application and depends on the other modules (see [`backend/main/pom.xml`](backend/main/pom.xml)).
- Runtime startup is optimized with Spring Boot AOT enabled (Ahead-of-Time Processing) and a generated JVM AOT cache.

### Quick Architecture Summary

- `main`: Spring Boot app (web, JPA, Liquibase). Entrypoint and runtime app logic.
- `auth`, `user`, `organization`, `commons`: domain or shared libraries packaged as Maven modules and included as dependencies in `main`.
- DB migrations: Liquibase change-logs referenced from [`backend/main/src/main/resources/db/changelog/db.changelog-master.xml`](backend/main/src/main/resources/db/changelog/db.changelog-master.xml) (see [`application.yaml`](backend/main/src/main/resources/application.yaml)).

---

## Build & Run (Developer Workflows)

- Build entire backend (macOS/Linux):
  - `cd backend; ./mvnw clean package`
- Build entire backend (Windows PowerShell):
  - `cd backend; .\mvnw.cmd clean package`
- Run only the `main` app (rebuild modules it depends on, macOS/Linux):
  - `cd backend; ./mvnw -pl main -am spring-boot:run`
  - `-pl` = project list, `-am` = also make required modules
- Run only the `main` app (Windows PowerShell):
  - `cd backend; .\mvnw.cmd -pl main -am spring-boot:run`
- Run packaged app with AOT extraction/cache script (macOS/Linux):
  - `cd backend; ./mvnw -pl main -am clean package`
  - `./run-main-jar.sh`
  - The script validates `main/.env`, extracts the built JAR into `backend/application/` (`main-1.0-SNAPSHOT.jar`), generates/refreshes `backend/application/app.aot`, then starts with `-XX:AOTCache` and `-Dspring.aot.enabled=true`.
- Run tests for a specific module:
  - `cd backend; ./mvnw -pl main test` (or replace `main` with `auth`, `user`, ...)
- Local DB via Docker Compose (for `main`):
  - `docker compose -f backend/main/compose.yaml up -d` (exposes Postgres at host:5070 by default)

---

## Environment and Configuration

- [`backend/main/src/main/resources/application.yaml`](backend/main/src/main/resources/application.yaml) uses environment variables for DB and JWT secrets (examples):
  - `DB_URL` (used for `spring.datasource.url` and liquibase.url)
  - `JWT_TOKEN_SECRET` / `JWT_ACCESS_TOKEN_DURATION` etc.
- Tests and surefire: [`backend/pom.xml`](backend/pom.xml) sets surefire system properties from environment variables (DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET). Provide those when running CI/tests.
- The project uses `me.paulschwarz:spring-dotenv` to load .env-style variables.

---

## Key Patterns & Developer Notes

- MapStruct: annotation processing is configured in [`backend/pom.xml`](backend/pom.xml) via maven-compiler-plugin; generated mappers live in target/generated-sources/annotations.
- SpringDoc/OpenAPI available (path configured to `/api-docs` in [`application.yaml`](backend/main/src/main/resources/application.yaml)).
- Liquibase: changeLog location referenced in [`application.yaml`](backend/main/src/main/resources/application.yaml) at `db/changelog/db.changelog-master.xml` — edit that file to add DB changesets.
- AOT packaging/run helper: [`backend/run-main-jar.sh`](backend/run-main-jar.sh) keeps `backend/application/` in sync with the latest `main/target/main-1.0-SNAPSHOT.jar`, regenerating extraction and cache when inputs are newer.
- Adding a module: add `<module>your-module</module>` to [`backend/pom.xml`](backend/pom.xml) and ensure its POM has `<parent>` pointing to `backend`.

---

## Where to Look First

- [`backend/pom.xml`](backend/pom.xml) — parent POM, Java version, dependencyManagement, modules list.
- [`backend/main/pom.xml`](backend/main/pom.xml) — runtime app dependencies and spring-boot plugin.
- [`backend/main/src/main/resources/application.yaml`](backend/main/src/main/resources/application.yaml) — runtime properties, env var names, Liquibase path.
- [`backend/main/compose.yaml`](backend/main/compose.yaml) — local Postgres + Adminer for development.

---

## Constraints & Expectations for Code Changes

- Preserve module boundaries; most runtime code lives under `backend/main/src/main/java/org/merra` and shared code under other module sources.
- Prefer changing Liquibase changelogs rather than programmatic schema DDL; `spring.jpa.hibernate.ddl-auto` is set to `none` in config.
- Mind annotation processors (MapStruct) — ensure generated sources compile.

---

## Example: Build & Run Main with Local DB (macOS/Linux)

```bash
cd backend
docker compose -f main/compose.yaml up -d
export DB_URL='jdbc:postgresql://127.0.0.1:5070/merradb'
./mvnw -pl main -am spring-boot:run
```

---

## Example: Build & Run Main with Local DB (Windows PowerShell)

```powershell
cd backend
docker compose -f main/compose.yaml up -d
$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5070/merradb'
.\mvnw.cmd -pl main -am spring-boot:run
```

---

## If You Need More Context

- Read module-level tests under each module's `src/test/java` to learn domain specifics.
- Search for `db/changelog` to find Liquibase changesets.

---

## Java/Spring Boot Documentation Rules

When the user provides the trigger "generate comment" for a highlighted code block, follow these specific formatting and content rules:

### 1. Comment Style

- Always use standard **JavaDoc format** (`/** ... */`).
- Maintain the existing indentation of the highlighted code.
- Use active, descriptive verbs (e.g., "Retrieves," "Calculates," "Persists") rather than "This method is for..."

### 2. Method Documentation Requirements

If the code is a method, include the following tags:

- **Description**: A clear, one-sentence summary of what the method achieves within the Spring context.
- **@param**: One entry for every parameter, including a brief description of its role.
- **@return**: A description of the return value and its type.
- **@throws**: (If applicable) Mention common exceptions like `ResourceNotFoundException` or `DataAccessException`.

### 3. Class/Component Context

- If the code is a **Spring Component** (@Service, @RestController, @Repository), mention its high-level responsibility in the system.
- For **Controller methods**, briefly note the HTTP verb and the logical resource it manipulates.

### 4. Example Output Pattern

```java
/**
 * Processes the payment for a specific order and updates the inventory status.
 *
 * @param orderId The unique identifier of the order to be processed.
 * @param authToken The JWT string used for transaction authorization.
 * @return A ResponseEntity containing the updated OrderDTO and HTTP 200 status.
 */
```
