name: Angular v20+ & PrimeNG v20 Frontend Conventions

description: |
  Enforces Angular frontend code to strictly use Angular v20+ modern syntax (zoneless change detection, standalone components, Signals, modern control flow). Outdated syntax, deprecated directives, or legacy patterns must be avoided. For UI, always use PrimeNG v20 components (see https://primeng.org/) styled with the Aura-based preset and PrimeIcons (see https://primeng.org/icons). For styling, use `.scss` files exclusively—do not use plain CSS files.

applyTo:

- web/src/app/**/*.ts
- web/src/app/**/*.html
- web/src/app/**/*.scss
- web/src/app/**/*.spec.ts
- web/tsconfig*.json
- web/angular.json
- web/**/*.md
- web/**/*.scss
- web/**/*.html

rules:

- Only use syntax and APIs available in Angular v20+. Do not use deprecated or removed features from earlier versions.
- For UI, always prefer PrimeNG v20 components (e.g. `<p-button>`, `<p-table>`, `<p-select>`, `<p-dialog>`, `<p-card>`, etc.) over custom HTML elements or other UI libraries. Reference: https://primeng.org/
- For icons, always use PrimeIcons (`primeicons` with `pi pi-<icon-name>`). Do not use Material Icons.
- All component and global styles must be written in `.scss` files. Do not use `.css` files for styling.
- Avoid using legacy Angular directives (e.g., `ng-deep`, `ngIf` / `ngFor` structural directives) and use modern control flow (`@if`, `@for`, `@switch`).
- Use Angular Signals and zoneless change detection best practices.
- Use `MessageService` for notifications and `DialogService` for dynamic dialogs.
- When in doubt, consult the official Angular and PrimeNG v20 documentation.

examples:

- "Create a new button using PrimeNG v20 with <p-button> and appropriate severity/variant."
- "Refactor this form to use PrimeNG form controls (pInputText, <p-select>, <p-datepicker>, <p-iconfield>, etc.)."
- "Update this component to use modern Angular v20+ control flow and Signals."
- "Convert all CSS styles in this feature to SCSS."
