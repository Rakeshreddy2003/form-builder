# Configuration-Driven Interactive Dynamic Form System

An enterprise-ready, configuration-driven form engine built with React 19, TypeScript, and Vite.

## Core Principle

> **Content defines WHAT is asked** (Configuration)  
> **Form Engine defines HOW it flows** (Pure Logic)  
> **UI defines HOW it looks** (Reusable Component Registry)  
> **Persistence & Integration defines WHERE responses go** (Isolated Adapters)

Whether a form contains 5, 20, or 100 questions, the exact same engine and UI components are reused. Creating new forms or altering branching paths requires **only configuration changes**, never form-specific UI components.

---

## Key Features

- **Configuration-Driven**: Questions, choices, branching rules, and validations are pure data.
- **Pure Form Engine**: Condition evaluator, question resolver, validation engine, progress calculator, and stale-answer cleaner have zero React/DOM dependencies.
- **Dynamic Branching**: Supports compound `all`, `any`, and `not` conditions with automatic skipping of irrelevant questions.
- **Accurate Progress**: Progress percentage is computed strictly against the **active question path**, not the total configured question count.
- **Stale-Answer Pruning**: When upstream answers change, downstream answers from newly inactive branches are automatically stripped.
- **Independent Response Persistence**: Responses are saved locally / via API independently from external integrations.
- **Idempotent Excel Synchronization**: Synchronization is keyed by `responseId`. Retries and duplicate events will never create duplicate spreadsheet rows.
- **Resilient Outage Handling**: Simulated Excel outage toggling allows testing retry policies when spreadsheet APIs fail.
- **Form Versioning**: Supports `v1`, `v2`, etc., without breaking historical response schemas.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run automated test suite (24 pure engine and integration tests)
npm test

# Build for production
npm run build

# Start interactive local development workbench
npm run dev

# Run linting
npm run lint
```

---

## Detailed Documentation

For full architectural diagrams, component contracts, developer workflows, and tutorials on adding new forms or questions, see [**`DOCUMENTATION.md`**](./DOCUMENTATION.md).
