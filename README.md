# Herokuapp Web UI Auditing — TypeScript

[![Auditing Tests](https://github.com/Vanegas2020/Herokuapp_Web_UI_Auditing_TS/actions/workflows/auditing.yml/badge.svg)](https://github.com/Vanegas2020/Herokuapp_Web_UI_Auditing_TS/actions/workflows/auditing.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.50+-green?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?logo=typescript)
![Target](https://img.shields.io/badge/Target-Herokuapp%20Login-informational)

A **Web UI field validation audit suite** targeting [The Internet Herokuapp](https://the-internet.herokuapp.com/login) — a widely used QA practice application. This project goes beyond functional testing: it inspects every input field from DOM attributes to runtime behavioral security, producing a scored HTML report that classifies each field's validation maturity.

---

## What This Project Audits

The suite targets the Herokuapp Login page and validates its input fields against **two layers of checks**:

| Layer | What it tests |
|-------|--------------|
| **Declarative** | DOM structure — `type` attributes, `required`, `autocomplete`, `maxlength`, ARIA labels |
| **Behavioral** | Runtime security — invalid payloads injected to verify frontend blocking and backend rejection |

Each field receives a **Field Quality Index (FQI)** score and a **Validation Maturity State** classification:

| State | Meaning |
|-------|---------|
| `ROBUST_FULL_STACK` | Frontend blocks + backend rejects |
| `FRONTEND_ONLY` | Frontend blocks, backend not tested |
| `BACKEND_ONLY` | Frontend passes, backend rejects |
| `WEAK_VALIDATION` | Partial checks detected |
| `ABSENT` | No validation found |
| `FALSE_POSITIVE` | Apparent validation that doesn't function |

---

## Test Categories

### DOM / Declarative Checks
- Input `type` attribute correctness (`password`, `email`, `text`, etc.)
- `required` attribute presence on mandatory fields
- `autocomplete` configuration (e.g. `off` for passwords)
- ARIA labeling and accessibility attributes
- `maxlength` / `minlength` constraints

### Behavioral / Security Checks
- **Boundary probing** — values at min/max length limits
- **Format injection** — invalid email formats, disallowed characters
- **XSS payloads** — script tags and event handler injection via form fields
- **SQL injection** — classic and encoded variants
- **Empty / whitespace-only submissions**
- **Oversized payloads** — values far exceeding expected limits

---

## Project Structure

```
.
├── audit-engine/                # Core analysis modules
├── tests/
│   ├── login.audit.spec.ts      # Full audit spec for the Login page
│   └── global-setup.ts          # Pre-run setup
├── reports/
│   └── auditing/                # Generated HTML audit reports
├── .github/workflows/
│   └── auditing.yml             # GitHub Actions CI/CD pipeline
├── playwright.config.ts
└── .env.example
```

---

## CI/CD

Tests run automatically on every push and pull request via GitHub Actions:

- **Node.js 22** on `ubuntu-latest`
- Chromium only (audit consistency)
- Playwright HTML report uploaded as artifact on every run (30-day retention)
- Audit reports (`reports/auditing/`) uploaded as a separate artifact
- `PAGE_URL_LOGIN` configurable via repository secret to point at any environment

See [`.github/workflows/auditing.yml`](.github/workflows/auditing.yml).

---

## Setup

### Prerequisites
- Node.js ≥ 22.0.0
- npm

### Install

```bash
npm install
npx playwright install --with-deps chromium
```

### Configure (optional)

```bash
cp .env.example .env
# Edit .env — only needed to override the default page URL or enable headed mode
```

---

## Running Tests

```bash
# Run full audit suite
npm test

# Run with browser visible (debugging)
HEADED=true npm test

# Open Playwright HTML report
npx playwright show-report

# Open audit report
open reports/auditing/index.html
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PAGE_URL_LOGIN` | `https://the-internet.herokuapp.com/login` | Override page URL for staging/prod |
| `HEADED` | `false` | Set `true` to see the browser during the run |
| `SLOWMO` | `0` | Milliseconds to slow down each action (debugging) |
| `WORKERS` | `1` | Parallel worker count |

---

## Stack

| Tool | Version | Role |
|------|---------|------|
| [Playwright](https://playwright.dev/) | ^1.50 | Browser automation + test runner |
| TypeScript | ^5.7 | Type-safe test authoring |
| Node.js | ≥22 | Runtime |
| GitHub Actions | — | CI/CD |
