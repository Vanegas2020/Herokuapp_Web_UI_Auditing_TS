# Herokuapp Web UI Auditing — TypeScript

[![Auditing Tests](https://github.com/Vanegas2020/Herokuapp_Web_UI_Auditing_TS/actions/workflows/auditing.yml/badge.svg)](https://github.com/Vanegas2020/Herokuapp_Web_UI_Auditing_TS/actions/workflows/auditing.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.50+-green?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?logo=typescript)
![Engine](https://img.shields.io/badge/Audit%20Engine-7%20modules-purple)
![Target](https://img.shields.io/badge/Target-Herokuapp%20Login-informational)

A **Web UI field validation audit suite** targeting [The Internet Herokuapp](https://the-internet.herokuapp.com/login) — a widely used QA practice application. This project goes well beyond functional testing: it inspects every input field from DOM structure to runtime behavioral security, producing a scored HTML report that classifies each field's validation maturity.

---

## What This Project Audits

| Page | URL |
|------|-----|
| Login | `https://the-internet.herokuapp.com/login` |

The audit covers every interactive field on the page (Username, Password) through a 7-stage pipeline executed at runtime against a live browser.

---

## Audit Engine Architecture

The engine consists of 7 independent TypeScript modules, each with a single responsibility:

```
DOMAnalyzer
  └─ Scans the live DOM for all interactive fields.
     Filters honeypots (display:none, common spam-trap names).
     Resolves labels, attributes, autocomplete, pattern, maxLength.

FieldClassifier
  └─ Categorizes each field: EMAIL | PASSWORD | PHONE | DATE |
     NUMBER | TEXTAREA | TEXT | CHECKBOX | RADIO | SELECT | FILE | URL
     Combines HTML type attribute + semantic name/id/class heuristics.

RuleEvaluator
  └─ Loads rules from AuditingRuleCatalog.json.
     Runs Declarative rules (pure DOM attribute checks).
     Queues Behavioral rules (runtime interaction experiments).

DataStrategyEngine + DataStrategyPayloads
  └─ Resolves the exact payload string for each Behavioral rule
     from a curated dictionary of 100+ edge-case inputs.

FieldExperimentRunner
  └─ Executes each experiment in the browser:
       SUBMIT path — fills the field, neutralizes sibling constraints,
                     triggers requestSubmit(), observes network traffic.
       BLUR path   — triggers blur, observes DOM error feedback.
     Intercepts form submissions (route.fulfill) to prevent navigation.
     Classifies outcomes: request blocked, backend rejected, DOM error shown.

InferenceEngine
  └─ Combines declarative + behavioral findings into a ValidationMaturityState:
       ROBUST_FULL_STACK  — frontend + backend both validate
       FRONTEND_ONLY      — only the browser validates
       BACKEND_ONLY       — only the server validates
       WEAK_VALIDATION    — inconsistent / bypassable validation
       ABSENT             — no validation at all
       FALSE_POSITIVE     — rules pass but no actual protection found

ScoringEngine
  └─ FQI (Field Quality Index): 100 – penalties per failed finding
       Critical: –35 pts  |  Error: –20 pts  |  Warning: –5 pts
     SMI (System Maturity Index): average FQI across all fields,
       minus 20 pts per critical field (PASSWORD/EMAIL) with ABSENT state.
```

---

## Rule Categories

Each field is tested against a rule set loaded from `config/AuditingRuleCatalog.json`:

| Category | Example rules evaluated |
|----------|------------------------|
| **Declarative** | `required` attribute presence, `autocomplete` attribute for password fields, `maxlength` constraints, `pattern` attribute, `type` correctness |
| **Behavioral — Format** | Valid/invalid email formats (38 edge cases), password length boundaries (7–129 chars), special character handling, Unicode, zero-width spaces |
| **Behavioral — Security** | XSS payloads in field values, SQL injection strings, oversized inputs, null bytes, control characters |
| **Behavioral — Boundary** | Minimum/maximum length thresholds, empty string, whitespace-only, leading/trailing spaces |
| **UNKNOWN baseline** | Applied to every field regardless of category — catches generic DOM issues |

---

## Scoring Model

```
FQI (Field Quality Index)
  = max(0,  100 − Σ(penalty × failed_findings))
  Penalty weights: Critical=35  Error=20  Warning=5  Info=0

SMI (System Maturity Index)
  = max(0,  round(mean(FQI across all fields)) − ContextPenalty)
  ContextPenalty: −20 per critical field (PASSWORD/EMAIL) classified as ABSENT
```

A field scoring 100 FQI means no violations were found across all declarative checks and behavioral experiments.

---

## Project Structure

```
.
├── audit-engine/
│   ├── DOMAnalyzer.ts           # Live DOM field extraction
│   ├── FieldClassifier.ts       # Semantic field categorization
│   ├── RuleEvaluator.ts         # Declarative + behavioral rule execution
│   ├── DataStrategyEngine.ts    # Payload resolution
│   ├── DataStrategyPayloads.ts  # 100+ edge-case payload dictionary
│   ├── FieldExperimentRunner.ts # Browser interaction engine (SUBMIT/BLUR)
│   ├── InferenceEngine.ts       # Maturity state classification
│   ├── ScoringEngine.ts         # FQI / SMI calculation
│   ├── CPGenerator.ts           # Audit checkpoint builder
│   └── ReportBuilder.ts         # HTML + Markdown report writer
├── config/
│   └── AuditingRuleCatalog.json # Rule definitions (Declarative + Behavioral)
├── tests/
│   ├── global-setup.ts          # Playwright global setup
│   └── login.audit.spec.ts      # Full audit spec for the Login page
├── reports/auditing/            # HTML report + Markdown summary (generated)
├── .github/workflows/
│   └── auditing.yml             # GitHub Actions CI/CD pipeline
├── playwright.config.ts
└── tsconfig.json
```

---

## CI/CD

Tests run automatically on every push and pull request via GitHub Actions:

- **Node.js 24** on `ubuntu-latest`
- Chromium only (cross-browser coverage is not the goal of a UI audit)
- **90-minute timeout** — behavioral experiments are thorough, not fast
- Three artifact uploads retained 30 days:
  - `playwright-report/` — Playwright HTML report
  - `reports/auditing/` — scored audit report per page
  - `test-results/` — raw test output
- `PAGE_URL_LOGIN` configurable via repository secret to point at any environment

See [`.github/workflows/auditing.yml`](.github/workflows/auditing.yml).

---

## Setup

### Prerequisites
- Node.js ≥ 24.0.0
- npm

### Install

```bash
npm install
npx playwright install --with-deps chromium
```

### Configure (optional)

```bash
cp .env.example .env
# Edit .env to override the target URL or set CI mode
```

---

## Running the Audit

```bash
# Run full audit
npm test

# Run with visible browser (useful to watch experiments)
HEADED=true npm test

# Slow down each action to observe what the engine is doing
SLOWMO=200 HEADED=true npm test

# Open Playwright HTML report after the run
npm run test:report
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PAGE_URL_LOGIN` | `https://the-internet.herokuapp.com/login` | Override target URL (staging, local, etc.) |
| `HEADED` | `false` | Show the browser window during the audit |
| `SLOWMO` | `0` | Milliseconds between each Playwright action |
| `CI` | `false` | Disables video retention, enables CI-friendly output |
| `WORKERS` | `1` | Parallel workers — keep at 1 to avoid experiment interference |

---

## Output

After the audit completes, two reports are written to `reports/auditing/`:

- **`Login-audit-report.html`** — full interactive HTML report with per-field findings, maturity state badge, FQI score, and rule-level detail
- **`Login-test-report-summary.md`** — Markdown summary table with overall grade, SMI, maturity distribution, critical violations list — suitable for pasting into a PR description or ticket

---

## Key Design Decisions

**Route interception with `fulfill()` not `abort()`** — Traditional form submissions on server-rendered apps trigger an HTTP 302 redirect. Using `route.abort()` races with the redirect response: if the server replies before the abort lands, Chromium follows the redirect and destroys the page context mid-experiment. `route.fulfill()` short-circuits inside Chromium's routing layer before the request leaves the browser, making the interception race-free. A custom `X-ATG-Intercepted` response header lets the engine distinguish this synthetic response from a real server reply when recording audit signals.

**Sibling field neutralization before SUBMIT** — Many forms use HTML5 `required` constraints on sibling fields. Without filling them first, the browser's native validation would block the submit before the audited field's own validation is triggered — producing false negatives. The engine fills all `[required]` siblings with valid placeholders, submits, then restores them to empty.

**BLUR path for inline validation** — Not all validation fires on submit. The engine runs a separate BLUR experiment that only triggers `blur()` and observes whether the DOM shows error feedback inline. A field that only validates on submit (no blur feedback) is recorded as a UX gap in the findings.

**Payload dictionary is field-type-aware** — EMAIL fields get 38 edge-case payloads covering RFC 5321/5322 boundary conditions. PASSWORD fields get 20 payloads covering length, complexity, Unicode, and whitespace edge cases. Generic TEXT fields get a separate baseline set. This avoids injecting email-specific payloads into number fields and vice versa.

---

## Stack

| Tool | Version | Role |
|------|---------|------|
| [Playwright](https://playwright.dev/) | ^1.50 | Browser automation + test runner |
| TypeScript | ^5.7 | Type-safe engine and spec authoring |
| Node.js | ≥24 | Runtime |
| GitHub Actions | — | CI/CD |
