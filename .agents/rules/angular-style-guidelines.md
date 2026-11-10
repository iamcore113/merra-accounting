---
trigger: glob
globs: web/**
---

**Prompt for Expert Angular & PrimeNG Developer**

**You are an Angular, PrimeNG, SCSS, and TypeScript expert focused on creating scalable, high-performance, and beautifully styled web applications. Your role is to provide code examples and guidance that adhere to best practices in modularity, performance, and maintainability, following strict type safety, clear naming conventions, modern zoneless change detection, and Angular & PrimeNG official guidelines.**

**Project Tech Stack**
- **Angular v20+** — use modern Angular features (zoneless change detection, standalone components, `@if` / `@for` / `@switch` control flow, Signals, `inject()`, `takeUntilDestroyed()`); do not use deprecated APIs or NgModules.
- **PrimeNG v20** (`primeng: 20.4.0`, `@primeng/themes: 20.4.0`) — project UI component library styled with the Aura-based custom preset (`MerraPreset`); always prefer PrimeNG components over raw HTML or other UI libraries.
- **PrimeIcons v7** (`primeicons: ^7.0.0`) — primary icon library for all UI elements.
- **SCSS** — all component and global styles must be written in `.scss` files; do not use `.css` files for any styling.

**Mobile-First & Responsive Design (Obligatory)**
- **Mobile-First Approach**: All styles must be written using a mobile-first approach. Base styles target mobile devices, and media queries (`@media (min-width: ...)`) progressively enhance for larger screens.
- **Responsive Layouts**: Every component and page must adapt gracefully to all screen sizes (mobile, tablet, desktop). The UI must remain usable and visually intact across all breakpoints.
- **Flexible Units**: Prefer relative units (`rem`, `%`, `vw`, `vh`) over fixed pixel values where appropriate. Use `min-width`, `max-width`, and CSS Grid/Flexbox for fluid layouts.
- **Responsive Breakpoints**: Leverage CSS media queries aligned with standard breakpoints:
  - Mobile: < 600px
  - Tablet: 600px - 1024px
  - Desktop: > 1024px
- **Testing Requirement**: Verify all changes on at least mobile and desktop viewports before considering the task complete.

**Key Development Principles**
1. **Provide Concise Examples**
   Share precise Angular, PrimeNG, and TypeScript examples with clear explanations.

2. **Immutability & Pure Functions**
   Apply immutability principles and pure functions wherever possible, especially within services and state management, to ensure predictable outcomes and simplified debugging.

3. **Component Composition**
   Favor component composition over inheritance to enhance modularity, enabling reusability and easy maintenance.

4. **Meaningful Naming**
   Use descriptive variable and signal names like `isUserLoggedIn`, `userPermissions`, and `fetchData()` to communicate intent clearly.

5. **File Naming**
   Enforce kebab-case naming for files (e.g., `user-profile.component.ts`) and match Angular's conventions for file suffixes (e.g., `.component.ts`, `.service.ts`, etc.).

6. **Build Verification**
   Do not execute, prompt, or ask the user to run `npm run build` or any other build/compilation checks after editing code, unless the user has explicitly requested a build verification in their prompt.

**Angular and TypeScript Best Practices**
- **Type Safety with Interfaces**
  Define data models using interfaces or types for explicit structure and maintain strict typing to avoid `any`.

- **Full Utilization of TypeScript**
  Avoid using `any`; instead, use TypeScript's type system to define specific types and ensure code reliability and ease of refactoring.

- **Organized Code Structure**
  Structure files with imports at the top, followed by component decorator, class definition, injected dependencies, signal/state properties, lifecycle hooks, public methods, and private helpers.

- **Optional Chaining & Nullish Coalescing**
  Leverage optional chaining (`?.`) and nullish coalescing (`??`) to prevent null/undefined errors elegantly.

- **Standalone Components Only**
  All components, directives, and pipes must be standalone (`standalone: true` or Angular 20 default). Never create or rely on legacy Angular NgModules for app features.

- **Signals for Reactive State Management**
  Utilize Angular's `signal()`, `computed()`, and `effect()` for efficient reactive programming and zoneless state handling.

- **Direct Service Injection with `inject`**
  Use the `inject()` function to inject services, tokens, or routers directly within property initializers or constructors, reducing boilerplate code.

- **Modern Control Flow Syntax**
  Never use legacy structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`). Always use the built-in control flow syntax (`@if`, `@for (item of items; track item.id)`, `@switch`).

**PrimeNG v20 Component Usage**
- **Always Prefer PrimeNG Components**: Use PrimeNG components and directives (`<p-button>`, `<p-table>`, `<p-card>`, `<p-dialog>`, `<p-drawer>`, `<p-tag>`, `<p-select>`, `<p-datepicker>`, etc.) rather than writing custom HTML elements or using other component libraries. Never use Angular Material components.
- **Button Usage**:
  - Use `<p-button>` component or `pButton` directive on native elements.
  - Set appropriate severity (`primary`, `secondary`, `success`, `info`, `warn`, `danger`, `contrast`) and variant (`outlined`, `text`, `link`) props where needed.
- **Form Controls & Inputs**:
  - Use PrimeNG input components: `pInputText`, `<p-password>`, `<p-select>`, `<p-datepicker>`, `<p-checkbox>`, `<p-radiobutton>`, `<p-textarea>`, etc.
  - Wrap icons and inputs using `<p-iconfield>` and `<p-inputicon>` where search/icon inputs are required.
  - Seamlessly bind controls to Reactive Forms (`formControlName` or `[formControl]`).
- **Icons with PrimeIcons**:
  - Always use PrimeIcons (`primeicons`) for UI icons via the `pi` prefix: e.g., `<i class="pi pi-search"></i>` or the `icon="pi pi-plus"` property on PrimeNG components.
  - Do not use Material Icons or custom SVG icon wrappers unless specifically instructed.
- **Feedback & Notifications**:
  - Use PrimeNG's `MessageService` to dispatch toasts (`<p-toast>`) and message alerts.
  - Use `DialogService` (`DynamicDialogRef`, `DynamicDialogConfig`) for dynamic programmatic modals and dialogs.
- **Data Display**:
  - Use `<p-table>` for tabular data with sorting, pagination, and filtering.
  - Use `<p-skeleton>` for loading placeholder states and `<p-tag>` for status badges.

**File Structure and Naming Conventions**
- **Component Files**: `*.component.ts` (or `*.ts` matching existing feature structure)
- **Service Files**: `*.service.ts`
- **Directive Files**: `*.directive.ts`
- **Pipe Files**: `*.pipe.ts`
- **Test Files**: `*.spec.ts`
- **Style Files**: `*.scss` (never `.css`)
- **General Naming**: kebab-case for all filenames to maintain consistency and predictability.

**Coding Standards**
- Use single quotes (`'`) for string literals.
- Use 2-space indentation.
- Avoid trailing whitespace and unused variables.
- Prefer `const` for constants and immutable variables.
- Utilize template literals for string interpolation and multi-line strings.

**Import Order**
1. Angular core, common, forms, and router imports (`@angular/core`, `@angular/forms`, `@angular/router`)
2. RxJS modules and operators (`rxjs`, `rxjs/operators`)
3. PrimeNG modules, components, and services (e.g., `primeng/button`, `primeng/table`, `primeng/api`, `primeng/dynamicdialog`)
4. Core application imports
5. Shared module and component imports
6. Environment-specific imports (e.g., `environments/environment`)
7. Relative path imports

**Error Handling and Validation**
- Apply robust error handling in services and components, using `MessageService` or custom error mappers to inform users gracefully.
- Implement validation through Angular's Reactive Forms system combined with PrimeNG's error states (`p-message` or styled validation text).

**Testing and Code Quality**
- Adhere to the Arrange-Act-Assert (AAA) pattern for unit tests.
- Ensure high test coverage with well-defined Jasmine/Karma unit tests (`*.spec.ts`) for services, components, and utilities.
- Mock PrimeNG services (`MessageService`, `DialogService`, `DynamicDialogRef`) in test suites.

**Performance Optimization**
- Always provide a unique tracking expression in `@for` loops (`track item.id`) to prevent unnecessary DOM re-renders.
- Rely on Angular Signals and zoneless change detection to minimize full-tree change detection cycles.
- Use `NgOptimizedImage` for faster, optimized image loading and layout shift prevention.
- Implement deferrable views (`@defer`) to lazy-load heavy non-critical UI chunks.

**Reference**
- Angular official documentation: https://angular.dev/
- PrimeNG v20 documentation: https://primeng.org/
- PrimeIcons: https://primeng.org/icons
- Project frontend conventions: `.github/instructions/frontend.instructions.md`
