# Merra Accounting - Backend

Multi-module Java 25 Spring Boot 4.0.5 application using Maven with AOT caching support.

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
└── commons/           # Shared utilities and common code
```

**Module dependencies:** `main` depends on `auth`, `user`, `organization`, and `commons`, and serves as the runtime application.

## Prerequisites

- **Java 25** or higher (required for AOT caching)
- **Docker** and **Docker Compose** (for local PostgreSQL and Redis Stack services)
- **Maven** (wrapper included: `mvnw` on macOS/Linux, `mvnw.cmd` on Windows)

For Maven usage:

- Prefer the Maven Wrapper from the backend root (`./mvnw` or `.\mvnw.cmd`) to ensure consistent builds.
- You can use an external Maven installation (for example from SDKMAN) as long as its version is close to the version used by the Maven Wrapper in this repository.

### Recommended for macOS/Linux: SDKMAN

If you are developing on macOS or Linux, it is recommended to use SDKMAN to manage JDK and Maven versions.

```bash
# Install JDK 25 (example distribution)
sdk install java 25.0.1.fx-librca

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

# Mail Configuration (REQUIRED for AOT cache generation)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password

# Token/Session Durations (in milliseconds)
MAIL_DURATION=86400000                    # 24 hours
JWT_TOKEN_SECRET=your-256-bit-secret-key
JWT_ACCESS_TOKEN_DURATION=86400000        # 24 hours
JWT_REFRESH_TOKEN_EXPIRATION=604800000    # 7 days

# Redis Configuration (REQUIRED for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=merra_account_rds

# Frontend Configuration
FRONTEND_URL=http://localhost:4200
FRONTEND_REDIRECT_URL=http://localhost:4200
```

**Important:** The `.env` file contains sensitive information and is **git-ignored**. Never commit this to version control.

## Database and Caching Setup

### Start PostgreSQL and Redis Stack with Docker Compose

The project includes a `compose.yaml` at the backend root that sets up database, caching, and application services.

#### Option 1: Full Stack (Database, Redis Stack, + Application)

```bash
cd backend
docker compose up
```

This starts:

- **PostgreSQL** (`merra-accounting-db`) on port `5071`
- **Redis Stack** (`merra-accounting-redis`) on port `6379` (Redis) and `8001` (Redis Insight UI)
- **Spring Boot App** (`merra-app`) on port `8080`

#### Option 2: Database and Redis Stack Only (For Local Development)

```bash
cd backend
docker compose up db redis -d
```

This starts only the database and Redis Stack in the background:

- **PostgreSQL**: `jdbc:postgresql://localhost:5071/merra_accounting`
- **Redis Stack**: `localhost:6379` (with password `merra_account_rds`)
- **Redis Insight UI**: http://localhost:8001 (Web GUI to inspect Redis cache/data)

#### Stop Services

```bash
docker compose down
```

**Note:** Data persists in the volumes (`db_data` and `redis_data`). To reset the services and clear data, use:

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

**macOS/Linux equivalent for Windows PowerShell:**

```powershell
# Build first
.\mvnw.cmd clean package -pl main -am

# Then run with AOT cache
cd backend\main\application
java -XX:AOTCache=app.aot -jar main-1.0-SNAPSHOT.jar
```

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

**With convenience scripts:**

```bash
# macOS/Linux
./run-dev-mac.sh

# Windows PowerShell
.\run-dev-win.ps1
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
- **Change sets**: `backend/main/src/main/resources/db/changesets/`
- **Default schema**: `app`
- **Schema initialization**: Handled by `SchemaInitializer.java` on application startup

### Adding New Migrations

Before creating a new Liquibase XML file, use this naming convention:

- `<sub-module>-<YYYYMMDD>-<NN>-<description>.xml`
- `sub-module`: short module prefix (for example: `org` for organization, `user` for user)
- `YYYYMMDD`: current date with leading zeros for month/day
- `NN`: next sequence number with leading zero when needed (`01`, `02`, ..., `27`)
- `description`: short kebab-case summary of the change

Example for organization module sequence:

- Last file: `org-20260405-26-add-organization_members-table.xml`
- Next file on 2026-04-18: `org-20260418-27-what-is-this-file.xml`

1. Create a new changeset file in `db/changesets/`:

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

2. Include it in `db.changelog-master.xml`:

```xml
<includeAll path="db/changesets/your-module" relativeToChangelogFile="false" />
```

3. Liquibase will automatically apply it on next application startup

## API Documentation

When the application is running, OpenAPI documentation is available via:

- **Swagger UI** (interactive): http://localhost:8080/swagger-ui.html
- **OpenAPI JSON** (raw): http://localhost:8080/api-docs

This is configured in `application.yaml` at `/api-docs` path.

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

- **Live Reload**: Enabled via Spring DevTools for automatic restarts on code changes
- **SQL Logging**: `show-sql: true` shows generated SQL queries (useful for debugging)
- **Hibernate DDL**: Set to `none` - all schema changes go through Liquibase

### Environment Variables in Spring Boot

All environment variables are injected into `application.yaml` using:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    password: ${DB_PASSWORD}
```

Sensitive values are loaded from `.env` at runtime, **never** embedded in the build.

## Troubleshooting

### Application won't start - Database/Redis connection error

**Check:**

1. Are PostgreSQL and Redis running? `docker ps`
2. Are port 5071 (PostgreSQL) and 6379 (Redis) accessible?
3. Verify `DB_URL` in `.env` matches: `jdbc:postgresql://localhost:5071/merra_accounting`
4. Verify Redis variables in `.env` match:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=merra_account_rds
   ```

**Fix:**

```bash
docker compose up db redis -d
```

### AOT cache generation fails with missing environment variables

**Problem:** `java.util.PlaceholderResolutionException: Could not resolve placeholder 'MAIL_HOST'`

**Solution:** Ensure `.env` file exists at `backend/main/.env` before running `./run-main-jar.sh`

### Application runs slowly on first startup

This is normal with AOT cache generation. First run takes 2-3 seconds as the cache is created. Subsequent runs are much faster.

### Tests fail with database connection issues

**Solution:** Tests need the database running:

```bash
docker compose up db -d

# Then run tests
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
| Start DB & Redis     | `docker compose up db redis -d`       |
| Start full stack     | `docker compose up`                   |
| Run tests            | `./mvnw test`                         |
| Test specific module | `./mvnw test -pl auth`                |
| View Redis UI        | http://localhost:8001 (Redis Insight) |
| View database        | http://localhost:7777 (Adminer)       |
| View API docs        | http://localhost:8080/swagger-ui.html |

### Build Errors

- Clean the project: `./mvnw clean`
- Ensure Java 25 is installed: `java -version`
- Check for MapStruct annotation processor errors in logs

### Environment Variables Not Loading

- Verify `.env` file exists in the `backend/` directory
- Check that `spring-dotenv` dependency is included (configured in parent POM)
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
