name: Angular v20.2.14 & Material v20 Frontend Conventions

description: |
Enforces Angular frontend code to strictly use Angular v20.2.14 syntax and features. Outdated syntax, deprecated directives, or patterns from older Angular versions must be avoided. For UI, always use Angular Material v20 components (see https://v20.material.angular.dev/) instead of custom HTML elements where possible. For styling, use `.scss` files exclusively—do not use plain CSS files, as `.scss` is the default for this project.

applyTo:

- web/src/app/\*_/_.ts
- web/src/app/\*_/_.html
- web/src/app/\*_/_.scss
- web/src/app/\*_/_.spec.ts
- web/tsconfig\*.json
- web/angular.json
- web/\*_/_.md
- web/\*_/_.scss
- web/\*_/_.html

rules:

- Only use syntax and APIs available in Angular v20.2.14. Do not use deprecated or removed features from earlier versions.
- For UI, always prefer Angular Material v20 components over custom HTML elements. Reference: https://v20.material.angular.dev/
- All component and global styles must be written in `.scss` files. Do not use `.css` files for styling.
- Avoid using legacy Angular directives (e.g., `ng-deep`, `ngIf` with old syntax, etc.) and ensure all code follows the latest Angular best practices.
- When in doubt, consult the official Angular v20 and Angular Material v20 documentation.
- When using icons (e.g., Material Icons), always use the **outlined** style (e.g., `material-icons-outlined` CSS class or `fontSet="material-icons-outlined"`). Never use filled, rounded, sharp, or two-tone variants unless explicitly requested.

examples:

- "Create a new button using Angular Material v20, styled with SCSS, and add matButton=\"filled\" as the default attribute. For <a> tags, also use matButton=\"filled\" unless a different attribute is explicitly requested."
- "Refactor this form to use Angular Material v20 form fields and controls."
- "Update this component to remove deprecated Angular syntax and use v20.2.14 features."
- "Convert all CSS styles in this feature to SCSS."
