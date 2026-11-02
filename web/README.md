<div align="center">
  <img src="public/merra-logo.svg" alt="MERRA Logo" width="300">
  <br />
  <p><strong>Merra Accounting - Web Application Client</strong></p>
  <p><em>Angular 20 Standalone Architecture powered by PrimeNG 20</em></p>
</div>

---

## Overview

The `web` workspace provides the responsive accounting interface for Merra, communicating with the Spring Boot REST API.

Key workflows covered:
- **Authentication & Setup**: Sign up, sign in, email confirmation, profile personalization, and multi-step organization creation.
- **Organization Management**: Multi-entity affiliation, address configuration, and financial year-end dates.
- **Invoicing System**: Sales and purchase invoice management, draft/approval states, and line-item tax calculations.
- **Contacts Directory**: Suppliers and customers with ledger categorization.
- **Personal Profile**: Password management, personal details, and linked organizations.

---

## Tech Stack

- **Framework**: Angular 20 (Standalone Components, Signals, new Control Flow)
- **Component Library**: PrimeNG 20.4.0 (Aura preset customized with flat botanical green `#689D4B` theme)
- **Icons**: PrimeIcons (`pi`)
- **Styling**: SCSS (minimal border radius, flat aesthetics, responsive flex/grid layouts)
- **Router**: Angular Router with centralized lazy-loaded routes
- **Forms**: ReactiveFormsModule with typed FormGroups

---

## Prerequisites

- **Node.js**: 20+
- **npm**: 10+
- **Angular CLI**: 20+ (`npm install -g @angular/cli`)

---

## Project Structure

```text
web/
├── public/                   # Static assets & SVG icons (merra-logo.svg)
├── src/
│   ├── app/
│   │   ├── features/         # Specialized workflows (e.g. create-invoice)
│   │   ├── shared/
│   │   │   ├── api/          # Environment-driven endpoints (base.ts, auth.ts, org.ts)
│   │   │   ├── components/   # MainHeader, MainSidenav, MainLayout, Dialogs
│   │   │   ├── guards/       # AuthGuard, OfflineGuard
│   │   │   ├── interceptors/ # AuthInterceptor, InitInterceptor
│   │   │   ├── models/       # TypeScript API models and responses
│   │   │   └── services/     # UserService, OrganizationService, InvoiceService, etc.
│   │   ├── views/            # Top-level view routes
│   │   │   ├── landing-page/ # SaaS landing page
│   │   │   ├── signin/       # Authentication sign-in
│   │   │   ├── signup/       # Account registration
│   │   │   ├── main/         # Main workspace views (home, profile, org, invoices, contacts)
│   │   │   └── offline-page/ # Connection lost & system health fallback
│   │   ├── app.routes.ts     # Route mapping
│   │   └── app.config.ts     # PrimeNG & HTTP Client providers
│   ├── styles.scss           # Global tokens, buttons, form controls & expansion panels
│   └── main.ts               # Application entry point
├── set-env.js                # Environment injection script before build
└── angular.json
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Environment Configuration

The environment file `.env` controls API endpoints:

```env
NG_APP_BASE_URL=http://localhost:8080/api/
NG_APP_HEALTH_URL=http://localhost:8080/actuator/health/
NG_APP_API_VERSION=1.1
```

Running `npm start` or `npm run build` executes `set-env.js` which generates `src/app/shared/api/base.ts`.

### 3. Run Development Server

```bash
ng serve
```

Access the frontend at **`http://localhost:4200`**.

### 4. Build Production Bundle

```bash
npm run build
```

The compiled bundle is generated in `dist/web/`.

---

## UI Conventions & Guidelines

- **Primary Color**: `#689D4B` (hover `#58883e`, active `#497332`, light background `#f4f8f1`).
- **Aesthetic**: Flat design, minimal border radii (`4px` or `0`), high-contrast slate text (`#1e293b` / `#0f172a`).
- **Icons**: Use PrimeIcons (`<i class="pi pi-..."></i>`).
- **Inputs & Fields**: Prefer PrimeNG components (`p-select`, `p-datepicker`, `p-iconfield`, `p-inputicon`, `p-table`). Small size `[pSize]="'small'"` is preferred for dense accounting data views.
