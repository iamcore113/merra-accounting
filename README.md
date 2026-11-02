<div align="center">
  <img src="web/public/merra-logo.svg" alt="MERRA Logo" width="380">
  <br />
  <p><strong>Modern, Multi-Tenant Accounting & Bookkeeping Engine</strong></p>
  <p><em>Engineered for small businesses, accounting professionals, and distributed finance teams.</em></p>

  <p>
    <img src="https://img.shields.io/badge/Java-25-orange?logo=openjdk&logoColor=white" alt="Java 25">
    <img src="https://img.shields.io/badge/Spring_Boot-4.0.5-brightgreen?logo=springboot&logoColor=white" alt="Spring Boot 4">
    <img src="https://img.shields.io/badge/Angular-20-red?logo=angular&logoColor=white" alt="Angular 20">
    <img src="https://img.shields.io/badge/PrimeNG-20.4-blue?logo=primeng&logoColor=white" alt="PrimeNG 20">
    <img src="https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql&logoColor=white" alt="PostgreSQL 17">
    <img src="https://img.shields.io/badge/Redis_Stack-TLS-red?logo=redis&logoColor=white" alt="Redis Stack">
    <img src="https://img.shields.io/badge/Liquibase-Audited-blue?logo=liquibase&logoColor=white" alt="Liquibase">
  </p>
</div>

---

## 📌 Project Status

> [!NOTE]
> This platform is under active development. Core domain modules (tenancy, invoicing, chart of accounts, and financial periods) are functional and actively being expanded.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Capabilities](#-key-capabilities)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Infrastructure Services (Docker)](#1-infrastructure-services-docker)
  - [2. Backend API Service](#2-backend-api-service)
  - [3. Frontend Web Client](#3-frontend-web-client)
- [Environment Configuration](#-environment-configuration)
- [API & Documentation](#-api--documentation)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Subproject Documentation](#-subproject-documentation)

---

## 🔍 Overview

**MERRA** is a double-entry bookkeeping and accounting workspace designed for multi-entity businesses. It delivers rigorous tenant isolation, transactional ledgers, customizable tax & invoicing lifecycles, and customizable financial reporting boundaries with a responsive, botanical-themed user interface.

---

## ✨ Key Capabilities

- **🏢 Multi-Organization Tenancy**: Isolated accounting environments per legal entity, custom currencies, address configurations, and role-based permissions (`CREATOR`, `ADMIN`, `MEMBER`).
- **🧾 Sales & Purchases Invoicing**: Create accounts receivable and accounts payable with line items, tax-inclusive / exclusive rules, and draft-to-approval workflows.
- **📅 Fiscal Year-End Controls**: Configurable annual closing dates (month and day boundaries) for accurate period closing, trial balances, and reporting.
- **👥 Contact & Entity Directory**: Unified contact tracking identifying suppliers, customers, account numbers, and transaction logs.
- **🔐 Secure Authentication**: Stateless JWT architecture with access, visitor, and refresh tokens, accompanied by cryptographic email verification flows.
- **⚡ High-Throughput Caching**: Redis Stack (secured with TLS) alongside Ehcache second-level JPA caching for sub-second responses.
- **📁 Document & Attachment Storage**: S3-compatible MinIO object storage for invoice attachments and receipts.

---

## 🛠 Architecture & Tech Stack

### Backend Service
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Java 25 | Latest features with AOT caching support |
| **Framework** | Spring Boot 4.0.5 | Modern enterprise microframework |
| **Security** | Spring Security & JJWT | Stateless JWT filters, visitor sessions & RBAC |
| **Database** | PostgreSQL 17 | Relational persistence with transactional integrity |
| **Migrations** | Liquibase | Declarative, version-controlled database changesets |
| **Caching** | Redis Stack & Ehcache 3 | Distributed and in-process caching |
| **Object Store** | MinIO | S3-compliant distributed document storage |
| **Docs** | SpringDoc OpenAPI | Automated Swagger/OpenAPI documentation |

### Frontend Client
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Angular 20 | Standalone components, Signals, control flow syntax |
| **Component Suite** | PrimeNG 20.4.0 | High-performance enterprise UI components |
| **Design System** | Custom Botanical SCSS | Flat design, minimal radius (`4px`), `#689D4B` primary theme |
| **Icons** | PrimeIcons (`pi`) | Clean vector iconography across all workflows |
| **Build System** | Angular CLI / esbuild | Optimized differential bundling |

---

## 📂 Repository Structure

```text
merra-accounting/
├── backend/                  # Spring Boot 4 & Java 25 Multi-Module Backend
│   ├── main/                 # Application bootstrap, web controllers, Liquibase migrations
│   ├── auth/                 # Authentication domain (JWT, verification tokens, security)
│   ├── user/                 # User personal profiles, settings, and credentials
│   ├── organization/         # Core accounting domains (Invoices, Accounts, Tenancy, Contacts)
│   ├── commons/              # Shared models, DTOs, utilities, and exception handlers
│   ├── certs/                # Redis TLS certificates
│   ├── compose.yaml          # Local infrastructure (PostgreSQL, Redis Stack, MinIO)
│   └── run-main-jar.sh       # Script for running extracted AOT-optimized application JAR
├── web/                      # Angular 20 Frontend Application
│   ├── public/               # Static assets & SVG icons (merra-logo.svg)
│   ├── src/
│   │   ├── app/
│   │   │   ├── views/        # Page components (landing, auth, dashboard, profile, org, invoices)
│   │   │   ├── shared/       # Common components (headers, sidenav, dialogs), guards, services
│   │   │   ├── app.routes.ts # Centralized router configuration
│   │   │   └── app.config.ts # PrimeNG theme & dependency injection configuration
│   │   └── styles.scss       # Global CSS variables, resets & shared expansion panel themes
└── README.md                 # Primary project documentation
```

---

## 📋 Prerequisites

Ensure you have the following installed before running the project:

- **Docker & Docker Compose** (for PostgreSQL, Redis Stack, and MinIO)
- **Java Development Kit (JDK) 25+** (e.g., via [SDKMAN!](https://sdkman.io/): `sdk install java 25.0.4.r25-nik`)
- **Maven 3.9+** (or use the provided `./mvnw` wrapper)
- **Node.js 20+** and **npm 10+**
- **Angular CLI 20+** (`npm install -g @angular/cli`)

---

## 🚀 Quick Start Guide

### 1. Infrastructure Services (Docker)

Start the backing database, cache, and object storage containers:

```bash
cd backend

# Generate Redis TLS certificates if not yet created
./generate-certs.sh

# Spin up infrastructure in the background
docker compose up -d db redis minio
```

| Service | Host Port | Internal Port | URL / Notes |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `5071` | `5432` | `jdbc:postgresql://localhost:5071/merra_accounting` |
| **Redis Stack (TLS)** | `6379` | `6379` | TLS-secured cache |
| **Redis Insight** | `8001` | `8001` | `http://localhost:8001` |
| **MinIO API** | `9000` | `9000` | `http://localhost:9000` |
| **MinIO Console** | `9001` | `9001` | `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`) |

---

### 2. Backend API Service

1. Create your environment configuration file:
   ```bash
   cp backend/.env.example backend/main/.env
   ```
2. Build and launch the Spring Boot service:
   ```bash
   cd backend
   ./mvnw clean spring-boot:run -pl main
   ```
   The backend API will listen on **`http://localhost:8080`**.

---

### 3. Frontend Web Client

1. Install npm packages:
   ```bash
   cd web
   npm install
   ```
2. Verify `web/.env` endpoints point to your backend:
   ```env
   NG_APP_BASE_URL=http://localhost:8080/api/
   NG_APP_HEALTH_URL=http://localhost:8080/actuator/health/
   NG_APP_API_VERSION=1.1
   ```
3. Start the Angular dev server:
   ```bash
   ng serve
   ```
4. Access the web app at **`http://localhost:4200`**.

---

## ⚙️ Environment Configuration

### Backend (`backend/main/.env`)

```env
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5071/merra_accounting
DB_USER=brian
DB_PASSWORD=password

# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password
MAIL_DURATION=86400000

# Security & JWT Tokens (256-bit+ secret)
JWT_TOKEN_SECRET=your-secure-secret-key-at-least-256-bits-long
JWT_ACCESS_TOKEN_DURATION=3600000
JWT_VISITOR_ACCESS_TOKEN_DURATION=28800000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# Client Routing
FRONTEND_URL=http://localhost:4200
FRONTEND_REDIRECT_URL=http://localhost:4200

# Redis Cache (TLS)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=merra_account_rds

# MinIO Object Storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_REGION_STATIC=us-east-1
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

---

## 📑 API & Documentation

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/api-docs`
- **Actuator Health Endpoint**: `http://localhost:8080/actuator/health`

---

## 🧪 Testing & Quality Assurance

### Backend
```bash
cd backend

# Execute all unit and integration test suites
./mvnw clean test

# Package multi-module JAR artifacts
./mvnw clean package
```

### Frontend
```bash
cd web

# Run Angular unit tests
ng test

# Compile production bundle
npm run build
```

---

## 📚 Subproject Documentation

For module-specific internals, schema migration guides, and frontend architecture:

- 🔙 **[Backend Documentation](backend/README.md)** — JPA entity mapping, Liquibase tenant scripts, Spring Security filters, and Redis caching.
- 🎨 **[Frontend Documentation](web/README.md)** — Angular 20 components, PrimeNG integration, Signals, and theme customization.
