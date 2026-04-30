## merra-accounting — Frontend Instructions (Angular)

This file provides concise, actionable facts for AI coding agents working on the merra-accounting frontend.

---

## Frontend Overview

- Angular 20.x application using standalone components
- **Strict Versioning:** When working with Angular, always strictly follow Angular version **20.2.14**. Avoid using old or outdated syntax from previous Angular versions, including deprecated or legacy directives such as `*ngFor`, `*ngIf`, etc. Use only the syntax and APIs recommended for Angular 20.2.14. Refer to the official Angular and Angular Material v20 documentation for up-to-date usage.
- Styling: **SCSS** (not CSS) — always use `.scss` files
- UI Framework: **Angular Material v20** — prioritize Material components over custom HTML elements
- Version alignment: The project is on Angular **20.2.14**, so use Angular Material **v20** guidance and APIs from https://v20.material.angular.dev/
- Build tool: Angular CLI

---

## Development Server

```bash
cd web
ng serve
```

The app will be available at `http://localhost:4200/` and will auto-reload on changes.

---

## Styling Guidelines

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

---

## Component Guidelines

- **Always check Angular Material v20 docs first** before creating custom components: https://v20.material.angular.dev/
- Use APIs and examples compatible with Angular Material v20; avoid snippets from older/newer major versions.
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

---

## Button Styling Rules

- **For `<button>` tags**: always add `matButton="filled"` attribute
  ```html
  <button matButton="filled" type="button">Submit</button>
  ```
- **For `<a>` link tags**: always add `matButton` attribute
  ```html
  <a matButton href="/somewhere">Go</a>
  ```

---

## Icon Guidelines

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

---

## Component Structure

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

### Component Lifecycle

- **Always implement `OnInit`** in every component to handle initialization logic:

  ```typescript
  import { Component, OnInit } from "@angular/core";

  @Component({
    selector: "app-example",
    standalone: true,
    imports: [
      /* ... */
    ],
    templateUrl: "./example.component.html",
    styleUrls: ["./example.component.scss"],
  })
  export class ExampleComponent implements OnInit {
    ngOnInit(): void {
      // Initialize component logic here
    }
  }
  ```

- This ensures proper lifecycle management and makes the component's initialization intent explicit

---

## Routing

- Routes are defined in [`web/src/app/app.routes.ts`](web/src/app/app.routes.ts)
- Use Angular Router for navigation
- Example:

  ```typescript
  export const routes: Routes = [
    { path: "", redirectTo: "home", pathMatch: "full" },
    { path: "home", component: HomeComponent },
  ];
  ```

- **When navigating to routes in templates, always use the `RouterLink` directive from `@angular/router` instead of plain `href`.**
  - Import `RouterLink` in the `imports` array of your standalone component:
    ```typescript
    import { RouterLink } from '@angular/router';
    // ...
    @Component({
      // ...
      imports: [RouterLink, /* other modules */],
      // ...
    })
    ```
  - Use `[routerLink]` in your template for navigation:
    ```html
    <a matButton [routerLink]="['/home']">Go Home</a>
    ```
  - **Do not use `href` for internal navigation.**

---

## Building

```bash
cd web
ng build
```

Build artifacts will be stored in the `dist/` directory.

---

## Testing

- Unit tests: `ng test`
- Test files use `.spec.ts` extension
- Configure tests in component spec files using Angular Testing utilities

---

## Code Generation

- Generate new component:
  ```bash
  ng generate component component-name
  ```
- Always use `--skip-tests` if you don't need test files initially
- Components are generated as standalone by default

---

## Common Patterns

- **Forms**: Use `ReactiveFormsModule` or `FormsModule` with Material form fields
- **HTTP**: Import `HttpClient` from `@angular/common/http`
- **Read route state**: Use `ActivatedRoute` to access route parameters and query parameters
- **Signals**: Use Angular signals for reactive state management (see [`app.ts`](web/src/app/app.ts))
- **Images**: Use `NgOptimizedImage` directive for better performance

---

## Material Theme Configuration

The app uses a custom Material 3 theme defined in [`web/src/styles.scss`](web/src/styles.scss):

- Primary palette: `mat.$azure-palette`
- Tertiary palette: `mat.$blue-palette`
- Typography: 'Inter' font family
- Color scheme: light mode by default

---

## File Organization

```
web/
├── src/
│   ├── app/
│   │   ├── shared/         # Shared components, interceptors, models, services, api
│   │   ├── views/          # Page components
│   │   ├── app.ts          # Root component
│   │   ├── app.routes.ts   # Route definitions
│   │   └── app.config.ts   # App configuration
│   ├── styles.scss         # Global styles & Material theme
│   ├── index.html          # HTML entry point
│   └── main.ts             # Bootstrap entry point
└── angular.json            # Angular CLI config
```
