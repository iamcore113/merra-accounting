## merra-accounting — Copilot instructions

This file provides concise, actionable facts for AI coding agents working on the merra-accounting backend.

Overview

- This repository contains a multi-module Maven backend under `backend/` (Java 21, Spring Boot 3.5.x).
- Top-level modules (declared in `backend/pom.xml`): `main`, `auth`, `commons`, `user`, `organization`.
- `main` is the Spring Boot application and depends on the other modules (see `backend/main/pom.xml`).

Quick architecture summary

- `main`: Spring Boot app (web, JPA, Liquibase). Entrypoint and runtime app logic.
- `auth`, `user`, `organization`, `commons`: domain or shared libraries packaged as Maven modules and included as dependencies in `main`.
- DB migrations: Liquibase change-logs referenced from `backend/main/src/main/resources/db/changelog/db.changelog-master.xml` (see `application.yaml`).

Build & run (developer workflows)

- Build entire backend (Windows PowerShell):
  - `cd backend; .\mvnw.cmd clean package`
- Run only the `main` app (rebuild modules it depends on):
  - `cd backend; .\mvnw.cmd -pl main -am spring-boot:run`
  - `-pl` = project list, `-am` = also make required modules
- Run tests for a specific module:
  - `cd backend; .\mvnw.cmd -pl main test` (or replace `main` with `auth`, `user`, ...)
- Local DB via Docker Compose (for `main`):
  - `docker compose -f backend/main/compose.yaml up -d` (exposes Postgres at host:5070 by default)

Environment and configuration

- `backend/main/src/main/resources/application.yaml` uses environment variables for DB and JWT secrets (examples):
  - `DB_URL` (used for `spring.datasource.url` and liquibase.url)
  - `JWT_TOKEN_SECRET` / `JWT_ACCESS_TOKEN_DURATION` etc.
- Tests and surefire: `backend/pom.xml` sets surefire system properties from environment variables (DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET). Provide those when running CI/tests.
- The project uses `me.paulschwarz:spring-dotenv` to load .env-style variables.

Key patterns & developer notes

- MapStruct: annotation processing is configured in `backend/pom.xml` via maven-compiler-plugin; generated mappers live in target/generated-sources/annotations.
- SpringDoc/OpenAPI available (path configured to `/api-docs` in `application.yaml`).
- Liquibase: changeLog location referenced in `application.yaml` at `db/changelog/db.changelog-master.xml` — edit that file to add DB changesets.
- Adding a module: add `<module>your-module</module>` to `backend/pom.xml` and ensure its POM has `<parent>` pointing to `backend`.

Where to look first (examples)

- `backend/pom.xml` — parent POM, Java version, dependencyManagement, modules list.
- `backend/main/pom.xml` — runtime app dependencies and spring-boot plugin.
- `backend/main/src/main/resources/application.yaml` — runtime properties, env var names, Liquibase path.
- `backend/main/compose.yaml` — local Postgres + Adminer for development.

Constraints & expectations for code changes

- Preserve module boundaries; most runtime code lives under `backend/main/src/main/java/org/merra` and shared code under other module sources.
- Prefer changing Liquibase changelogs rather than programmatic schema DDL; `spring.jpa.hibernate.ddl-auto` is set to `none` in config.
- Mind annotation processors (MapStruct) — ensure generated sources compile.

Examples (PowerShell)

- Build & run main with local DB:
  - `cd backend; docker compose -f main/compose.yaml up -d`
  - `$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5070/merradb'`
  - `.\mvnw.cmd -pl main -am spring-boot:run`

If you need more context

- Read module-level tests under each module's `src/test/java` to learn domain specifics.
- Search for `db/changelog` to find Liquibase changesets.

When editing this file

- If you add or change workflows, update this file (keep it concise). Ask the repo owner if you need infra credentials or CI details.

---

Please review and tell me if you'd like additional examples (CI commands, common test fixtures, or important classes to reference).
