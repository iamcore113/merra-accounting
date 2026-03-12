## merra-accounting — Copilot instructions

This file provides concise, actionable facts for AI coding agents working on the merra-accounting monorepo.

---

## Repository Structure

This is a **monorepo** with two main directories:

- **`backend/`** — Java 25 Spring Boot 4.0.0 multi-module Maven backend
- **`web/`** — Angular 20.x frontend application

---

## Backend Instructions (`/backend` directory)

### Overview

- Multi-module Maven backend under `backend/` (Java 25, Spring Boot 4.0.0).
- Top-level modules (declared in `backend/pom.xml`): `main`, `auth`, `commons`, `user`, `organization`.
- `main` is the Spring Boot application and depends on the other modules (see [`backend/main/pom.xml`](backend/main/pom.xml)).

### Quick architecture summary

- `main`: Spring Boot app (web, JPA, Liquibase). Entrypoint and runtime app logic.
- `auth`, `user`, `organization`, `commons`: domain or shared libraries packaged as Maven modules and included as dependencies in `main`.
- DB migrations: Liquibase change-logs referenced from [`backend/main/src/main/resources/db/changelog/db.changelog-master.xml`](backend/main/src/main/resources/db/changelog/db.changelog-master.xml) (see [`application.yaml`](backend/main/src/main/resources/application.yaml)).

### Build & run (developer workflows)

- Build entire backend (Windows PowerShell):
  - `cd backend; .\mvnw.cmd clean package`
- Run only the `main` app (rebuild modules it depends on):
  - `cd backend; .\mvnw.cmd -pl main -am spring-boot:run`
  - `-pl` = project list, `-am` = also make required modules
- Run tests for a specific module:
  - `cd backend; .\mvnw.cmd -pl main test` (or replace `main` with `auth`, `user`, ...)
- Local DB via Docker Compose (for `main`):
  - `docker compose -f backend/main/compose.yaml up -d` (exposes Postgres at host:5070 by default)

### Environment and configuration

- [`backend/main/src/main/resources/application.yaml`](backend/main/src/main/resources/application.yaml) uses environment variables for DB and JWT secrets (examples):
  - `DB_URL` (used for `spring.datasource.url` and liquibase.url)
  - `JWT_TOKEN_SECRET` / `JWT_ACCESS_TOKEN_DURATION` etc.
- Tests and surefire: [`backend/pom.xml`](backend/pom.xml) sets surefire system properties from environment variables (DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET). Provide those when running CI/tests.
- The project uses `me.paulschwarz:spring-dotenv` to load .env-style variables.

### Key patterns & developer notes

- MapStruct: annotation processing is configured in [`backend/pom.xml`](backend/pom.xml) via maven-compiler-plugin; generated mappers live in target/generated-sources/annotations.
- SpringDoc/OpenAPI available (path configured to `/api-docs` in [`application.yaml`](backend/main/src/main/resources/application.yaml)).
- Liquibase: changeLog location referenced in [`application.yaml`](backend/main/src/main/resources/application.yaml) at `db/changelog/db.changelog-master.xml` — edit that file to add DB changesets.
- Adding a module: add `<module>your-module</module>` to [`backend/pom.xml`](backend/pom.xml) and ensure its POM has `<parent>` pointing to `backend`.

### Where to look first (examples)

- [`backend/pom.xml`](backend/pom.xml) — parent POM, Java version, dependencyManagement, modules list.
- [`backend/main/pom.xml`](backend/main/pom.xml) — runtime app dependencies and spring-boot plugin.
- [`backend/main/src/main/resources/application.yaml`](backend/main/src/main/resources/application.yaml) — runtime properties, env var names, Liquibase path.
- [`backend/main/compose.yaml`](backend/main/compose.yaml) — local Postgres + Adminer for development.

### Constraints & expectations for code changes

- Preserve module boundaries; most runtime code lives under `backend/main/src/main/java/org/merra` and shared code under other module sources.
- Prefer changing Liquibase changelogs rather than programmatic schema DDL; `spring.jpa.hibernate.ddl-auto` is set to `none` in config.
- Mind annotation processors (MapStruct) — ensure generated sources compile.

### Examples (PowerShell)

- Build & run main with local DB:
  - `cd backend; docker compose -f main/compose.yaml up -d`
  - `$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5070/merradb'`
  - `.\mvnw.cmd -pl main -am spring-boot:run`

### If you need more context

- Read module-level tests under each module's `src/test/java` to learn domain specifics.
- Search for `db/changelog` to find Liquibase changesets.

---

## Frontend Instructions (`/web` directory)

### Overview

- Angular 20.x application using standalone components
- Styling: **SCSS** (not CSS) — always use `.scss` files
- UI Framework: **Angular Material** — prioritize Material components over custom HTML elements
- Build tool: Angular CLI

### Development server

```bash
cd web
ng serve
```

The app will be available at `http://localhost:4200/` and will auto-reload on changes.

### Styling Guidelines

- **Use SCSS exclusively** — all component styles should be `.scss` files
- **Access Material theme variables** using:
  ```scss
  @use "@angular/material" as mat;
  ```
- Example theme usage:
  ```scss
  .my-component {
    background-color: var(--mat-sys-surface);
    color: var(--mat-sys-on-surface);
  }
  ```
- Global styles are in [`web/src/styles.scss`](web/src/styles.scss)

### Component Guidelines

- **Always check `@angular/material` first** before creating custom components
- Use Material components for:
  - Buttons: `MatButtonModule`
  - Form fields: `MatFormFieldModule`, `MatInputModule`
  - Select dropdowns: `MatSelectModule`
  - Snackbar: `MatSnackBarModule`
  - Stepper: `MatStepperModule`
  - Cards: `MatCardModule`
  - Icons: `MatIconModule`
  - Checkbox: `MatCheckboxModule`
  - Dialog/Modal: `MatDialog`
  - Progress spinners: `MatProgressSpinnerModule`
  - And all other UI elements

### Button Styling Rules

- **For `<button>` tags**: always add `matButton="filled"` attribute
  ```html
  <button matButton="filled" type="button">Submit</button>
  ```
- **For `<a>` link tags**: always add `matButton` attribute
  ```html
  <a matButton href="/somewhere">Go</a>
  ```

### Icon Guidelines

- **Always use outlined Material Icons** (not filled)
- Set the font set to outlined:
  ```html
  <mat-icon fontSet="material-icons-outlined">mail</mat-icon>
  ```
- The outlined icon font is already imported in [`web/src/index.html`](web/src/index.html):
  ```html
  <link
    href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
    rel="stylesheet"
  />
  ```

### Component Structure

- Use standalone components (no NgModule declarations needed)
- Import only the Material modules you need in each component:
  ```typescript
  @Component({
    selector: 'app-example',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatFormFieldModule],
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.scss']
  })
  ```

### Routing

- Routes are defined in [`web/src/app/app.routes.ts`](web/src/app/app.routes.ts)
- Use Angular Router for navigation
- Example:
  ```typescript
  export const routes: Routes = [
    { path: "", redirectTo: "home", pathMatch: "full" },
    { path: "home", component: HomeComponent },
  ];
  ```

### Building

```bash
cd web
ng build
```

Build artifacts will be stored in the `dist/` directory.

### Testing

- Unit tests: `ng test`
- Test files use `.spec.ts` extension
- Configure tests in component spec files using Angular Testing utilities

### Code Generation

- Generate new component:
  ```bash
  ng generate component component-name
  ```
- Always use `--skip-tests` if you don't need test files initially
- Components are generated as standalone by default

### Common Patterns

- **Forms**: Use `ReactiveFormsModule` or `FormsModule` with Material form fields
- **HTTP**: Import `HttpClient` from `@angular/common/http`
- **Signals**: Use Angular signals for reactive state management (see [`app.ts`](web/src/app/app.ts))
- **Images**: Use `NgOptimizedImage` directive for better performance

### Material Theme Configuration

The app uses a custom Material 3 theme defined in [`web/src/styles.scss`](web/src/styles.scss):

- Primary palette: `mat.$azure-palette`
- Tertiary palette: `mat.$blue-palette`
- Typography: 'Inter' font family
- Color scheme: light mode by default

### File Organization

```
web/
├── src/
│   ├── app/
│   │   ├── shared/         # Shared components
│   │   ├── views/          # Page components
│   │   ├── app.ts          # Root component
│   │   ├── app.routes.ts   # Route definitions
│   │   └── app.config.ts   # App configuration
│   ├── styles.scss         # Global styles & Material theme
│   ├── index.html          # HTML entry point
│   └── main.ts             # Bootstrap entry point
└── angular.json            # Angular CLI config
```

---

## When editing this file

- If you add or change workflows, update this file (keep it concise). Ask the repo owner if you need infra credentials or CI details.
- Keep backend and frontend instructions clearly separated.
- Update examples when adding new patterns or conventions.
