# Dynamic Interactive Form Architecture

## 1. Purpose

Build a reusable, configuration-driven interactive form system where:

- The frontend is a reusable form renderer, not a collection of hardcoded forms.
- Questions, answer options, labels, validation, branching, and form metadata live in one dedicated configuration/content layer.
- UI components and visual presentation live separately from question data.
- Conditional navigation determines the next question from the user's previous answers.
- The same question/answer component types are reused regardless of whether a form contains 5, 20, or 100+ questions.
- Form responses are stored as structured data first and synchronized to Excel through a dedicated integration/data layer.
- Adding or changing questions must normally require configuration changes only, not UI code changes.
- Excel synchronization must never be embedded inside React components or question definitions.
- The architecture must remain extensible for future destinations such as databases, APIs, CSV, analytics, or CRM systems.

The core principle is:

**Content defines WHAT is asked → Form engine defines HOW it flows → UI defines HOW it looks → Persistence/integration defines WHERE responses go.**

---

## 2. Architectural Principles

### 2.1 Configuration over hardcoding

Do not hardcode individual questions into React components.

Bad:

```tsx
if (questionId === "employment_status") {
  return <EmploymentStatusQuestion />;
}
```

Preferred:

```tsx
<FormRenderer
  form={formDefinition}
  components={componentRegistry}
/>
```

Question behavior must come from configuration.

---

### 2.2 Separate content from presentation

Question definitions must not contain styling, layout implementation, React components, or Excel-specific logic.

Question configuration may contain:

- question ID
- question text
- description/help text
- component type
- answer options
- validation rules
- required/optional state
- branching rules
- metadata
- response mapping key

Question configuration must not contain:

- CSS
- JSX
- React state
- API calls
- Excel cell manipulation
- spreadsheet credentials
- business UI layout

---

### 2.3 UI components must be generic

Build a small component vocabulary and reuse it.

Typical component types:

- `text`
- `textarea`
- `singleSelect`
- `multiSelect`
- `radio`
- `checkbox`
- `number`
- `date`
- `email`
- `phone`
- `rating`
- `info`
- `confirmation`

A new question should normally be created by composing an existing component type with configuration.

Do not create a new React component for every question.

---

### 2.4 Question IDs are contracts

Every question must have a stable unique ID.

Example:

```ts
{
  id: "employment_status",
  type: "singleSelect",
  ...
}
```

The question ID becomes the stable reference for:

- answers
- conditional rules
- validation
- analytics
- response persistence
- Excel column mapping
- future migrations

Never use array indexes as question identifiers.

Bad:

```ts
answers[4]
```

Preferred:

```ts
answers["employment_status"]
```

Question IDs should not be casually renamed after production data exists.

---

## 3. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │     Form Definition      │
                         │  Questions + Options    │
                         │  Rules + Validation     │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │       Form Engine       │
                         │                         │
                         │ Current question        │
                         │ Answer state            │
                         │ Validation              │
                         │ Branching               │
                         │ Next-question resolver  │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      UI Renderer         │
                         │                         │
                         │ Generic question        │
                         │ components              │
                         │ Layout/navigation       │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │    Response Store        │
                         │                         │
                         │ answers                  │
                         │ progress                 │
                         │ completion status        │
                         │ session metadata         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ Integration / Sync Layer │
                         │                         │
                         │ Response normalization  │
                         │ Excel adapter            │
                         │ Retry / idempotency     │
                         │ Sync status              │
                         └────────────┬────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ Excel / Sheet │
                              └───────────────┘
```

---

# 4. Recommended Folder Structure

Use a feature-oriented structure while keeping responsibilities isolated.

```text
src/
├── app/
│   ├── App.tsx
│   └── routes/
│
├── components/
│   ├── form/
│   │   ├── FormRenderer.tsx
│   │   ├── FormQuestion.tsx
│   │   ├── FormNavigation.tsx
│   │   ├── FormProgress.tsx
│   │   ├── FormError.tsx
│   │   └── componentRegistry.ts
│   │
│   └── questions/
│       ├── TextQuestion.tsx
│       ├── TextareaQuestion.tsx
│       ├── SingleSelectQuestion.tsx
│       ├── MultiSelectQuestion.tsx
│       ├── RadioQuestion.tsx
│       ├── CheckboxQuestion.tsx
│       ├── NumberQuestion.tsx
│       ├── DateQuestion.tsx
│       ├── EmailQuestion.tsx
│       └── index.ts
│
├── forms/
│   ├── definitions/
│   │   ├── form.schema.ts
│   │   ├── form.types.ts
│   │   ├── example-form.ts
│   │   └── index.ts
│   │
│   ├── engine/
│   │   ├── formEngine.ts
│   │   ├── questionResolver.ts
│   │   ├── conditionEvaluator.ts
│   │   ├── validationEngine.ts
│   │   └── progressCalculator.ts
│   │
│   └── hooks/
│       ├── useFormEngine.ts
│       └── useFormResponse.ts
│
├── state/
│   ├── formStore.ts
│   └── responseStore.ts
│
├── services/
│   ├── response/
│   │   ├── responseService.ts
│   │   └── responseSerializer.ts
│   │
│   └── integrations/
│       ├── excel/
│       │   ├── excelAdapter.ts
│       │   ├── excelMapper.ts
│       │   └── excelSyncService.ts
│       │
│       └── index.ts
│
├── api/
│   ├── client.ts
│   └── responseApi.ts
│
├── utils/
│   ├── ids.ts
│   ├── dates.ts
│   └── serialization.ts
│
├── types/
│   └── common.ts
│
└── config/
    └── environment.ts
```

---

# 5. Responsibilities by Layer

## 5.1 `forms/definitions`

This is the single source of truth for form content.

It contains:

- form metadata
- questions
- options
- conditions
- validation
- response keys
- ordering/flow configuration

Example:

```ts
export const employeeForm: FormDefinition = {
  id: "employee-onboarding",
  version: 1,
  title: "Employee Onboarding",
  questions: [
    {
      id: "employment_type",
      type: "singleSelect",
      label: "What is your employment type?",
      required: true,
      options: [
        { value: "full_time", label: "Full Time" },
        { value: "part_time", label: "Part Time" },
        { value: "contractor", label: "Contractor" }
      ]
    },
    {
      id: "contract_end_date",
      type: "date",
      label: "When does your contract end?",
      required: true,
      visibility: {
        when: {
          question: "employment_type",
          operator: "equals",
          value: "contractor"
        }
      }
    }
  ]
};
```

The configuration should be declarative.

---

# 6. Form Definition Contract

Use strongly typed definitions.

```ts
type QuestionType =
  | "text"
  | "textarea"
  | "singleSelect"
  | "multiSelect"
  | "radio"
  | "checkbox"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "rating";

interface FormDefinition {
  id: string;
  version: number;
  title: string;
  description?: string;
  questions: QuestionDefinition[];
}

interface QuestionDefinition {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  required?: boolean;
  options?: QuestionOption[];
  validation?: ValidationRule[];
  visibility?: Condition;
  next?: NavigationRule[];
  responseKey?: string;
}

interface QuestionOption {
  value: string;
  label: string;
}
```

The actual type system may evolve, but the separation must remain.

---

# 7. Conditional Question Flow

The form must not assume that questions are always linear.

Example:

```text
Q1: Do you have previous work experience?

        │
        ├── No ───────► Q4
        │
        └── Yes ──────► Q2

Q2: How many years of experience?

        │
        ├── < 3 ──────► Q3
        │
        └── >= 3 ─────► Q5
```

The UI must not contain this branching logic.

The form engine owns it.

---

# 8. Condition Engine

Conditions must be declarative.

Example:

```ts
{
  question: "employment_type",
  operator: "equals",
  value: "contractor"
}
```

Supported operators should be designed as an extensible set:

```text
equals
notEquals
contains
notContains
greaterThan
greaterThanOrEqual
lessThan
lessThanOrEqual
in
notIn
isEmpty
isNotEmpty
```

For complex conditions support:

```ts
{
  all: [
    {
      question: "age",
      operator: "greaterThanOrEqual",
      value: 18
    },
    {
      question: "country",
      operator: "equals",
      value: "IN"
    }
  ]
}
```

And:

```ts
{
  any: [
    {
      question: "employment_type",
      operator: "equals",
      value: "contractor"
    },
    {
      question: "employment_type",
      operator: "equals",
      value: "temporary"
    }
  ]
}
```

The evaluator must be a pure function.

```ts
evaluateCondition(condition, answers): boolean
```

It must not:

- access React state directly
- call APIs
- modify answers
- modify UI
- write to Excel

---

# 9. Question Resolution

The question resolver determines what should be shown next.

Example:

```ts
const nextQuestion = resolveNextQuestion({
  currentQuestion,
  answers,
  formDefinition
});
```

Responsibilities:

1. Evaluate visibility.
2. Evaluate navigation rules.
3. Skip questions whose conditions are not satisfied.
4. Find the next valid question.
5. Detect the end of the form.
6. Avoid infinite navigation loops.
7. Keep the resolver deterministic.

The resolver should not know anything about React.

---

# 10. Answer State

Represent answers by stable question ID.

```ts
type FormAnswers = Record<string, unknown>;
```

Example:

```ts
{
  employment_type: "contractor",
  contract_end_date: "2027-04-30",
  years_experience: 4
}
```

Do not store answers based on question position.

Bad:

```ts
[
  "contractor",
  "2027-04-30",
  4
]
```

Preferred:

```ts
{
  employment_type: "contractor",
  contract_end_date: "2027-04-30",
  years_experience: 4
}
```

This allows questions to be inserted, removed, or reordered without corrupting the response structure.

---

# 11. Dynamic UI Renderer

The renderer maps configuration to generic components.

Example:

```ts
const componentRegistry = {
  text: TextQuestion,
  textarea: TextareaQuestion,
  singleSelect: SingleSelectQuestion,
  multiSelect: MultiSelectQuestion,
  radio: RadioQuestion,
  checkbox: CheckboxQuestion,
  number: NumberQuestion,
  date: DateQuestion,
  email: EmailQuestion,
  phone: PhoneQuestion
};
```

Then:

```tsx
const Component = componentRegistry[question.type];

return (
  <Component
    question={question}
    value={answer}
    onChange={handleAnswerChange}
  />
);
```

Adding another question should generally require:

```text
Add configuration
        ↓
Existing renderer
        ↓
Existing component type
```

not:

```text
New question
        ↓
New page
        ↓
New component
        ↓
New state
        ↓
New API
```

---

# 12. UI Responsibilities

The UI layer is responsible for:

- layout
- typography
- spacing
- responsive behavior
- animations
- progress display
- question rendering
- button states
- accessibility
- error presentation

The UI is NOT responsible for:

- deciding business branching rules
- deciding what question comes next
- Excel writes
- response transformation for Excel
- persistence implementation
- API credentials
- business-specific conditional logic

---

# 13. Form Engine Responsibilities

The form engine owns:

```text
Current question
       ↓
Read answer
       ↓
Validate answer
       ↓
Save answer
       ↓
Evaluate conditions
       ↓
Resolve next question
       ↓
Update progress
       ↓
Render next question
```

The engine should expose a clean interface such as:

```ts
interface FormEngine {
  currentQuestion: QuestionDefinition | null;
  answers: FormAnswers;
  progress: number;
  isComplete: boolean;

  answer(questionId: string, value: unknown): void;
  next(): void;
  previous(): void;
  validateCurrent(): ValidationResult;
  submit(): Promise<void>;
}
```

Keep the implementation independent from visual components.

---

# 14. Validation

Validation belongs to the form definition and validation engine.

Example:

```ts
validation: [
  {
    type: "minLength",
    value: 3,
    message: "Name must contain at least 3 characters."
  }
]
```

The validation engine should expose:

```ts
validateQuestion(question, value)
```

and:

```ts
validateForm(formDefinition, answers)
```

Validation must happen before navigation.

Never rely exclusively on UI-level HTML validation.

---

# 15. Progress Calculation

Do not calculate progress simply as:

```ts
currentIndex / questions.length
```

because conditional forms may skip questions.

Instead calculate progress against the active question path.

Example:

```text
Total active questions: 8
Completed active questions: 5

Progress = 62.5%
```

The progress calculator must use the same condition engine as navigation.

This prevents the UI from showing incorrect progress for dynamic forms.

---

# 16. Response Lifecycle

The response should have a lifecycle.

```text
STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED
   ↓
SYNC_PENDING
   ↓
SYNCED
```

Failure state:

```text
SYNC_PENDING
   ↓
SYNC_FAILED
   ↓
RETRY
   ↓
SYNCED
```

The user should not lose their completed form because Excel synchronization failed.

---

# 17. Response Model

Use a normalized response envelope.

```ts
interface FormResponse {
  responseId: string;
  formId: string;
  formVersion: number;

  answers: Record<string, unknown>;

  status:
    | "STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "SYNC_PENDING"
    | "SYNCED"
    | "SYNC_FAILED";

  startedAt: string;
  completedAt?: string;

  sync?: {
    status: "PENDING" | "SYNCED" | "FAILED";
    lastAttemptAt?: string;
    attemptCount?: number;
    error?: string;
  };
}
```

Always persist the `formVersion`.

A response created against version 1 must remain interpretable after version 2 is published.

---

# 18. Excel Integration Architecture

Excel must be treated as an integration target, not as the primary form state.

Use this flow:

```text
Form UI
   ↓
Form Engine
   ↓
Response Store
   ↓
Response Serializer
   ↓
Excel Mapper
   ↓
Excel Adapter
   ↓
Excel
```

Never do:

```tsx
onChange={() => writeToExcel()}
```

The UI must never directly manipulate Excel.

---

# 19. Excel Mapper

The mapper converts generic form answers into spreadsheet columns.

Example:

```ts
const excelMapping = {
  first_name: "First Name",
  last_name: "Last Name",
  employment_type: "Employment Type",
  years_experience: "Years of Experience"
};
```

The mapper owns:

- column mapping
- formatting
- value normalization
- multi-select serialization
- date formatting
- optional field handling

Example:

```ts
mapResponseToExcelRow(response)
```

Output:

```ts
{
  "First Name": "John",
  "Last Name": "Doe",
  "Employment Type": "Contractor",
  "Years of Experience": 4
}
```

Question definitions must not know spreadsheet column names unless a deliberate shared metadata contract is established.

Prefer keeping Excel-specific mapping in the integration layer.

---

# 20. Excel Adapter

The adapter owns the actual Excel provider implementation.

Example interface:

```ts
interface SpreadsheetAdapter {
  appendRow(row: Record<string, unknown>): Promise<void>;

  updateRow(
    identifier: string,
    row: Record<string, unknown>
  ): Promise<void>;
}
```

This allows future providers:

```text
Excel
Google Sheets
CSV
Database
CRM
Webhook
```

without changing the form engine.

---

# 21. Idempotency

Excel synchronization must be idempotent.

Every completed response needs a stable `responseId`.

Never blindly append the same response multiple times during retries.

Bad:

```text
submit
→ Excel append
→ timeout
→ retry
→ Excel append
→ duplicate row
```

Preferred:

```text
responseId = abc-123

sync
→ check/create using responseId
→ retry
→ recognize abc-123
→ update/no-op
```

The spreadsheet should contain a stable response identifier column.

Example:

```text
Response ID
Form ID
Form Version
Submitted At
First Name
Last Name
...
```

---

# 22. Excel Synchronization Failure

Excel failures must not break the form.

Example:

```text
User submits
      ↓
Response saved successfully
      ↓
Excel sync attempted
      ↓
       ├── success → SYNCED
       │
       └── failure → SYNC_FAILED
                         ↓
                       retry
```

If backend infrastructure exists, prefer asynchronous synchronization:

```text
Frontend
   ↓
Submit response
   ↓
Backend stores response
   ↓
Queue/event
   ↓
Excel worker
   ↓
Excel
```

Do not make the browser responsible for long-running spreadsheet synchronization.

---

# 23. Recommended API Boundary

If a backend exists, use the frontend only for form interaction and response submission.

Example:

```http
POST /api/forms/{formId}/responses
```

Payload:

```json
{
  "formVersion": 1,
  "answers": {
    "employment_type": "contractor",
    "years_experience": 4
  }
}
```

The backend should:

1. Validate the form ID.
2. Validate the form version.
3. Validate the answers.
4. Persist the response.
5. Mark synchronization as pending.
6. Trigger Excel synchronization.
7. Return the response ID and status.

Never trust the frontend to be the source of truth for validation or authorization.

---

# 24. Form Configuration Versioning

Forms must be versioned.

Example:

```text
employee-onboarding
  v1
  v2
  v3
```

Never mutate production questions in a way that makes historical responses ambiguous.

When a breaking change occurs:

```ts
{
  id: "employee-onboarding",
  version: 2
}
```

Existing responses retain:

```ts
formId: "employee-onboarding"
formVersion: 1
```

---

# 25. Draft and Published Forms

If forms are managed dynamically, use lifecycle states:

```text
DRAFT
  ↓
REVIEW
  ↓
PUBLISHED
  ↓
ARCHIVED
```

Only published forms should be available to end users.

Never allow frontend code to silently modify a published form definition.

---

# 26. Navigation Rules

The navigation layer should support:

### Default sequential navigation

```text
Q1 → Q2 → Q3 → Q4
```

### Conditional navigation

```text
Q1
 ├── A → Q2
 └── B → Q5
```

### Conditional visibility

```text
Q3 only appears when Q1 = yes
```

### Terminal question

```text
Q10 → SUBMIT
```

Navigation rules must be declarative and evaluated by the engine.

---

# 27. Previous Button Behavior

Going backward must not blindly mutate answers.

Rules:

1. Previous returns to the previous active question.
2. Answers should remain available.
3. If a changed answer invalidates a previously visible branch, stale answers from that branch must be handled deliberately.
4. Do not silently retain contradictory answers.

Example:

```text
Q1 = Yes
→ Q2 appears
→ Q2 = "ABC"

User goes back
→ Q1 = No
→ Q2 is no longer applicable
→ Q2 answer must be removed or marked inactive
```

Define this behavior explicitly in the engine.

Preferred default:

**Remove answers belonging to inactive conditional branches unless the product explicitly requires preserving them.**

---

# 28. Accessibility

Every question component must support:

- keyboard navigation
- visible focus state
- semantic labels
- screen-reader-compatible errors
- correct input associations
- accessible option groups
- sufficient contrast
- no color-only meaning

Question definitions must provide labels; components must render them semantically.

---

# 29. Responsive Design

The form renderer must work across:

```text
Mobile
Tablet
Desktop
```

Do not create separate question logic for mobile and desktop.

Use the same component with responsive presentation.

---

# 30. State Management Rules

Use one authoritative response state.

Avoid duplicated state such as:

```text
React component state
+
global store
+
form library state
+
API state
```

unless each has a clearly defined responsibility.

Recommended separation:

```text
Form Engine
  → active question + answers + navigation

Server/API State
  → persisted response

UI State
  → modal/open/animation/loading states
```

Do not duplicate answers into multiple independent stores.

---

# 31. Error Handling

Errors must be classified.

### Validation error

User entered invalid data.

```text
Show inline error.
Do not advance.
```

### Network error

Response submission failed.

```text
Keep response locally.
Allow retry.
```

### Excel sync error

Form is valid but spreadsheet sync failed.

```text
Do not force the user to refill the form.
Mark sync as pending/failed.
Retry through the integration layer.
```

### Configuration error

Invalid form definition.

```text
Fail fast during development/build validation.
Never silently render a broken form.
```

---

# 32. Configuration Validation

Every form definition must be validated before runtime.

Validate:

- unique question IDs
- supported question types
- valid option values
- valid condition references
- valid navigation targets
- no impossible references
- no duplicate option values
- required configuration fields
- no circular navigation
- no unreachable required questions

Create a development-time validator:

```ts
validateFormDefinition(formDefinition)
```

Fail CI/build when the definition is invalid.

---

# 33. Circular Flow Protection

The engine must detect:

```text
Q1 → Q2 → Q3 → Q1
```

unless intentional looping is explicitly supported.

Do not allow accidental infinite navigation.

Use visited-question tracking while resolving the active path.

---

# 34. Security

Never put secrets in frontend configuration.

Do not expose:

- Excel credentials
- API tokens
- service account credentials
- private spreadsheet IDs unless intentionally public
- backend secrets

Frontend configuration may contain public identifiers only.

All privileged spreadsheet operations must happen server-side.

---

# 35. Data Privacy

Form answers may contain sensitive business or personal information.

Rules:

- Do not log full answers in production.
- Do not log spreadsheet credentials.
- Redact sensitive fields in error logs.
- Send only required data to integrations.
- Use HTTPS for all network communication.
- Validate and sanitize server-side.
- Define retention requirements.
- Avoid storing duplicate copies unnecessarily.

---

# 36. Logging

Use structured logs.

Good:

```text
response.submitted
responseId=abc123
formId=employee-onboarding
formVersion=2
```

Good:

```text
excel.sync.failed
responseId=abc123
attempt=2
```

Avoid:

```text
User submitted:
{
  password: "...",
  phone: "...",
  email: "..."
}
```

Never log complete response payloads by default.

---

# 37. Performance Rules

The form should remain fast with 5, 20, or 100+ questions.

Do not render all heavy components unnecessarily.

Prefer:

```text
Current question
+
minimal surrounding UI
```

For very large forms:

- lazy-load heavy question components
- memoize stable question definitions
- avoid recalculating the entire form tree on every answer
- evaluate only conditions affected by changed answers where practical

Do not prematurely introduce complex optimization for small forms.

---

# 38. Testing Strategy

Test the engine independently from React.

### Unit tests

Test:

```text
condition evaluator
question resolver
validation engine
progress calculator
response serializer
Excel mapper
```

### Form definition tests

Test:

```text
all question IDs are unique
all referenced questions exist
all options are valid
all branches are reachable
```

### UI tests

Test generic components:

```text
TextQuestion
SingleSelectQuestion
MultiSelectQuestion
DateQuestion
...
```

Do not write one test implementation for every individual configured question unless the question contains unique behavior.

### Integration tests

Test:

```text
form submission
response persistence
Excel synchronization
retry behavior
idempotency
```

---

# 39. Code Style Rules

## TypeScript

Use strict TypeScript.

Prefer:

```ts
type
interface
enum/union types
generics
readonly data where appropriate
```

Avoid:

```ts
any
```

unless there is a documented boundary where it is unavoidable.

---

## Naming

Use:

```text
PascalCase     → React components/classes
camelCase      → variables/functions
UPPER_SNAKE    → constants when appropriate
kebab-case     → route names
```

Examples:

```text
FormRenderer
conditionEvaluator
EXCEL_SYNC_TIMEOUT
```

Question IDs should be semantic:

```text
employment_type
years_of_experience
has_previous_employer
```

Avoid:

```text
q1
q2
question3
```

unless they are intentionally anonymous.

---

# 40. Pure Functions

Prefer pure functions for business logic.

Example:

```ts
function evaluateCondition(
  condition: Condition,
  answers: FormAnswers
): boolean
```

A pure function should:

- receive input
- calculate output
- avoid side effects

Do not:

```ts
evaluateCondition() {
  setState(...);
  callApi(...);
  writeExcel(...);
}
```

---

# 41. Dependency Direction

Dependencies must flow inward toward business logic.

Preferred:

```text
UI
 ↓
Form Engine
 ↓
Domain Types / Configuration
 ↓
Services / Adapters
```

Not:

```text
Question Component
 ↓
Excel Service
 ↓
Form Definition
 ↓
Random utility
```

The form engine must not depend directly on a concrete Excel implementation.

---

# 42. Adapter Pattern

Use interfaces for external systems.

```ts
interface SpreadsheetAdapter {
  appendRow(row: SpreadsheetRow): Promise<void>;
}
```

Then:

```ts
class ExcelSpreadsheetAdapter
  implements SpreadsheetAdapter {
  ...
}
```

The engine depends on:

```ts
SpreadsheetAdapter
```

not:

```ts
ExcelSpreadsheetAdapter
```

This keeps the architecture replaceable.

---

# 43. Workflow for Adding a New Question

An agent adding a question must follow:

```text
1. Identify required component type.
2. Reuse an existing component if possible.
3. Add/update question definition.
4. Add options if required.
5. Add validation.
6. Add visibility/navigation condition.
7. Add Excel mapping if the answer must be exported.
8. Validate the form definition.
9. Test the affected branch.
10. Test submission/synchronization.
```

Do not create a new UI component unless an existing component type genuinely cannot represent the interaction.

---

# 44. Workflow for Adding a New Form

```text
1. Create form definition.
2. Assign stable form ID.
3. Assign version.
4. Define questions.
5. Define answer options.
6. Define conditions.
7. Define validation.
8. Define navigation.
9. Define Excel mapping.
10. Run configuration validation.
11. Run engine tests.
12. Run UI tests.
13. Test complete submission.
14. Test Excel synchronization.
15. Publish the form.
```

No new form-specific renderer should be created.

---

# 45. Workflow for Changing a Question

Before changing a production question:

1. Determine whether the question ID is already used by stored responses.
2. Do not casually rename the ID.
3. Determine whether the change is backward compatible.
4. Increment the form version when required.
5. Update validation/configuration.
6. Update Excel mapping if required.
7. Test old response compatibility.
8. Test new response flow.

---

# 46. Agent Rules

The coding agent must follow these rules:

### Rule 1 — Configuration first

Before writing UI code, inspect the form definition and determine whether the requirement can be represented by existing configuration.

### Rule 2 — Reuse before creating

Before creating a new component, search the component registry.

### Rule 3 — No question-specific pages

Do not create:

```text
EmploymentQuestion.tsx
AgeQuestion.tsx
CountryQuestion.tsx
```

unless the interaction is genuinely a new reusable component type.

### Rule 4 — No business logic in UI

Do not put branching logic into JSX.

### Rule 5 — No Excel logic in UI

Never import Excel services into question components.

### Rule 6 — No direct spreadsheet writes from browser events

`onChange`, `onNext`, and `onSubmit` must not directly write spreadsheet cells.

### Rule 7 — Stable IDs

Never use array indexes as business identifiers.

### Rule 8 — Preserve version compatibility

Do not change production form semantics without considering historical responses.

### Rule 9 — Validate configuration

Every form definition must pass configuration validation.

### Rule 10 — Keep integrations replaceable

External providers must be accessed through adapters.

---

# 47. Agent Decision Tree

When a requirement arrives, follow this sequence:

```text
Requirement
    ↓
Is this new question content?
    │
    ├── YES → update form definition
    │
    └── NO
         ↓
Is this a new interaction type?
    │
    ├── YES → create reusable question component
    │
    └── NO
         ↓
Is this branching/navigation?
    │
    ├── YES → update condition/navigation engine/config
    │
    └── NO
         ↓
Is this response persistence?
    │
    ├── YES → response service/store
    │
    └── NO
         ↓
Is this spreadsheet behavior?
    │
    ├── YES → Excel adapter/mapper/sync layer
    │
    └── NO
         ↓
Is this visual behavior?
    │
    ├── YES → UI component/layout layer
    │
    └── NO → determine correct domain layer before coding
```

---

# 48. Anti-Patterns

Never build the system like this:

```text
FormPage.tsx
 ├── Question 1
 ├── Question 2
 ├── if answer === "yes"
 ├── Question 3
 ├── writeToExcel()
 ├── if answer === "no"
 ├── Question 4
 └── 500 lines of JSX
```

This becomes impossible to maintain as the number of questions grows.

Also avoid:

```text
question.ts
  ├── question text
  ├── React component
  ├── validation
  ├── API call
  ├── Excel column
  └── styling
```

Instead keep concerns separated.

---

# 49. Target Architecture

The desired system should look conceptually like:

```text
                 ┌─────────────────────┐
                 │ FORM CONFIGURATION  │
                 │                     │
                 │ questions           │
                 │ options             │
                 │ conditions          │
                 │ validation          │
                 │ navigation          │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    FORM ENGINE      │
                 │                     │
                 │ state               │
                 │ validation          │
                 │ branching           │
                 │ navigation          │
                 │ progress            │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    UI RENDERER      │
                 │                     │
                 │ reusable components │
                 │ layout              │
                 │ navigation UI       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  RESPONSE SERVICE   │
                 │                     │
                 │ persist             │
                 │ serialize           │
                 │ lifecycle           │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ INTEGRATION LAYER   │
                 │                     │
                 │ Excel mapper        │
                 │ Excel adapter       │
                 │ retry               │
                 │ idempotency         │
                 └──────────┬──────────┘
                            │
                            ▼
                       ┌─────────┐
                       │ EXCEL   │
                       └─────────┘
```

---

# 50. Definition of Done

A dynamic form feature is complete only when:

- [ ] Questions are configuration-driven.
- [ ] Question IDs are stable and unique.
- [ ] Existing question components are reused where possible.
- [ ] Conditional logic is declarative.
- [ ] Navigation is handled by the form engine.
- [ ] Validation is separate from UI.
- [ ] Progress works with conditional branches.
- [ ] Form version is recorded with every response.
- [ ] Responses are stored independently from Excel.
- [ ] Excel mapping is isolated from form/UI code.
- [ ] Excel synchronization is idempotent.
- [ ] Spreadsheet failures do not lose user responses.
- [ ] External integrations are accessed through adapters.
- [ ] Configuration validation passes.
- [ ] No secrets exist in frontend code.
- [ ] Sensitive response data is not logged.
- [ ] Unit tests cover engine logic.
- [ ] Integration tests cover response submission and Excel synchronization.
- [ ] The form works without creating question-specific pages/components.
- [ ] Adding another 20 questions does not require architectural changes.

---

# 51. Core Rule

**The number of questions must not determine the amount of frontend code.**

If a form changes from:

```text
5 questions
```

to:

```text
50 questions
```

the expected implementation change should primarily be:

```text
FORM CONFIGURATION
```

not:

```text
50 new React components
50 new pages
50 new API endpoints
50 new state handlers
50 new Excel handlers
```

The architecture exists specifically to prevent that coupling.
