# Dynamic Form — Agent Rules

## 1. Core Principle

The application is a **configuration-driven form engine**.

The agent must always preserve this separation:

```text
FORM DATA / CONTENT
        ↓
FORM ENGINE / BUSINESS LOGIC
        ↓
UI COMPONENTS
        ↓
RESPONSE / PERSISTENCE
        ↓
INTEGRATION / EXCEL
```

Questions are data.

UI is presentation.

Form engine is behavior.

Excel is an integration target.

Never mix these responsibilities.

---

# 2. Configuration-First Rule

Before writing or modifying UI code, determine whether the requirement can be solved through form configuration.

If the requirement is:

- new question
- new answer
- changed question text
- changed option
- changed validation
- changed branching
- changed question order

then modify the form definition first.

Do not modify React components for configuration-only changes.

---

# 3. No Hardcoded Questions

Never hardcode business questions inside React components.

Bad:

```tsx
if (question === "What is your age?") {
  ...
}
```

Bad:

```tsx
return (
  <>
    <Question>What is your name?</Question>
    <Question>Are you employed?</Question>
  </>
);
```

Preferred:

```tsx
<FormRenderer form={formDefinition} />
```

Questions must come from configuration.

---

# 4. No Question-Specific Components

Do not create:

```text
AgeQuestion.tsx
GenderQuestion.tsx
EmploymentQuestion.tsx
CountryQuestion.tsx
```

when the interaction can be represented by an existing generic component.

Prefer:

```text
NumberQuestion
SingleSelectQuestion
TextQuestion
DateQuestion
```

with configuration.

Create a new component only when a genuinely new interaction type is required.

---

# 5. Reuse Before Creating

Before creating any component, service, utility, hook, or engine feature:

1. Search the existing codebase.
2. Check the component registry.
3. Check existing form-engine functionality.
4. Check existing utilities.
5. Reuse if possible.
6. Extend existing functionality if appropriate.
7. Create new functionality only when necessary.

Never duplicate existing behavior.

---

# 6. Question IDs Are Immutable Contracts

Every question must have a stable ID.

Preferred:

```text
first_name
employment_type
years_of_experience
has_previous_employment
```

Avoid:

```text
q1
q2
q3
```

Never use array indexes as identifiers.

Never rename a production question ID without explicitly considering existing responses, branching rules, analytics, and Excel mappings.

---

# 7. Answers Must Be Keyed by Question ID

Preferred:

```ts
{
  first_name: "John",
  employment_type: "contractor"
}
```

Never use:

```ts
[
  "John",
  "contractor"
]
```

The answer structure must remain independent from question ordering.

---

# 8. UI Must Not Contain Business Logic

UI components may handle:

- rendering
- user interaction
- visual state
- accessibility
- loading presentation
- error presentation

UI components must not decide:

- what question comes next
- which branch is active
- how Excel should be updated
- how responses are transformed for Excel
- whether a response is valid according to business rules

---

# 9. No Excel Logic in UI

Never do this:

```tsx
onChange={(value) => {
  updateState(value);
  writeToExcel(value);
}}
```

Never import Excel services into question components.

Never make a spreadsheet request from `onChange`.

Never make the spreadsheet the source of truth for form state.

---

# 10. Excel Is an Integration

The architecture must treat Excel as an external destination.

```text
Response
   ↓
Serializer
   ↓
Excel Mapper
   ↓
Excel Adapter
   ↓
Excel
```

The form engine must not depend directly on Excel.

---

# 11. Adapter Rule

External providers must be abstracted.

Preferred:

```ts
interface SpreadsheetAdapter {
  appendRow(row: SpreadsheetRow): Promise<void>;
}
```

Implementation:

```ts
class ExcelAdapter implements SpreadsheetAdapter {
  ...
}
```

The business logic must depend on the interface, not the implementation.

This allows future support for:

```text
Excel
Google Sheets
Database
CSV
CRM
Webhook
```

without rewriting the form engine.

---

# 12. Conditional Logic Must Be Declarative

Never write branching directly inside React.

Bad:

```tsx
if (answers.employmentType === "contractor") {
  return <ContractEndDate />;
}
```

Preferred:

```ts
{
  id: "contract_end_date",
  visibility: {
    question: "employment_type",
    operator: "equals",
    value: "contractor"
  }
}
```

The form engine evaluates the condition.

---

# 13. Condition Evaluator Must Be Pure

Conditions must be evaluated by pure functions.

```ts
evaluateCondition(condition, answers)
```

The evaluator must not:

- update React state
- call APIs
- write to Excel
- mutate answers
- modify the form definition

Same input must produce the same output.

---

# 14. Navigation Must Be Centralized

Only the form engine may determine the next question.

Use:

```ts
resolveNextQuestion(...)
```

Do not duplicate navigation rules across components.

There must be one authoritative navigation mechanism.

---

# 15. Validation Must Be Centralized

Validation belongs to the validation engine.

Question components may display validation errors but must not own business validation.

Preferred:

```ts
validateQuestion(question, value)
```

and:

```ts
validateForm(form, answers)
```

---

# 16. Conditional Branches Must Be Consistent

The same condition evaluator must be used for:

- visibility
- navigation
- progress
- validation applicability
- stale-answer cleanup

Do not implement the same condition logic separately in different places.

---

# 17. Stale Answer Rule

When a user changes an answer and a previously active branch becomes inactive, stale answers must not silently remain as active business data.

Example:

```text
Q1 = Yes
→ Q2 appears
→ Q2 = ABC

Change Q1 = No
→ Q2 disappears
```

The engine must either:

1. remove Q2's answer, or
2. explicitly mark Q2's answer inactive.

Default behavior:

**Remove answers belonging to inactive branches.**

---

# 18. Form Versioning

Every form must have a version.

Example:

```ts
{
  id: "employee-onboarding",
  version: 3
}
```

Every response must store:

```text
formId
formVersion
```

Never assume that the current form definition can interpret every historical response.

---

# 19. Production Form Changes

Before modifying a published form:

1. Determine whether existing responses are affected.
2. Determine whether question IDs change.
3. Determine whether Excel mappings change.
4. Determine whether branch behavior changes.
5. Determine whether historical responses remain readable.
6. Increment the form version when required.

---

# 20. No Secrets in Frontend

Never put:

- Excel credentials
- API keys
- service account credentials
- private tokens
- database credentials

inside frontend code.

Spreadsheet operations requiring credentials must happen server-side.

---

# 21. No Sensitive Logging

Never log the complete answer payload in production.

Bad:

```ts
console.log(response);
```

when response contains personal information.

Prefer:

```text
response.submitted
responseId=abc123
formId=employee-onboarding
```

Sensitive values must be redacted.

---

# 22. Response Persistence Before Integration

The completed response must be persisted before attempting Excel synchronization.

Never make Excel the only storage mechanism.

Correct:

```text
Submit
 ↓
Persist response
 ↓
Sync Excel
```

Not:

```text
Submit
 ↓
Excel
 ↓
Hope it succeeded
```

---

# 23. Excel Sync Must Be Idempotent

Every response must have a stable unique identifier.

Example:

```text
responseId = 8f3d...
```

Retries must not create duplicate spreadsheet rows.

The synchronization layer must support:

```text
create
update
retry
deduplicate
```

---

# 24. Excel Failure Must Not Lose Responses

If Excel fails:

```text
Response = COMPLETED
Sync = FAILED
```

The user must not be forced to fill the form again.

The system should support retry.

---

# 25. No Direct Mutation of Form Definitions

Form definitions should be treated as immutable runtime data.

Do not mutate:

```ts
form.questions.push(...)
```

Create/update the definition explicitly.

---

# 26. Strict TypeScript

Use strict TypeScript.

Avoid:

```ts
any
```

unless unavoidable at an external boundary.

Prefer explicit types.

Avoid unsafe casts:

```ts
value as any
```

---

# 27. Pure Business Logic

Prefer pure functions for:

- condition evaluation
- navigation
- validation
- progress calculation
- response serialization
- Excel mapping

Keep side effects at application boundaries.

---

# 28. Dependency Direction

Dependencies should flow toward stable business abstractions.

```text
UI
 ↓
Form Engine
 ↓
Domain Types
 ↓
Application Services
 ↓
Adapters
 ↓
External Systems
```

Never allow:

```text
UI → Excel
UI → Database
UI → external provider
```

---

# 29. No Premature Abstraction

Do not create an abstraction simply because it might be useful later.

Create abstractions around:

- real repeated behavior
- external integrations
- domain boundaries
- replaceable infrastructure

Keep simple code simple.

---

# 30. No Duplicate State

There should be one authoritative source for answers.

Do not maintain:

```text
component state
+
global state
+
form library state
+
server state
```

for the same answer unless there is a documented reason.

---

# 31. Accessibility Is Mandatory

Every question component must support:

- semantic labels
- keyboard navigation
- focus management
- accessible errors
- screen readers
- semantic option groups
- visible focus states

Accessibility must be built into reusable components, not implemented separately for each form.

---

# 32. Responsive UI

The same form engine and question components must work on:

- mobile
- tablet
- desktop

Do not duplicate question logic for different screen sizes.

---

# 33. Configuration Validation

Every form definition must be validated.

At minimum validate:

- unique IDs
- valid question types
- valid option values
- valid condition references
- valid navigation targets
- duplicate options
- unreachable questions
- circular navigation
- malformed validation rules

Invalid configuration must fail fast.

---

# 34. Agent Must Inspect Before Editing

Before modifying code:

1. Inspect relevant files.
2. Understand existing architecture.
3. Search for existing implementation.
4. Identify the correct layer.
5. Make the smallest appropriate change.

Never immediately create new files.

---

# 35. Agent Must Not Over-Engineer

Do not introduce:

- unnecessary state libraries
- unnecessary abstractions
- unnecessary APIs
- unnecessary components
- unnecessary dependencies

The architecture must remain understandable to a developer who did not build the original system.

---

# 36. Definition of Done

A change is complete only when:

- configuration is valid
- types compile
- existing behavior is preserved
- affected tests pass
- conditional paths are tested
- response serialization works
- Excel mapping works where applicable
- no secrets were introduced
- no business logic was moved into UI
- no duplicated functionality was created
- documentation is updated when architecture changes