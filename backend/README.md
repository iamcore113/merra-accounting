# Merra Accounting - Backend

Multi-module Java 25 Spring Boot 4.0.0 application using Maven.

## Project Structure

This is a Maven multi-module project with the following modules:

- **`main`** - The main Spring Boot application (web, JPA, Liquibase)
- **`auth`** - Authentication domain module
- **`user`** - User management domain module
- **`organization`** - Organization management domain module
- **`commons`** - Shared utilities and common code

The `main` module depends on all other modules and serves as the runtime application.

## Prerequisites

- Java 25 or higher
- Docker and Docker Compose (for local database)
- Maven (wrapper included - `mvnw` / `mvnw.cmd`)

## Environment Variables

Create a `.env` file in the `backend/` directory (you can copy `.env.example` as a starting point):

```env
# Database Configuration
DB_URL=jdbc:postgresql://127.0.0.1:5070/merradb

# Mail Configuration
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_DURATION=86400000

# JWT Configuration
JWT_TOKEN_SECRET=your-secret-key-here-at-least-256-bits
JWT_LIMITED_ACCESS_TOKEN_DURATION=900000
JWT_ACCESS_TOKEN_DURATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# Frontend URLs
FRONTEND_URL=http://localhost:4200
FRONTEND_REDIRECT_URL=http://localhost:4200
```

### Environment Variable Details

- **DB_URL**: PostgreSQL connection string (default local: `jdbc:postgresql://127.0.0.1:5070/merradb`)
- **MAIL_HOST**: SMTP server hostname
- **MAIL_PORT**: SMTP server port
- **MAIL_USERNAME**: Email account username
- **MAIL_PASSWORD**: Email account password
- **MAIL_DURATION**: Email verification token duration in milliseconds (default: 24 hours)
- **JWT_TOKEN_SECRET**: Secret key for JWT signing (min 256 bits)
- **JWT_LIMITED_ACCESS_TOKEN_DURATION**: Limited access token duration in ms (default: 15 min)
- **JWT_ACCESS_TOKEN_DURATION**: Regular access token duration in ms (default: 1 hour)
- **JWT_REFRESH_TOKEN_EXPIRATION**: Refresh token expiration in ms (default: 7 days)
- **FRONTEND_URL**: Frontend application URL
- **FRONTEND_REDIRECT_URL**: Frontend redirect URL for email links

## Local Database Setup

Start the local PostgreSQL database and Adminer using Docker Compose:

### Windows (PowerShell)

```powershell
docker compose -f main/compose.yaml up -d
```

### macOS/Linux

```bash
docker compose -f main/compose.yaml up -d
```

This will start:

- **PostgreSQL** on port `5070` (database: `merradb`, user: `merra-user`, password: `password`)
- **Adminer** on port `7777` (web-based database management UI at http://localhost:7777)

To stop the database:

```bash
docker compose -f main/compose.yaml down
```

## Building the Project

### Build all modules

**Windows:**

```powershell
.\mvnw.cmd clean package
```

**macOS/Linux:**

```bash
./mvnw clean package
```

### Build specific module

```bash
./mvnw clean package -pl <module-name>
```

Example: `./mvnw clean package -pl auth`

## Running the Application

Run the Spring Boot application from the `main` module:

### Windows (PowerShell)

```powershell
.\mvnw.cmd spring-boot:run -pl main
```

### macOS/Linux

```bash
./mvnw spring-boot:run -pl main
```

The `-pl main` flag tells Maven to run the `main` project specifically.

### Using the convenience scripts

**Windows:**

```powershell
.\run-dev-win.ps1
```

**macOS/Linux:**

```bash
./run-dev-mac.sh
```

The application will start on `http://localhost:8080` (or the port configured in `application.yaml`).

## Running Tests

### Run all tests

```bash
./mvnw test
```

### Run tests for specific module

```bash
./mvnw test -pl <module-name>
```

Example: `./mvnw test -pl auth`

## Database Migrations

Database migrations are managed by **Liquibase**. Change logs are located at:

```
backend/main/src/main/resources/db/changelog/db.changelog-master.xml
```

Liquibase runs automatically on application startup and applies pending migrations.

### Key Configuration

- Schema: `merra_schema`
- Liquibase schema: `merra_schema`
- DDL auto: `none` (managed by Liquibase only)

## API Documentation

SpringDoc OpenAPI documentation is available when the application is running:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/api-docs

## Development Notes

- **MapStruct**: Annotation processing is configured for MapStruct mappers. Generated sources are in `target/generated-sources/annotations/`.
- **Live Reload**: Spring DevTools is enabled for automatic restart on code changes.
- **SQL Logging**: `show-sql: true` is enabled in development to see generated SQL queries.

## Troubleshooting

### Database Connection Issues

- Ensure Docker Compose is running: `docker ps`
- Check the database is accessible on port 5070
- Verify `DB_URL` environment variable matches your Docker setup

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
