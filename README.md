# MERRA Accounting & Bookkeeping

<div align="center">
  <img src="web/public/wave-icon.svg" alt="MERRA Logo" width="160" height="80">
  <p><em>A modern, multi-tenant accounting and bookkeeping platform for small businesses and finance teams.</em></p>
</div>

---

## 📌 Project Status

> [!WARNING]
> This project is actively under development and is not yet production-ready.
> APIs, database schemas, UI layouts, and domain workflows are continuously being refined. Expect breaking changes across versions.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start Infrastructure Services](#2-start-infrastructure-services)
  - [3. Configure & Run Backend](#3-configure--run-backend)
  - [4. Configure & Run Frontend](#4-configure--run-frontend)
- [Environment Configuration](#-environment-configuration)
  - [Backend Configuration (`backend/main/.env`)](#backend-configuration-backendmainenv)
  - [Frontend Configuration (`web/.env`)](#frontend-configuration-webenv)
- [API & Documentation](#-api--documentation)
- [Building & Testing](#-building--testing)
- [Detailed Module Guides](#-detailed-module-guides)

---

## 🔍 Overview

**MERRA** simplifies core accounting, billing, and bookkeeping workflows. Built with a modular enterprise architecture, it provides robust financial recording, multi-tenant organization boundaries, chart of accounts management, invoicing, and contact ledgers.

---

## ✨ Key Features

- **Multi-Tenancy & Organizations**: Seamless management of multiple organizations, member invitations, and role-based access.
- **Invoicing & Billing**: Create, manage, and track line-item invoices with tax calculations and status workflows.
- **Chart of Accounts & General Ledger**: Double-entry bookkeeping foundation with account categories, types, and journal entries.
- **Contact Management**: Unified ledger for clients, vendors, and business partners.
- **Secure Authentication**: Stateless JWT auth (access & refresh tokens), email verification, and visitor access tokens.
- **Performance & Caching**: Redis Stack (with TLS) and Ehcache second-level JPA caching for high throughput.
- **S3-Compatible Document Storage**: MinIO integration for file attachments, invoices, and receipts.

---

## 🛠 Technology Stack

### Backend
- **Language & Framework**: Java 25, Spring Boot 4.0.5
- **Security**: Spring Security, JJWT (JSON Web Tokens)
- **Persistence & Migrations**: Spring Data JPA, Hibernate, PostgreSQL 17, Liquibase
- **Caching**: Redis Stack (TLS-secured), Ehcache 3 / JCache
- **Object Storage**: MinIO (AWS S3-compatible API via Spring Cloud AWS)
- **API Docs**: SpringDoc OpenAPI / Swagger

### Frontend
- **Framework**: Angular 20 (Standalone Components, Signals, Centralized Routing)
- **UI Components & Styling**: Angular Material (Material 3), SCSS
- **HTTP & State**: HttpClient with typed API services and route guards

### Infrastructure & Tooling
- **Containers**: Docker & Docker Compose
- **Build Tools**: Maven Wrapper (`./mvnw`), npm

---

## 📂 Repository Structure

```text
merra-accounting/
├── backend/                  # Java 25 & Spring Boot multi-module backend
│   ├── main/                 # Application bootstrap, web controllers, migrations & config
│   ├── auth/                 # Authentication, JWT filters, security configurations
│   ├── user/                 # User profiles, settings, and personal details
│   ├── organization/         # Domain models (Invoices, Accounts, Journals, Contacts)
│   ├── commons/              # Shared models, DTOs, custom exception handlers, utilities
│   ├── certs/                # Redis TLS certificates
│   ├── compose.yaml          # Local infrastructure (Postgres, Redis, MinIO)
│   ├── generate-certs.sh     # TLS certificate generator script
│   └── run-main-jar.sh       # Script for running extracted AOT-optimized application JAR
├── web/                      # Angular 20 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/     # Feature-specific components (e.g. invoice creation)
│   │   │   ├── views/        # Top-level page views (Auth, Dashboard, Invoices, Contacts)
│   │   │   ├── shared/       # Reusable components, guards, interceptors, API services
│   │   │   ├── app.routes.ts # Central routing definitions
│   │   │   └── app.config.ts # Application bootstrap configuration
│   │   └── styles.scss       # Global styles & Material theme
│   └── angular.json          # Angular CLI workspace configuration
└── README.md                 # Monorepo root documentation
```

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed:

- **Docker & Docker Compose** (for PostgreSQL, Redis, and MinIO)
- **Java Development Kit (JDK) 25+** (Recommended: install via [SDKMAN](https://sdkman.io/): `sdk install java 25.0.1.fx-librca`)
- **Maven 3.9+** (or use the included `./mvnw` wrapper)
- **Node.js 20+** and **npm 10+**
- **Angular CLI 20+** (`npm install -g @angular/cli`)

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/your-username/merra-accounting.git
cd merra-accounting
```

### 2. Start Infrastructure Services

The local environment relies on PostgreSQL, Redis (with TLS), and MinIO:

```bash
cd backend

# Generate TLS certificates for Redis if not already present
./generate-certs.sh

# Start the services in the background
docker compose up -d db redis minio
```

| Service | Host Port | Internal Port | Description |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `5071` | `5432` | Relational database (`merra_accounting`) |
| **Redis Stack** | `6379` | `6379` | TLS-encrypted cache store |
| **Redis Insight** | `8001` | `8001` | Redis Web Console |
| **MinIO API** | `9000` | `9000` | S3-compatible object storage API |
| **MinIO Console** | `9001` | `9001` | MinIO Web Dashboard (`minioadmin` / `minioadmin`) |

### 3. Configure & Run Backend

1. Create your environment file from the example:
   ```bash
   cp backend/.env.example backend/main/.env
   ```
2. Start the Spring Boot application using the Maven wrapper:
   ```bash
   cd backend
   ./mvnw clean spring-boot:run -pl main
   ```
The backend API will be available at **`http://localhost:8080`**.

### 4. Configure & Run Frontend

1. Navigate to the `web` folder and install dependencies:
   ```bash
   cd web
   npm install
   ```
2. Ensure `web/.env` is configured (defaults point to `http://localhost:8080/api/`).
3. Start the Angular development server:
   ```bash
   ng serve
   ```
4. Open your browser at **`http://localhost:4200`**.

---

## ⚙️ Environment Configuration

### Backend Configuration (`backend/main/.env`)

```env
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5071/merra_accounting
DB_USER=brian
DB_PASSWORD=password

# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_DURATION=86400000

# JWT Configuration (at least 256-bit string)
JWT_TOKEN_SECRET=your-secret-key-here-at-least-256-bits-long
JWT_ACCESS_TOKEN_DURATION=3600000
JWT_VISITOR_ACCESS_TOKEN_DURATION=28800000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# Frontend URLs
FRONTEND_URL=http://localhost:4200
FRONTEND_REDIRECT_URL=http://localhost:4200

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=merra_account_rds

# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_REGION_STATIC=us-east-1
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Frontend Configuration (`web/.env`)

```env
NG_APP_BASE_URL=http://localhost:8080/api/
NG_APP_HEALTH_URL=http://localhost:8080/actuator/health/
NG_APP_API_VERSION=1.1
```

---

## 📑 API & Documentation

- **OpenAPI Schema**: `http://localhost:8080/api-docs`
- **Swagger UI**: Integrated via SpringDoc (available when running locally)
- **Actuator Health Check**: `http://localhost:8080/actuator/health`

---

## 🧪 Building & Testing

### Backend
```bash
# Run all unit and integration tests
./mvnw clean test

# Build application JARs
./mvnw clean package

# Build and run optimized AOT package
./run-main-jar.sh
```

### Frontend
```bash
# Run unit tests
cd web
ng test

# Build production bundle (output to dist/)
ng build --configuration production
```

---

## 📚 Detailed Module Guides

For deep dives into module architecture, domain logic, and specific setup instructions, consult the individual subproject documentation:

- 🔙 **[Backend Documentation](backend/README.md)** — Comprehensive guide on JPA entities, Liquibase changesets, Spring Security filters, and AOT compilation.
- 🎨 **[Frontend Documentation](web/README.md)** — Component architecture, state conventions, routing patterns, and Material 3 theming.
