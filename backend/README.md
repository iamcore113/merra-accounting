# Merra Accounting - Backend

Multi-module Java 25 Spring Boot 4.0.5 application using Maven with AOT caching support. PostgreSQL is the database, Redis Stack the cache, and an S3-compatible store (MinIO or SeaweedFS) holds attachments.

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database and Caching Setup](#database-and-caching-setup)
- [Building the Project](#building-the-project)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)
- [API Documentation](#api-documentation)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)

## Project Structure

This is a Maven multi-module project organized as follows:

```
backend/
├── main/              # Main Spring Boot application (web, JPA, Liquibase)
├── auth/              # Authentication domain module
├── user/              # User management domain module
├── organization/      # Organization management domain module
├── commons/           # Shared utilities and common code
├── certs/             # Redis TLS certificates (generated, see generate-certs.sh)
├── compose.yaml       # Redis Stack and MinIO (PostgreSQL service commented out)
└── run-main-jar.sh    # Extract JAR, build AOT cache and start the app
```

**Module dependencies:** `main` depends on `auth`, `user`, `organization`, and `commons`, and serves as the runtime application.

## Prerequisites

- **Java 25** or higher (required for AOT caching)
- **PostgreSQL 17** running locally on port `5071` (or any instance you point `DB_URL` at). The `db` service in `compose.yaml` is currently commented out.
- **Docker** and **Docker Compose** (for Redis Stack and MinIO)
- **OpenSSL** (for `generate-certs.sh`, Redis TLS certificates)
- **Maven** (wrapper included: `mvnw` on macOS/Linux, `mvnw.cmd` on Windows)

For Maven usage:

- Prefer the Maven Wrapper from the backend root (`./mvnw` or `.\mvnw.cmd`) to ensure consistent builds.
- You can use an external Maven installation (for example from SDKMAN) as long as its version is close to the version used by the Maven Wrapper in this repository.

### Recommended for macOS/Linux: SDKMAN

If you are developing on macOS or Linux, it is recommended to use SDKMAN to manage JDK and Maven versions.

```bash
# Install JDK 25 (example distribution)
sdk install java 25.0.4.r25-nik

# Install Maven
sdk install maven

# Verify versions
java -version
mvn -version
```

Using SDKMAN helps keep your local environment consistent across projects and makes it easy to switch versions when needed.

### VS Code Toolchain Configuration

If you are using VS Code for development, make sure the editor is configured to use the project-required JDK and Maven versions.

- Set Java runtime to JDK 25 in VS Code Java settings
- Ensure Maven in VS Code resolves to the expected version and Java home
- Re-import the Maven project after changing JDK/Maven so language tooling and build tasks refresh correctly

## Environment Setup

### 1. Create `.env` file

Copy `.env.example` to `backend/main/.env` and configure your environment:

```env
# Database Configuration (REQUIRED)
DB_URL=jdbc:postgresql://localhost:5071/merra_accounting
DB_USER=postgres
DB_PASSWORD=password

# Mail Configuration (REQUIRED, also for AOT cache generation)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password

# Token/Session Durations (in milliseconds)
MAIL_DURATION=86400000                    # 24 hours
JWT_TOKEN_SECRET=your-256-bit-secret-key
JWT_ACCESS_TOKEN_DURATION=3600000         # 1 hour
JWT_VISITOR_ACCESS_TOKEN_DURATION=28800000 # 8 hours
JWT_REFRESH_TOKEN_EXPIRATION=604800000    # 7 days

# Redis Configuration (REQUIRED for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=merra_account_rds
REDIS_SSL_ENABLED=true                    # compose.yaml's Redis only accepts TLS

# S3-compatible object storage (defaults point at SeaweedFS on :8333;
# use http://localhost:9000 for the MinIO container in compose.yaml)
S3_ENDPOINT=http://localhost:9000
S3_REGION_STATIC=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Frontend Configuration
FRONTEND_URL=http://localhost:4200
FRONTEND_REDIRECT_URL=http://localhost:4200
```

`.env.example` also contains `MINIO_*` backward-compatibility aliases for the `S3_*` variables; the application itself reads `S3_*`. Optionally set `APP_COUNTRIES_CODE` to override the default countries API key.

**Important:** The `.env` file contains sensitive information and is **git-ignored**. Never commit this to version control.

## Database and Caching Setup

`compose.yaml` (backend root) defines **Redis Stack (TLS)** and **MinIO**. The PostgreSQL service is commented out, so run PostgreSQL yourself (local install on port `5071`, or uncomment the `db` service in `compose.yaml`) and create the `merra_accounting` database. The app creates the `app` schema on startup and Liquibase applies the migrations.

### 1. Generate Redis TLS certificates (first time only)

```bash
cd backend
./generate-certs.sh
```

Certificates are written to `backend/certs/` and mounted into the Redis container.

### 2. Start Redis Stack and MinIO

```bash
docker compose up -d redis minio
```

- **Redis Stack** (`merra-accounting-redis`): `localhost:6379` (TLS only, password `merra_account_rds`), Redis Insight at http://localhost:8001
- **MinIO** (`merra-accounting-local-chainguard-minio`): S3 API http://localhost:9000, console http://localhost:9001 (`minioadmin` / `minioadmin`)

If you uncomment the `db` service: `docker compose up -d db` (PostgreSQL 17 on `5071`, user `brian`, password `password`).

There is no application service in `compose.yaml`; run the app as described below. The `Dockerfile` builds an image from the extracted `application/` folder produced by `run-main-jar.sh`.

### Alternative: `start-containers.sh`

`./start-containers.sh` is a helper for WSL (it uses `wslc.exe`) that starts Redis Stack (no TLS) and SeaweedFS (S3 on `8333`) and checks a local PostgreSQL on `5432`. If you use it, set `REDIS_SSL_ENABLED=false`, `DB_URL=jdbc:postgresql://localhost:5432/merra_accounting` and `S3_ENDPOINT=http://localhost:8333`.

### Stop Services

```bash
docker compose down
```

**Note:** Data persists in the volumes (`redis_data`, `minio_data`, and `db_data`). To reset and clear data:

```bash
docker compose down -v
```

## Building the Project

### Build All Modules

```bash
cd backend
./mvnw clean package        # macOS/Linux
.\mvnw.cmd clean package    # Windows
```

### Build Specific Module

```bash
./mvnw clean package -pl <module-name>
```

Examples:

```bash
./mvnw clean package -pl main                    # Build main module
./mvnw clean package -pl user,auth -am           # Build with dependencies
```

**Flag meanings:**

- `-pl` (--projects): Specify which modules to build
- `-am` (--also-make): Build required dependencies

## Running the Application

### Option 1: Run with AOT Cache (Recommended for Production/Benchmarking)

The `run-main-jar.sh` script automatically:

1. Extracts the JAR to `backend/application/` folder
2. Generates the AOT cache (`app.aot`)
3. Starts the app with AOT cache enabled

```bash
cd backend
./run-main-jar.sh
```

**What it does:**

- First run: Extracts the JAR and generates the AOT cache (takes ~2-3 seconds)
- Subsequent runs: Uses cached data for faster startup

The script requires `backend/main/.env` and a built JAR (`./mvnw -pl main -am clean package`). On Windows, use WSL/Git Bash for the script, or run the plain JAR below.

### Option 2: Run Without AOT Cache (Development)

**With Maven (faster rebuilds):**

```bash
./mvnw spring-boot:run -pl main -am
```

**With plain JAR:**

```bash
./mvnw clean package -pl main -am
java -jar main/target/main-1.0-SNAPSHOT.jar
```

### Application Access

Once running, the application is available at:

- **Application**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/api-docs

## Database Migrations

Database schema and migrations are managed by **Liquibase**.

### Configuration

- **Master changelog**: `backend/main/src/main/resources/db/changelog/db.changelog-master.xml`
- **Tenant changelog**: `backend/main/src/main/resources/db/changelog/db.changelog-tenant.xml`
- **Change sets**: live in each module, e.g. `backend/user/src/main/resources/db/changesets/user/` and `backend/organization/src/main/resources/db/changesets/organization/`
- **Default schema**: `app`
- **Schema initialization**: Handled by `SchemaInitializer.java` on application startup

### Adding New Migrations

Before creating a new Liquibase XML file, use this naming convention:

- `<sub-module>-<YYYYMMDD>-<NN>[-<description>].xml` (the `user` module uses no description)
- `sub-module`: short module prefix (for example: `org` for organization, `user` for user)
- `YYYYMMDD`: current date with leading zeros for month/day
- `NN`: next sequence number with leading zero when needed (`01`, `02`, ..., `51`)
- `description`: short kebab-case summary of the change

Example for organization module sequence:

- Last file: `org-20261110-51.xml`
- Next file on 2026-11-12: `org-20261112-52-add-example-table.xml`

1. Create a new changeset file in the owning module's `src/main/resources/db/changesets/<module>/` folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog>
    <changeSet id="2026-add-your-migration-purpose" author="your-name">
        <createTable tableName="your_table">
            <!-- table definition -->
        </createTable>
    </changeSet>
</databaseChangeLog>
```

Use this `changeSet` id format: `<current-year>-<what-this-migration-is-about>`

Example: `2026-add-organization-members-table`

2. Files in a module folder are picked up by the `includeAll` entries in `db.changelog-master.xml` (`db/changesets/user`, `db/changesets/organization`). Only add a new `includeAll` line if you create a new module folder.

3. Liquibase will automatically apply it on next application startup

## API Documentation

When the application is running, OpenAPI documentation is available via:

- **Swagger UI** (interactive): http://localhost:8080/swagger-ui.html
- **OpenAPI JSON** (raw): http://localhost:8080/api-docs

This is configured in `application.properties` (`springdoc.api-docs.path=/api-docs`).

## Development Notes

### AOT Caching (Java 25+)

AOT (Ahead-of-Time) caching uses the JVM's AOT Cache feature (JEP 483) to:

- **Reduce startup time** by ~30-40%
- **Lower memory footprint** on first run
- Cache is stored in `backend/application/app.aot`

The `run-main-jar.sh` script handles cache generation automatically.

### MapStruct Annotation Processing

- Configured in `backend/pom.xml` via `maven-compiler-plugin`
- Generated mappers are in `target/generated-sources/annotations/`
- Rebuilt automatically during `clean package`

### Spring Boot Configuration

- **Profiles**: `application.properties` activates the `dev` profile by default; `application-dev.properties` enables SQL logging and Hibernate statistics, and `application-prod.properties` holds production settings
- **Live Reload**: Enabled via Spring DevTools for automatic restarts on code changes
- **Hibernate DDL**: Set to `none` - all schema changes go through Liquibase

### Environment Variables in Spring Boot

All environment variables are injected into `application.properties` using:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.password=${DB_PASSWORD}
```

Sensitive values are loaded from `backend/main/.env` at runtime, **never** embedded in the build.

## Troubleshooting

### Application won't start - Database/Redis connection error

**Check:**

1. Are PostgreSQL and Redis running? `docker ps` (and check PostgreSQL separately)
2. Are port 5071 (PostgreSQL) and 6379 (Redis) accessible?
3. Verify `DB_URL` in `.env` matches: `jdbc:postgresql://localhost:5071/merra_accounting`
4. Verify Redis variables in `.env` match (`REDIS_SSL_ENABLED=true` when using `compose.yaml`; the Redis container only accepts TLS and needs `./generate-certs.sh` to have been run):
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=merra_account_rds
   REDIS_SSL_ENABLED=true
   ```

**Fix:**

```bash
docker compose up redis minio -d
```

### AOT cache generation fails with missing environment variables

**Problem:** `java.util.PlaceholderResolutionException: Could not resolve placeholder 'MAIL_HOST'`

**Solution:** Ensure the `.env` file exists at `backend/main/.env` (copy from `backend/.env.example`) before running `./run-main-jar.sh`

### Application runs slowly on first startup

This is normal with AOT cache generation. First run takes 2-3 seconds as the cache is created. Subsequent runs are much faster.

### Tests fail with database connection issues

**Solution:** Tests need the database running:

Make sure PostgreSQL (and Redis, if the test touches caching) is running and reachable via your `.env`, then run:

```bash
./mvnw test
```

### "Main manifest attribute and .\*jar not found" error

**Problem:** JAR file doesn't have a manifest or wasn't built correctly

**Solution:** Rebuild the project:

```bash
./mvnw clean package -pl main -am
```

---

## Quick Reference

| Task                 | Command                               |
| -------------------- | ------------------------------------- |
| Build all            | `./mvnw clean package`                |
| Build main module    | `./mvnw clean package -pl main -am`   |
| Run with AOT cache   | `./run-main-jar.sh`                   |
| Run with Maven       | `./mvnw spring-boot:run -pl main -am` |
| Start Redis & MinIO  | `docker compose up redis minio -d`    |
| Generate Redis certs | `./generate-certs.sh`                 |
| Run tests            | `./mvnw test`                         |
| Test specific module | `./mvnw test -pl auth`                |
| View Redis UI        | http://localhost:8001 (Redis Insight) |
| View MinIO console   | http://localhost:9001                 |
| View API docs        | http://localhost:8080/swagger-ui.html |

### Build Errors

- Clean the project: `./mvnw clean`
- Ensure Java 25 is installed: `java -version`
- Check for MapStruct annotation processor errors in logs

### Environment Variables Not Loading

- Verify `.env` file exists in the `backend/main/` directory
- Check that the `springboot4-dotenv` dependency is included (declared in `main/pom.xml`)
- Ensure environment variables are properly set in your shell/IDE

## Module Dependencies

```
main
├── auth
├── user
├── organization
└── commons
```

The `main` module depends on all other modules. Each domain module (`auth`, `user`, `organization`) can depend on `commons` for shared functionality.
