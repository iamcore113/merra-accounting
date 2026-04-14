# MERRA Accounting & Bookkeeping

<img src="web/public/wave-icon.svg" alt="Wave Icon" width="200" height="100">

MERRA is an in-progress accounting and bookkeeping platform focused on practical tools for small business finance workflows.

## Project Status

> [!WARNING]
> This project is actively under development and is not production-ready yet.

Current state:

- Core backend and frontend foundations are in place
- Features are still being implemented and refined
- APIs, UI flows, and data model details may change
- Expect incomplete functionality and occasional breaking changes

## Repository Overview

This monorepo contains two main applications:

- [backend](backend): Java 25 + Spring Boot 4 multi-module API and business logic
- [web](web): Angular 20 frontend application

## Read These Next

For setup steps, environment variables, run commands, and module-specific guidance, use the dedicated READMEs:

- [backend/README.md](backend/README.md)
- [web/README.md](web/README.md)

These are the source of truth for day-to-day development.

## Backend Environment Variables (Quick Reference)

Use this as a quick key reference:

```env
DB_URL="your JDBC database url"
DB_USER="database username"
DB_PASSWORD="database password"
MAIL_HOST="SMTP server host"
MAIL_PORT="your port"
MAIL_USERNAME="mail username"
MAIL_PASSWORD="mail password"
MAIL_DURATION="email duration"
JWT_TOKEN_SECRET="your token secret"
JWT_ACCESS_TOKEN_DURATION="access token duration"
JWT_REFRESH_TOKEN_EXPIRATION="expiration in milliseconds"
FRONTEND_URL="your web address"
```

For complete backend configuration details and latest required values, see [backend/README.md](backend/README.md).
