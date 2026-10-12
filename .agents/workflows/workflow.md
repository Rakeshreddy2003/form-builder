# Dynamic Interactive Form — Agent Workflow

## 1. Purpose

This document defines the mandatory development workflow for the dynamic interactive form system.

The agent must use this workflow whenever it:

- creates a new form
- adds or changes a question
- adds answer options
- changes branching
- changes validation
- changes UI
- changes response persistence
- changes Excel synchronization
- fixes bugs
- changes the form schema
- introduces a new question type

The architecture is configuration-driven.

The preferred flow is:

```text
Requirement
    ↓
Classify change
    ↓
Inspect existing implementation
    ↓
Identify correct layer
    ↓
Change configuration/domain logic
    ↓
Connect reusable UI
    ↓
Persist response
    ↓
Synchronize integration
    ↓
Validate
    ↓
Test
    ↓
Review architectural boundaries
```

---

# 2. Mandatory Agent Startup Workflow

Before making any change, the agent MUST:

```text
1. Read architecture.md
2. Read rules.md
3. Inspect the relevant source directories
4. Search for existing implementations
5. Identify the correct ownership/layer
6. Understand the current data flow
7. Determine the smallest valid change
```

Do not immediately start creating files.

Do not assume a feature does not already exist.

Do not create duplicate abstractions before searching the repository.

---

# 3. Classify Every Requirement

Before implementation, classify the requirement.

Use one or more of:

```text
CONTENT
QUESTION
OPTION
VALIDATION
CONDITION
NAVIGATION
FORM ENGINE
UI
STATE
RESPONSE
API
PERSISTENCE
EXCEL
INTEGRATION
SECURITY
TESTING
INFRASTRUCTURE
```

Example:

> "Show the contract end date only when employment type is contractor."

Classification:

```text
CONDITION
NAVIGATION
CONTENT
```

Expected implementation:

```text
Form definition
+
condition configuration
+
engine test
```

Not a new React page.

---

# 4. Requirement Analysis Workflow

For every requirement, answer:

```text
1. What is changing?
2. Which layer owns this behavior?
3. Does existing functionality already support it?
4. Can configuration solve it?
5. Is a new reusable component actually required?
6. Does the response schema change?
7. Does Excel mapping change?
8. Does form versioning matter?
9. What existing behavior could be affected?
10. What tests are required?
```

Only after answering these should implementation begin.

---

# 5. New Form Workflow

## Step 1 — Define the form

Create:

```text
formId
version
title
description
```

Example:

```ts
{
  id: "employee-onboarding",
  version: 1,
  title: "Employee Onboarding"
}
```

The form ID must be stable.

---

## Step 2 — Define questions

Add questions to the form definition.

Each question should define only information related to the question.

Example:

```ts
{
  id: "employment_type",
  type: "singleSelect",
  label: "What is your employment type?",
  required: true,
  options: [...]
}
```

Do not put:

```text
React components
CSS
API calls
Excel calls
```

inside the question definition.

---

## Step 3 — Define answer options

For selectable questions:

```ts
options: [
  {
    value: "full_time",
    label: "Full Time"
  },
  {
    value: "contractor",
    label: "Contractor"
  }
]
```

Option values must be stable.

Option labels may change without changing the stored value when appropriate.

---

## Step 4 — Define validation

Add validation declaratively.

Example:

```ts
validation: [
  {
    type: "minLength",
    value: 3
  }
]
```

Do not implement validation directly in the UI component.

---

## Step 5 — Define branching

If the question depends on another answer:

```ts
visibility: {
  question: "employment_type",
  operator: "equals",
  value: "contractor"
}
```

Do not write branching logic in JSX.

---

## Step 6 — Define navigation

If the next question depends on an answer, define the navigation rule through the form engine's configuration.

Example:

```text
Q1
 ├── yes → Q2
 └── no  → Q5
```

---

## Step 7 — Define Excel mapping

Only map fields that need to be exported.

Example:

```text
employment_type → Employment Type
```

Excel-specific mapping belongs to the integration layer.

---

## Step 8 — Validate

Run:

```text
form schema validation
question ID validation
condition validation
navigation validation
reachability validation
circular-flow detection
```

---

## Step 9 — Test

Test:

```text
normal path
conditional path
validation failure
completion
response creation
Excel mapping
Excel synchronization
```

---

# 6. New Question Workflow

When adding a question:

```text
New question
    ↓
Can an existing question type represent it?
    ↓
YES ───────────────→ Add configuration
    │
    NO
    ↓
Is it genuinely a new interaction type?
    ↓
YES
    ↓
Create reusable question component
    ↓
Register component
    ↓
Add configuration
```

The default assumption must always be:

**Reuse an existing component.**

---

# 7. New Question Type Workflow

Only create a new question type when existing types cannot represent the interaction.

Required workflow:

```text
1. Search component registry.
2. Search existing question components.
3. Confirm no existing component is suitable.
4. Define the new question type.
5. Define its props/data contract.
6. Implement reusable component.
7. Register it.
8. Add accessibility behavior.
9. Add validation support.
10. Add tests.
11. Add configuration example.
12. Verify it works across forms.
```

Never create a form-specific question component.

---

# 8. Conditional Branch Workflow

For:

> Show B when A equals X.

Use:

```text
1. Identify source question.
2. Identify target question.
3. Define condition.
4. Add condition to configuration.
5. Validate references.
6. Test condition true.
7. Test condition false.
8. Test backward navigation.
9. Test stale-answer cleanup.
```

Example:

```text
Q1: Employment Type

contractor
    ↓
Q2: Contract End Date

full_time
    ↓
Q3: Department
```

The UI remains unchanged.

---

# 9. Complex Conditional Workflow

For:

```text
A AND B
```

use an `all` condition.

For:

```text
A OR B
```

use an `any` condition.

Workflow:

```text
Business rule
    ↓
Convert to condition tree
    ↓
Validate referenced questions
    ↓
Add declarative condition
    ↓
Test every logical path
```

Do not create custom branching code for one form.

---

# 10. Question Ordering Workflow

If the requirement is only to reorder questions:

```text
1. Modify configuration/order.
2. Do not change question IDs.
3. Do not change response keys.
4. Do not change components.
5. Check conditional navigation.
6. Check Previous behavior.
7. Check progress calculation.
8. Run tests.
```

Question ordering must not determine answer identity.

---

# 11. Question Text Change Workflow

For a wording-only change:

```text
Change configuration
    ↓
Validate configuration
    ↓
Check localization if applicable
    ↓
Run affected tests
```

Do not modify UI components.

---

# 12. Option Change Workflow

## Adding an option

```text
1. Add option.
2. Check conditions referencing the question.
3. Check validation.
4. Check Excel mapping.
5. Check analytics/reporting.
6. Test the new path.
```

## Removing an option

Before removal:

```text
1. Check existing responses.
2. Check existing branches.
3. Check Excel mappings.
4. Check analytics.
5. Determine whether versioning is required.
6. Preserve historical response interpretation.
```

Never remove a production option blindly.

---

# 13. Validation Change Workflow

Example:

> Age must be at least 18.

Workflow:

```text
Update validation configuration
    ↓
Test valid values
    ↓
Test invalid values
    ↓
Test empty value
    ↓
Test boundary value
    ↓
Test conditional applicability
```

For `>= 18`, test:

```text
17 → invalid
18 → valid
19 → valid
```

---

# 14. Form Engine Change Workflow

When changing navigation, condition evaluation, progress, or validation engine behavior:

```text
1. Identify affected engine function.
2. Read existing tests first.
3. Determine whether behavior is generic or form-specific.
4. Change the generic engine only if the behavior is reusable.
5. Do not add form-specific conditions to the engine.
6. Add unit tests.
7. Run existing form tests.
8. Run full form flow.
```

Engine code must remain independent of individual forms.

---

# 15. Navigation Workflow

The engine must resolve the next active question.

```text
Current question
    ↓
Current answers
    ↓
Evaluate conditions
    ↓
Find next active question
    ↓
Skip inactive questions
    ↓
Detect terminal state
    ↓
Return next question
```

Navigation must be deterministic.

Do not let UI components decide the next question.

---

# 16. Previous Navigation Workflow

When Previous is pressed:

```text
Current question
    ↓
Resolve previous active question
    ↓
Navigate backward
    ↓
Preserve valid answers
```

If an earlier answer changes:

```text
Changed answer
    ↓
Recalculate active branch
    ↓
Find now-inactive questions
    ↓
Remove or invalidate stale answers
    ↓
Recalculate progress
```

---

# 17. Progress Workflow

Progress must be based on active questions.

```text
Answers
    ↓
Evaluate active questions
    ↓
Determine active question path
    ↓
Determine completed questions
    ↓
Calculate percentage
```

Never blindly calculate:

```ts
currentIndex / questions.length
```

for conditional forms.

---

# 18. Response Creation Workflow

At completion:

```text
Final question
    ↓
Validate final answer
    ↓
Validate complete response
    ↓
Create responseId
    ↓
Attach formId
    ↓
Attach formVersion
    ↓
Persist answers
    ↓
Mark response completed
    ↓
Mark Excel sync pending
```

The response must exist independently of Excel.

---

# 19. Response Persistence Workflow

Preferred:

```text
Frontend
    ↓
Submit response
    ↓
Backend validation
    ↓
Persist response
    ↓
Return responseId
```

The backend is responsible for authoritative persistence.

Never rely solely on frontend state.

---

# 20. Excel Synchronization Workflow

Preferred architecture:

```text
Response submitted
      ↓
Response persisted
      ↓
SYNC_PENDING
      ↓
Queue / async job
      ↓
Excel Sync Service
      ↓
Load response
      ↓
Map response
      ↓
Check responseId
      ↓
Create/update spreadsheet row
      ↓
SYNCED
```

Failure:

```text
Excel error
    ↓
SYNC_FAILED
    ↓
Retry
    ↓
SYNCED
```

The user must not need to resubmit the form.

---

# 21. Excel Mapping Workflow

When adding an exportable answer:

```text
Question
    ↓
Response key
    ↓
Excel mapping
    ↓
Normalization
    ↓
Spreadsheet row
```

Example:

```text
employment_type
       ↓
Contractor
       ↓
Employment Type
       ↓
Excel row
```

The Excel mapper must handle:

- dates
- numbers
- booleans
- single select
- multi-select
- empty values
- formatted labels
- normalized values

---

# 22. Excel Idempotency Workflow

Every synchronization operation must use a stable response identifier.

Example:

```text
responseId = "8f3d..."
```

Workflow:

```text
Sync response
    ↓
Check responseId
    ↓
Exists?
 ├── YES → update/no-op
 └── NO  → create row
```

Never blindly append on every retry.

---

# 23. Excel Failure Workflow

If Excel is unavailable:

```text
Form completion
    ↓
Response persisted
    ↓
Excel sync fails
    ↓
Response remains completed
    ↓
Sync status = FAILED
    ↓
Retry later
```

Do not:

```text
delete response
reset form
ask user to refill
```

---

# 24. Form Versioning Workflow

When modifying a published form:

```text
Identify change
    ↓
Check historical responses
    ↓
Check question IDs
    ↓
Check answer values
    ↓
Check conditions
    ↓
Check Excel mappings
    ↓
Determine compatibility
```

If the change is breaking:

```text
Create new form version
```

Historical responses retain their original version.

---

# 25. Bug Fix Workflow

Every bug fix follows:

```text
Reproduce
    ↓
Identify root cause
    ↓
Identify responsible layer
    ↓
Fix root cause
    ↓
Add regression test
    ↓
Run affected tests
    ↓
Run full relevant form flow
```

Do not fix a backend/engine problem by adding a UI workaround.

---

# 26. UI Change Workflow

For visual changes:

```text
Requirement
    ↓
Find reusable component
    ↓
Modify shared component
    ↓
Check all forms
    ↓
Check mobile
    ↓
Check tablet
    ↓
Check desktop
    ↓
Check accessibility
```

Do not create duplicate UI implementations for individual forms.

---

# 27. API Change Workflow

For API changes:

```text
Define contract
    ↓
Validate request
    ↓
Implement service
    ↓
Persist data
    ↓
Trigger integration if required
    ↓
Update frontend client
    ↓
Test success
    ↓
Test validation failure
    ↓
Test network/server failure
```

API calls must not be embedded inside question components.

---

# 28. Configuration Validation Workflow

Every form definition must pass:

```text
Schema validation
       ↓
Unique ID validation
       ↓
Question type validation
       ↓
Option validation
       ↓
Condition reference validation
       ↓
Navigation reference validation
       ↓
Circular-flow detection
       ↓
Reachability validation
```

Invalid configuration must fail fast.

---

# 29. Testing Workflow

## Unit tests

Test:

```text
conditionEvaluator
questionResolver
validationEngine
progressCalculator
responseSerializer
excelMapper
```

## Component tests

Test reusable question components.

## Integration tests

Test:

```text
response submission
response persistence
Excel mapping
Excel synchronization
retry
idempotency
```

## End-to-end tests

Test complete user flows:

```text
Start
 ↓
Answer
 ↓
Branch
 ↓
Answer
 ↓
Complete
 ↓
Persist
 ↓
Sync
```

---

# 30. Branch Testing Workflow

Every conditional branch must have at least:

```text
TRUE path
FALSE path
```

For complex conditions:

```text
all combinations that materially change behavior
```

Example:

```text
A = yes, B = yes
A = yes, B = no
A = no,  B = yes
A = no,  B = no
```

Do not test only the happy path.

---

# 31. Stale Answer Testing Workflow

Test:

```text
Q1 = Yes
Q2 becomes visible
Q2 answered
Q1 changed to No
```

Verify:

```text
Q2 hidden
Q2 answer removed/inactivated
submission does not contain stale Q2 data
Excel does not receive stale Q2 data
```

---

# 32. Configuration-Only Change Workflow

If the requirement can be solved entirely by configuration:

```text
Modify definition
    ↓
Run schema validation
    ↓
Run form tests
    ↓
Verify UI
```

Do not modify application code unnecessarily.

This should be the most common workflow.

---

# 33. Architecture Review Workflow

Before finalizing any non-trivial change, verify:

```text
Did UI receive business logic?
Did configuration receive UI logic?
Did Excel logic leak into form engine?
Did external-provider logic leak into domain code?
Was duplicate functionality created?
Was a stable ID changed?
Was versioning considered?
Was response compatibility considered?
```

If any answer is "yes", reconsider the implementation.

---

# 34. Agent File Creation Workflow

Before creating a new file:

```text
Search repository
    ↓
Does equivalent file exist?
    ├── YES → modify/reuse it
    └── NO  → determine whether new file is justified
```

Do not create files merely to organize a small amount of logic.

---

# 35. Dependency Addition Workflow

Before adding a package:

```text
1. Search existing dependencies.
2. Check whether current libraries already solve the requirement.
3. Prefer existing dependencies.
4. Add a package only when necessary.
5. Keep the dependency focused.
6. Verify bundle/runtime impact.
```

Do not add libraries for trivial functionality.

---

# 36. Logging Workflow

When adding logs:

Use:

```text
event name
responseId
formId
formVersion
operation
status
error category
```

Do not log complete answers.

Example:

```text
excel.sync.failed
responseId=abc123
formId=employee-onboarding
attempt=2
```

---

# 37. Security Workflow

Before completing a feature, check:

```text
No secrets in frontend
No credentials in configuration
No sensitive payload logging
Server-side validation exists
External APIs are authenticated securely
User input is validated
```

---

# 38. Performance Workflow

For normal forms:

```text
Prefer simple implementation
```

For large forms:

```text
Measure
    ↓
Identify bottleneck
    ↓
Optimize affected area
```

Do not introduce complex optimization before measuring a real problem.

Potential optimizations:

```text
memoization
lazy loading
selective condition evaluation
reduced rerendering
virtualization where genuinely required
```

---

# 39. Production Deployment Workflow

Before deploying a form change:

```text
Configuration validation
    ↓
Type check
    ↓
Lint
    ↓
Unit tests
    ↓
Integration tests
    ↓
E2E tests where applicable
    ↓
Review form version
    ↓
Review Excel mapping
    ↓
Review migration/data compatibility
    ↓
Deploy
    ↓
Verify response creation
    ↓
Verify Excel synchronization
```

---

# 40. Production Hotfix Workflow

For urgent issues:

```text
Identify affected form/version
    ↓
Identify affected responses
    ↓
Identify root cause
    ↓
Apply smallest safe fix
    ↓
Avoid unnecessary schema changes
    ↓
Avoid question ID changes
    ↓
Run regression test
    ↓
Deploy
    ↓
Verify production flow
```

Do not use a hotfix to introduce unrelated refactoring.

---

# 41. Final Agent Decision Workflow

For every incoming task:

```text
                     REQUIREMENT
                          │
                          ▼
                  CLASSIFY REQUEST
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
     CONTENT             UI             BUSINESS LOGIC
        │                 │                 │
        ▼                 ▼                 ▼
   CONFIGURATION       COMPONENT        FORM ENGINE
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                     RESPONSE LAYER
                          │
                          ▼
                    INTEGRATION
                          │
                          ▼
                       TESTING
                          │
                          ▼
                  ARCHITECTURE REVIEW
                          │
                          ▼
                       COMPLETE
```

---

# 42. Golden Workflow

The preferred implementation path for most requirements is:

```text
Requirement
    ↓
Can configuration solve it?
    │
    ├── YES
    │    ↓
    │  Update configuration
    │    ↓
    │  Validate
    │    ↓
    │  Test
    │
    └── NO
         ↓
      Can existing reusable code solve it?
         │
         ├── YES
         │    ↓
         │  Extend/reuse
         │
         └── NO
              ↓
           Create reusable capability
              ↓
           Register it
              ↓
           Test it
              ↓
           Use it through configuration
```

---

# 43. Final Quality Gate

Before declaring any task complete, the agent must verify:

```text
[ ] Correct layer was modified
[ ] Existing code was searched first
[ ] Configuration was used where possible
[ ] No question-specific UI was created unnecessarily
[ ] No business logic was placed in UI
[ ] No Excel logic was placed in UI
[ ] Question IDs remain stable
[ ] Form versioning was considered
[ ] Conditional branches were tested
[ ] Validation was tested
[ ] Response persistence was tested
[ ] Excel mapping was tested
[ ] Excel synchronization is idempotent
[ ] Failure/retry behavior was considered
[ ] No sensitive data is logged
[ ] No secrets were introduced
[ ] Accessibility was preserved
[ ] Responsive behavior was preserved
[ ] Tests pass
[ ] No unnecessary dependencies were added
[ ] No unnecessary files were created
[ ] Architecture boundaries remain intact
```

# 44. Core Principle

The agent must optimize for:

```text
CONFIGURATION > CUSTOM CODE
REUSE > DUPLICATION
DOMAIN LOGIC > UI LOGIC
ADAPTERS > DIRECT INTEGRATIONS
STABLE IDs > ARRAY POSITIONS
PERSISTENCE > EXCEL
VERSIONING > BREAKING CHANGES
ROOT-CAUSE FIXES > UI WORKAROUNDS
```

The ultimate goal is:

```text
Add 1 question
    → configuration change

Add 20 questions
    → configuration change

Create another form
    → new form definition

Change branching
    → configuration change

Change visual design
    → reusable UI component

Change Excel provider
    → integration adapter

Change business navigation
    → form engine
```

The number of questions or forms must not cause the frontend architecture to grow linearly.
