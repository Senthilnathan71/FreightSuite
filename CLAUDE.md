# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this workspace is

"Dofi- Working Document" is a **multi-repo workspace**, not a single project. The root is **not** a git repository — each subdirectory is its own independent git repo with its own remote, dependencies, and lifecycle. Always `cd` into a subproject before running git/npm/build commands.

The system is a **freight-forwarding / logistics CRM + accounting + booking platform** (deployed at `dofi.co` / `api.dofi.co`). It is split into NestJS backends and Angular frontends that all share one PostgreSQL database.

| Directory | Type | Name | Port | Pairs with |
|-----------|------|------|------|-----------|
| `crm-mobile-api` | NestJS 11 + Prisma | crm-api | **3008** | ng-freight-forwarding, bluefin |
| `ebooking-api` | NestJS 10 + Prisma | ebooking-api | **3009** | ng-mybooking |
| `ng-freight-forwarding` | Angular 17 | FreightForwarding | 4200 | → API 3008 |
| `bluefin` | Angular 17 | CRM | 4200 | → API 3008 |
| `ng-mybooking` | Angular 17 | CRM | 4200 | → API 3009 |
| `freight-forwarding-assets` | static files | — | — | company assets, documents, Edoc |

`bluefin` and `ng-mybooking` are near-identical Angular shells (both `package.json` name = "CRM", same module layout: `authentication`, `component`, `core`, `directives`, `layouts`, `modules`, `pipes`, `service`, `shared`, `starter`). `ng-freight-forwarding` is the largest frontend (adds `accounts`, `master`, `operation`, plus the Journal Voucher / accounting modules). The frontend↔API pairing is set by `apiUrl` in each app's `src/environments/environment.ts`.

## Commands

### NestJS APIs (`crm-mobile-api`, `ebooking-api`)
```bash
npm run start:dev          # watch-mode dev server
npm run build              # nest build → dist/src/main.js
npm run start:prod         # node dist/main
npm run lint               # eslint --fix
npm test                   # jest (all *.spec.ts under src/)
npm test -- path/to/file.spec.ts   # single test file
npm run test:e2e           # jest --config ./test/jest-e2e.json
npm run test:cov           # coverage
npx prisma generate        # regenerate client after editing prisma/schema/*.prisma
npx prisma migrate dev     # apply/create a migration (crm-mobile-api has prisma/migrations)
npm run seed               # crm-mobile-api only → prisma/seed.ts
```
`ebooking-api` adds `npm run db:schema-check` (diffs schema vs. datasource). It has **no** `migrations/` dir — schema is managed via `db push`/introspection.

### Angular frontends (`ng-freight-forwarding`, `bluefin`, `ng-mybooking`)
```bash
npm start                  # ng serve at http://localhost:4200
npm run build              # ng build → dist/
npm test                   # ng test (Karma + Jasmine, Chrome)
```
There is **no `ng lint`** configured on these apps. `ng-freight-forwarding` builds require extra heap and have extra environments:
```bash
npm run build-uat          # --max_old_space_size=14273 --configuration=uat
npm run build-awsprod      # --configuration=awsprod
```
Environments per app live in `src/environments/` (`environment.ts` dev, plus `.prod.ts`, `.qa.ts`, and for FF `.uat.ts` / `.awsprod.ts`).

### Production
Deployed with **PM2** (`prod.config.js`, `uat.config.js`, `awsprod.config.js` in each API) running `./dist/src/main.js` in cluster mode. The APIs serve **HTTPS in production** (SSL certs read from `/var/opt/npm-ssl/`); `crm-mobile-api` hard-fails at boot if `ENVIRONMENT=Production` and the cert files are missing. Do **not** uncomment the commented-out `httpsOptions` blocks in `main.ts` — the comments explicitly warn against committing them.

## Architecture notes that span files

### Shared database, two schemas in lockstep
Both APIs use Prisma with the **multi-file schema folder** feature (`prisma/schema/*.prisma`, enabled via `previewFeatures = ["prismaSchemaFolder", "views", "omitApi"]`) over **PostgreSQL** (`DATABASE_URL`). The two APIs carry an almost-identical set of schema files (`audit`, `booking`, `company`, `configuration`, `voucher`, `numberseries`, `report`, etc.) because they target the **same database** (`crm_prisma`). When you change a model that exists in both, keep the two schema folders consistent. `crm-mobile-api/.mcp.json` wires a `postgres` MCP server straight to that DB.

### Multi-company / multi-branch / financial-year isolation
This is the central domain invariant across the whole stack. Almost every query and form is scoped by **company**, **branch**, and **financial year**. On the frontend these live in `localStorage`, **encrypted**, and are read through `AppSettingsService`:
- `selected-company` → `CompanyMasterSid`
- `selected-branch` → `BranchMasterSid`
- `current-year-id`

List/search components extend `BaseListComponent` and must include `CompanyMasterSid` + `BranchMasterSid` in their search params. When adding any data-fetching feature, thread these through or you will leak/return cross-tenant data.

### Frontend shared layer
Reusable building blocks live under each app's `src/app/shared/` and `src/app/core/`:
- `ReusableTableComponent` (sort/filter/actions grid), `BaseListComponent` (paginated list base), `PageHeaderComponent`
- `AppSettingsService` (settings, **crypto-js** encryption, notifications), `PaginationService`, `ExcelExportService`, `DropdownStore` (caches master data: currencies, ports, vessels, countries, departments)
- New features use **standalone components** + **reactive forms**.

### Auth differs between the two APIs
- `crm-mobile-api`: **cookie-based** JWT (`cookie-parser`, `addCookieAuth`), strict CORS allow-list from `FRONTEND_DESKTOP_URL` / `FRONTEND_MOBILE_URL` env vars (boot throws if unset), plus `http://localhost:4200`.
- `ebooking-api`: **bearer-token** JWT, `enableCors()` open.

Swagger UI is mounted at **`/documentation`** on both APIs (disabled in production on `crm-mobile-api`).

### crm-mobile-api heavy features
Beyond CRUD it does document processing: **OCR** (`tesseract.js`, `pdf2pic`, `pdf-poppler`, `sharp`, `canvas`) in the `ocr` module, and **PDF/Excel generation** (`pdfmake`, `pdfkit`, `exceljs`, `xlsx`). Module set: `accounts`, `crm`, `crm-desktop`, `dashboard`, `masters`, `operation`, `public-quotation`, `sales`, `settings`, `shortcut`. `@nestjs/schedule` is used for cron-style report scheduling (`report-schedule.prisma`).

## Per-project deep-dive docs
When touching these areas, read the matching doc first:
- `ng-freight-forwarding/README.md` — accounting modules, Journal Voucher, frontend conventions
- `ng-freight-forwarding/INVOICE-CURRENCY-FLOW.md` — multi-currency invoice logic
- `ebooking-api/TRACKING_DOCUMENTS_FLOW.md` — booking document tracking flow
