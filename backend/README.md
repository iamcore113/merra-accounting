# Merra Accounting - Backend

Multi-module Java 25 Spring Boot 4.0.0 application using Maven with AOT caching support.

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
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
- **Docker** and **Docker Compose** (for local PostgreSQL database)
- **Maven** (wrapper included: `mvnw` on macOS/Linux, `mvnw.cmd` on Windows)

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
DB_URL=jdbc:postgresql://localhost:5070/merradb

# Mail Configuration (REQUIRED for AOT cache generation)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password

# Token/Session Durations (in milliseconds)
MAIL_DURATION=86400000                    # 24 hours
JWT_TOKEN_SECRET=your-256-bit-secret-key
JWT_ACCESS_TOKEN_DURATION=86400000        # 24 hours
JWT_LIMITED_ACCESS_TOKEN_DURATION=600000  # 10 minutes
JWT_REFRESH_TOKEN_EXPIRATION=604800000    # 7 days

# Frontend Configuration
FRONTEND_URL=http://localhost:4200
FRONTEND_REDIRECT_URL=http://localhost:4200
```

**Important:** The `.env` file contains sensitive information and is **git-ignored**. Never commit this to version control.

## Database Setup

### Start PostgreSQL with Docker Compose

The project includes a `compose.yaml` at the backend root that sets up both the database and application services.

#### Option 1: Full Stack (Database + Application)

```bash
cd backend
docker compose up
```

This starts:

- **PostgreSQL** (`merra-db`) on port `5070`
- **Spring Boot App** (`merra-app`) on port `8080`

#### Option 2: Database Only

```bash
cd backend
docker compose up db
```

This starts only PostgreSQL on port `5070`:

- Database: `merradb`
- User: `merra-user`
- Password: `password`

#### Stop Services

```bash
docker compose down
```

**Note:** Data persists in the `db_data` volume. To reset the database, use:

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
- **Default schema**: `merra_schema`
- **Schema initialization**: Handled by `SchemaInitializer.java` on application startup

### Adding New Migrations

1. Create a new changeset file in `db/changesets/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog>
    <changeSet id="your-unique-id" author="your-name">
        <createTable tableName="your_table">
            <!-- table definition -->
        </createTable>
    </changeSet>
</databaseChangeLog>
```

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

### Application won't start - Database connection error

**Check:**

1. Is PostgreSQL running? `docker ps`
2. Is port 5070 accessible? `telnet localhost 5070`
3. Verify `DB_URL` in `.env` matches: `jdbc:postgresql://localhost:5070/merradb`

**Fix:**

```bash
docker compose up db -d
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
| Start database       | `docker compose up db -d`             |
| Start full stack     | `docker compose up`                   |
| Run tests            | `./mvnw test`                         |
| Test specific module | `./mvnw test -pl auth`                |
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
