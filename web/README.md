# Merra Accounting - Frontend

Angular 20 frontend for the Merra Accounting platform.

## Overview

This app provides the user interface for Merra Accounting and communicates with the Spring Boot backend API.

Current focus:

- Building core accounting workflows and screens
- Integrating frontend features with backend APIs
- Improving form validation, UX, and state management

## Tech Stack

- Angular 20 (standalone components)
- Angular Material (Material 3)
- SCSS styling
- Angular Router
- Signals for reactive state in selected areas

## Prerequisites

- Node.js 20+
- npm 10+
- Angular CLI 20+

## Project Structure

```text
web/
├── src/
│   ├── app/
│   │   ├── core/             # Core app concerns (state, shared app-level logic)
│   │   ├── features/         # Feature modules/screens
│   │   ├── shared/           # Shared components, services, models, utilities
│   │   ├── views/            # Routed view/page components
│   │   ├── app.ts            # Root standalone component
│   │   ├── app.routes.ts     # Route definitions
│   │   └── app.config.ts     # App bootstrap/configuration
│   ├── styles.scss           # Global styles and Material theme setup
│   ├── index.html            # HTML entry point
│   └── main.ts               # App bootstrap entry
└── angular.json
```

## Install Dependencies

From the project root:

```bash
cd web
npm install
```

## Run in Development

```bash
cd web
ng serve
```

App URL:

- http://localhost:4200

The app auto-reloads when source files change.

## Build

```bash
cd web
ng build
```

Build artifacts are generated under `dist/`.

## Test

Run unit tests:

```bash
cd web
ng test
```

## Frontend Conventions

- Use SCSS for all component styles (`.scss` files).
- Prefer Angular Material components over custom raw HTML controls.
- Use outlined Material icons with `fontSet="material-icons-outlined"`.
- Keep components standalone and import only required Angular Material modules.
- Keep routing centralized in `src/app/app.routes.ts`.

### Buttons

- For `<button>` elements, use `matButton="filled"`.
- For `<a>` elements styled as buttons, use `matButton`.

## Backend Integration Notes

- Backend runs separately in the `backend` folder.
- Ensure backend API is running when testing integrated flows.
- API and proxy/environment settings should be aligned with your local backend URL.

## Related Documentation

- Root project guide: [../README.md](../README.md)
- Backend guide: [../backend/README.md](../backend/README.md)

Use this README for frontend-only development. For full-stack setup, read the root and backend READMEs as well.
