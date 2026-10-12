# Add-on Feature: Form Creator / Builder Role

## 1. Purpose

The responder experience already exists and is working as the runtime for answering a configured survey.

This feature adds a **Form Creator / Builder view**.

The creator view is responsible for creating and configuring forms that the existing responder engine will consume.

The key architectural rule is:

> The Builder creates form configuration. The Responder executes form configuration.

Do not build a second form engine for the creator.

Do not duplicate respondent rendering logic.

The builder must produce the same configuration model already consumed by the responder.

The source requirements define two primary roles: a form creator who creates/configures/previews/exports forms, and a respondent who answers the published/configured form. The required workflow is Create form → add/edit/reorder questions → configure answer types/options → configure branching → preview/test → answer survey → submit → export responses. [Source: Custom Survey Form Generator requirements]

---

# 2. What We Are Building

Add a new **Creator / Form Builder role view** to the existing application.

Current state:

```text
Form Definition
      ↓
Existing Responder View
      ↓
User answers survey
```

Target state:

```text
                    Form Creator
                         │
                         ▼
                  Form Builder View
                         │
                         ▼
                Form Definition
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      Preview / Test          Responder View
                                     │
                                     ▼
                                  Response
                                     │
                                     ▼
                              Excel / Sheets
```

The creator should be able to:

- Create a form
- Enter title and description
- Add questions
- Edit questions
- Delete questions
- Reorder questions
- Select question type
- Mark questions required/optional
- Add/edit/remove/reorder options
- Configure conditional branching
- Route an option to another question
- Route an option to End Survey
- Preview the form using the existing responder engine
- Validate the form before publishing/using it

The requirements explicitly call for a builder screen with form title, question count, Add Question, editable question cards, type selector, options editor, branching configuration, delete/reorder actions, and Create/Preview controls. [Source: Custom Survey Form Generator requirements]

---

# 3. Important Scope

This is an **add-on feature**.

Do not rewrite the existing dynamic form engine unless the current implementation is missing a capability required by this feature.

Do not replace the existing responder UI.

Do not create another independent response engine.

Do not duplicate question rendering components.

The builder is an authoring interface for the same form-definition model.

---

# 4. Roles

For the current implementation, support these conceptual roles:

## FORM_CREATOR

Can:

- Create forms
- Edit forms
- Configure questions
- Configure options
- Configure branching
- Reorder questions
- Delete questions
- Preview/test forms
- Validate forms
- View collected responses where supported by the existing application
- Export responses where supported

## RESPONDER

Can:

- Open a configured form
- Answer questions
- Navigate Previous/Next
- Follow dynamic branches
- Submit responses

Do not expose creator controls in the responder view.

Do not expose form editing controls to responders.

---

# 5. Creator Route

Add a dedicated creator route/view.

The exact route should follow the existing application routing conventions.

A reasonable structure is:

```text
/creator
/creator/forms
/creator/forms/new
/creator/forms/:formId/edit
/creator/forms/:formId/preview
```

Do not blindly implement these exact URLs if the existing application has an established routing convention.

The important separation is:

```text
Creator
  ├── Form list
  ├── Create form
  ├── Edit form
  └── Preview

Responder
  └── Execute form
```

---

# 6. Form Builder Screen

The main builder should contain:

```text
┌─────────────────────────────────────────────────────────┐
│ Create Survey                                            │
│                                                         │
│ Form Title                                               │
│ [_______________________________________________]       │
│                                                         │
│ Description                                              │
│ [_______________________________________________]       │
│                                                         │
│ Questions                         7 / 15                │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. What is your name?                               │ │
│ │                                                     │ │
│ │ Type: Short Answer       Required: ON               │ │
│ │                                                     │ │
│ │ [Edit] [Move ↑] [Move ↓] [Delete]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2. What is your profession?                         │ │
│ │                                                     │ │
│ │ Type: Single Choice       Required: ON              │ │
│ │                                                     │ │
│ │ Options:                                            │ │
│ │   ○ Doctor                                          │ │
│ │   ○ Engineer                                        │ │
│ │   ○ Lawyer                                          │ │
│ │                                                     │ │
│ │ Branching: Configured                               │ │
│ │                                                     │ │
│ │ [Edit] [Logic] [Move ↑] [Move ↓] [Delete]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Add Question]                                        │
│                                                         │
│ [Save Draft]                         [Preview]           │
└─────────────────────────────────────────────────────────┘
```

Keep the layout clean and easy to understand.

---

# 7. Maximum Question Count

The demo requirement specifies a maximum of **15 questions per form**.

Enforce this in the builder.

Display:

```text
Questions: 7 / 15
```

When the form reaches 15 questions:

- Disable Add Question
- Clearly communicate the limit
- Do not silently create question 16

The limit should be represented as configuration/business logic rather than scattered throughout components.

---

# 8. Creating a Question

When the creator clicks Add Question, open the existing question editor pattern.

The creator must be able to configure:

```text
Question ID
Question Text
Question Type
Required / Optional
Options where applicable
Branching where applicable
```

Supported question types from the requirements:

```text
short_answer
long_answer
single_choice
multiple_choice
numeric
```

The source requirements explicitly define these five question types. [Source: Custom Survey Form Generator requirements]

Do not add unnecessary question types to this feature unless the existing engine already supports them and there is a concrete requirement.

---

# 9. Question Editor

A question editor should contain:

### Question text

```text
Question
[What is your profession?]
```

Required toggle:

```text
Required
[ ON ]
```

Type:

```text
Question Type
[ Single Choice ▼ ]
```

The available controls should change based on the selected type.

---

# 10. Question Type Behavior

## Short Answer

Show:

```text
Question text
Required
```

No options editor.

---

## Long Answer

Show:

```text
Question text
Required
```

No options editor.

---

## Numeric

Show:

```text
Question text
Required
```

The responder should use numeric validation.

---

## Single Choice

Show:

```text
Question text
Required

Options

1. [Doctor          ] [Delete]
2. [Engineer        ] [Delete]
3. [Lawyer          ] [Delete]

[+ Add Option]

[Configure Branching]
```

---

## Multiple Choice

Show:

```text
Question text
Required

Options

1. [TV              ] [Delete]
2. [Refrigerator    ] [Delete]
3. [Washing machine ] [Delete]

[+ Add Option]
```

For the initial demo, multiple-choice questions use normal sequence flow rather than option-specific routing.

The source requirements explicitly defer multi-select routing because several selected options could point to different destinations. [Source: Custom Survey Form Generator requirements]

---

# 11. Option Management

For Single Choice and Multiple Choice:

Creator can:

- Add option
- Rename option
- Delete option
- Reorder option

Every option must have a stable ID.

Do not identify options by array index.

Example:

```ts
{
  id: "doctor",
  label: "Doctor"
}
```

not:

```ts
{
  index: 0,
  label: "Doctor"
}
```

---

# 12. Branching / Logic Editor

Create a dedicated logic configuration experience.

The requirements define a separate Logic Editor screen where each answer option can be assigned a destination question or End Survey. [Source: Custom Survey Form Generator requirements]

For a Single Choice question:

```text
Question:
What is your profession?

Doctor
  [Go to → Q2 - Medical Specialty ▼]

Engineer
  [Go to → Q2 - Engineering Experience ▼]

Lawyer
  [Go to → Q2 - Legal Practice ▼]
```

Available destinations:

```text
Any existing question
End Survey
```

Do not allow the current question to route to itself.

---

# 13. Chained Branching

Branching must support multiple levels.

Example:

```text
Q1 Profession
│
├── Doctor
│     ↓
│   Q2 Medical Specialty
│     │
│     ├── Cardiologist → Q3
│     └── Neurologist  → Q4
│
├── Engineer
│     ↓
│   Q2 Engineering Experience
│     ↓
│   Q3
│
└── Lawyer
      ↓
    Q2 Legal Practice
```

Do not implement branching as a one-level special case.

The builder must configure the same generic destination model consumed by the responder engine.

The requirements explicitly require chained/tree-style branching and allow branches to rejoin at shared questions or end the survey. [Source: Custom Survey Form Generator requirements]

---

# 14. Branch Validation

Before a form can be previewed/published, validate the question graph.

At minimum detect:

- Destination references a deleted question
- Destination references an unknown question
- Question routes to itself
- Accidental loops
- Invalid option destination
- Missing required branch configuration where the selected policy requires it

The source requirements explicitly require graph validation to prevent invalid destinations and accidental loops. [Source: Custom Survey Form Generator requirements]

Do not silently repair invalid graph configuration.

Show the creator what needs to be fixed.

Example:

```text
Branching configuration has an error.

"Doctor" currently points to a deleted question.

Please select a valid destination.
```

---

# 15. Default / Normal Sequence

Not every question needs branching.

The default flow is:

```text
Q1 → Q2 → Q3 → Q4
```

If no conditional destination is configured, continue to the next applicable question.

For the initial implementation, follow one consistent rule for missing destinations:

Recommended:

```text
Configured branch → use configured destination

No configured branch → use normal next-in-sequence
```

The behavior must be consistent between builder preview and responder runtime.

The requirements allow either fallback behavior or requiring complete configuration; choose one and implement it consistently. [Source: Custom Survey Form Generator requirements]

---

# 16. Reordering Questions

Creator must be able to reorder questions.

Example:

```text
Q1
Q2
Q3
Q4
```

Move Q4 before Q2:

```text
Q1
Q4
Q2
Q3
```

Important:

Reordering must NOT change stable question IDs.

Branching references must continue to point to the same question IDs.

Never implement references using array positions.

After reorder:

```text
Question ID remains unchanged
Branch destination remains unchanged
```

Only normal sequence order changes.

---

# 17. Deleting Questions

When deleting a question:

1. Check whether any branch points to it.
2. Show a warning if it is referenced.
3. Require the creator to resolve invalid destinations or apply the project's defined deletion behavior.
4. Never leave broken references silently.

Example:

```text
Cannot delete "Medical Specialty".

3 branching rules currently point to this question.

Update those destinations before deleting.
```

---

# 18. Preview

The creator must be able to preview the form using the existing responder engine.

Do NOT create a second renderer for preview.

The flow should be:

```text
Builder
   ↓
Current Form Definition
   ↓
Validate
   ↓
Preview
   ↓
Existing Responder Renderer
```

Preview should behave exactly like the real responder experience:

- One question per screen
- Previous
- Next
- Progress
- Conditional routing
- Validation
- End survey
- Submit/preview completion

The only difference is that the creator is testing the form rather than submitting a production response.

---

# 19. Test Branching from Preview

The creator should be able to test different paths.

Example:

```text
Preview

Q1 Profession

[Doctor]
[Engineer]
[Lawyer]
```

The creator should be able to return to Q1 and test another path.

Do not require rebuilding or refreshing the form between branches.

---

# 20. Save / Draft Model

The builder should maintain an editable form definition.

Conceptually:

```text
Form
├── id
├── title
├── description
├── status
└── questions[]
```

Use stable IDs.

A new form can begin as:

```text
DRAFT
```

Do not expose incomplete/invalid forms as valid responder forms.

---

# 21. Form Definition Contract

The builder and responder must share the same form-definition model.

Conceptually:

```ts
interface FormDefinition {
  id: string;
  title: string;
  description?: string;
  questions: QuestionDefinition[];
}
```

```ts
interface QuestionDefinition {
  id: string;
  text: string;
  type:
    | "short_answer"
    | "long_answer"
    | "single_choice"
    | "multiple_choice"
    | "numeric";
  required: boolean;
  options?: OptionDefinition[];
  defaultNextQuestionId?: string;
}
```

```ts
interface OptionDefinition {
  id: string;
  label: string;
  nextQuestionId?: string;
}
```

Use the existing project's actual types if they already exist.

Do not create duplicate types.

---

# 22. State Separation

Separate:

### Builder State

```text
form metadata
question definitions
options
branching rules
draft changes
validation errors
```

from:

### Responder State

```text
current question
answers
visited questions
progress
submission
```

Do not mix builder editing state with respondent answers.

---

# 23. Builder UI Must Not Contain Runtime Logic

The builder may configure branching, but it must not implement its own copy of branching behavior.

Bad:

```ts
if (selectedOption === "doctor") {
  navigateTo("q2");
}
```

Good:

```text
Builder
    ↓
stores:
option.nextQuestionId
    ↓
Responder engine
    ↓
evaluates destination
```

The builder edits configuration.

The engine interprets configuration.

---

# 24. Configuration Validation

Before Save/Preview:

```text
Validate form
    ↓
Validate question count
    ↓
Validate question IDs
    ↓
Validate question text
    ↓
Validate supported type
    ↓
Validate required options
    ↓
Validate option IDs
    ↓
Validate destinations
    ↓
Validate graph
    ↓
Valid → Save/Preview
Invalid → Show errors
```

---

# 25. Form Builder Visual Design

The existing responder has already been redesigned toward a light, clean field-survey visual style.

The creator view should use the SAME design system.

Do not create a separate visual language.

Use:

- Light background
- White cards
- Green primary action
- Dark charcoal text
- Soft borders
- Clear section hierarchy
- Comfortable spacing
- Responsive layout

The creator view should feel like the administration side of the same application.

Avoid:

- Dark developer dashboard
- Neon blue
- Excessive gradients
- Excessive glassmorphism
- Futuristic developer-console styling

---

# 26. Builder Navigation

Recommended creator navigation:

```text
Creator
│
├── Forms
│
├── Create Form
│
└── Edit Form
```

For an individual form:

```text
Form Builder

[Questions] [Logic] [Preview]
```

The exact navigation can follow the existing application's routing architecture.

---

# 27. Question Card Actions

Every question card should provide:

```text
Edit
Move Up
Move Down
Delete
```

For Single Choice:

```text
Edit
Logic
Move Up
Move Down
Delete
```

Do not overcrowd the card.

Use menus where appropriate on smaller screens.

---

# 28. Empty State

When a new form has no questions:

```text
No questions yet

Add your first question to start building the survey.

[+ Add Question]
```

Do not show an empty dashboard with no guidance.

---

# 29. Unsaved Changes

If the creator modifies the form:

```text
Unsaved changes
```

must be tracked.

Do not silently discard changes when:

- navigating away
- switching builder sections
- opening preview

If the existing application does not yet support persistence, still keep draft state correctly during the builder session.

---

# 30. Excel Integration

The builder does NOT directly manage Excel.

Excel integration remains part of the response/integration layer.

The builder only defines the form.

The responder collects answers.

The response/export layer maps those answers to Excel.

Keep this boundary:

```text
Builder
  ↓
Form Definition

Responder
  ↓
Response

Integration
  ↓
Excel / Google Sheets / Microsoft Excel
```

---

# 31. Do Not Break Existing Responder

After implementing the creator role, verify that the existing responder still works with:

- Existing form definitions
- New forms
- Single choice
- Multiple choice
- Short answer
- Long answer
- Numeric
- Branching
- Chained branching
- Previous
- Next
- Progress
- Submit
- Stale answer cleanup

The creator is an authoring layer; it must not introduce a second runtime.

---

# 32. Implementation Workflow

Follow this order.

## Phase 1 — Inspect

Before changing code:

1. Inspect the existing form-definition types.
2. Inspect the current responder renderer.
3. Inspect the current form engine.
4. Inspect navigation.
5. Inspect condition/branching logic.
6. Inspect response state.
7. Inspect routing.
8. Identify reusable components.
9. Identify where form definitions currently live.

Do not create new abstractions before understanding the current implementation.

---

## Phase 2 — Shared Form Model

Confirm that the existing form-definition model can represent:

- form metadata
- stable question IDs
- question types
- required
- options
- option IDs
- option destinations
- normal sequence

Extend existing types only where necessary.

Do not duplicate them.

---

## Phase 3 — Builder UI

Implement:

- Form title
- Description
- Question count
- Add question
- Question cards
- Question editor
- Type selector
- Required toggle
- Options editor
- Delete
- Reorder

---

## Phase 4 — Logic Editor

Implement:

- Branch configuration
- Destination selectors
- End Survey
- Invalid destination detection
- Graph validation
- Chained branch configuration

---

## Phase 5 — Preview

Connect:

```text
Builder configuration
        ↓
Existing responder engine
```

Do not duplicate the renderer.

---

## Phase 6 — Validation

Add:

- form validation
- question validation
- option validation
- branching validation
- graph validation
- question limit validation

---

## Phase 7 — Polish

Test:

- Desktop
- Tablet
- Mobile
- Long question text
- Many options
- 15 questions
- Reordering
- Deleting referenced questions
- Deep branching
- End Survey
- Rejoining branches
- Preview
- Unsaved changes

---

# 33. Test Scenarios

At minimum test this form:

```text
Q1: Profession?

Doctor
Engineer
Lawyer
```

Routes:

```text
Doctor → Q2 Doctor Specialty
Engineer → Q2 Engineering Experience
Lawyer → Q2 Legal Practice
```

Then:

```text
Q2 Doctor Specialty

Cardiologist → Q3A
Neurologist → Q3B
```

Verify that:

- Doctor reaches Q2 Doctor Specialty.
- Cardiologist reaches Q3A.
- Neurologist reaches Q3B.
- Engineer reaches its own Q2.
- Lawyer reaches its own Q2.
- Branches can rejoin.
- End Survey works.
- Previous works.
- Changing Q1 invalidates unreachable downstream answers.
- Progress reflects the actual route.

This matches the chained-branch requirement in the source document. [Source: Custom Survey Form Generator requirements]

---

# 34. Acceptance Criteria

The feature is complete when:

### Creator

- Can create a form.
- Can enter title and description.
- Can add up to 15 questions.
- Can edit questions.
- Can delete questions.
- Can reorder questions.
- Can select supported question types.
- Can mark questions required/optional.
- Can add/edit/delete/reorder options.

### Logic

- Can configure Single Choice branching.
- Can route every option to another question.
- Can route to End Survey.
- Supports chained branches.
- Supports branch rejoining.
- Detects invalid destinations.
- Detects accidental loops.

### Preview

- Uses the existing responder engine.
- Shows one question at a time.
- Supports Previous/Next.
- Supports validation.
- Supports branching.
- Supports progress.
- Supports End Survey.

### Architecture

- Builder and responder use the same form definition.
- No duplicate form renderer.
- No duplicate condition evaluator.
- No question-specific runtime components.
- Stable IDs are used everywhere.
- Builder does not contain respondent business logic.
- Excel logic remains outside the builder.

### UX

- Light theme.
- Responsive.
- Clear form hierarchy.
- Clear errors.
- Clear unsaved state.
- Easy question editing.
- Easy branching configuration.

---

# 35. Non-Goals

Do NOT implement unless already required by the existing application:

- AI question generation
- Document import
- Translation
- Public sharing
- Team collaboration
- Advanced analytics
- Production authentication/authorization
- Rich multi-select routing
- Complex visual flowchart editor
- Drag-and-drop canvas builder
- Database migration unrelated to this feature
- New spreadsheet integration

The source requirements explicitly list AI generation, document upload/import, translations, user accounts, public sharing, production database, analytics, team collaboration, permissions, and deployment automation as out of scope for the initial demo. [Source: Custom Survey Form Generator requirements]

---

# 36. Final Agent Instruction

This is an ADD-ON to the existing dynamic form engine.

Do not rebuild what already exists.

Think of the architecture as:

```text
                 ┌───────────────────────┐
                 │   FORM DEFINITION     │
                 │       (shared)        │
                 └───────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       FORM CREATOR                    RESPONDER
       / BUILDER                       / RUNTIME
              │                             │
              │ creates                     │ executes
              │ configuration               │ configuration
              ▼                             ▼
        Form Definition                 Answers
                                             │
                                             ▼
                                       Response Store
                                             │
                                             ▼
                                    Spreadsheet Adapter
```

The creator is an **authoring tool**.

The responder is an **execution tool**.

The form definition is the contract between them.

The most important rule:

> Build the Form Creator around the existing form engine instead of building a second form engine inside the creator UI.

Before coding, inspect the existing implementation and reuse as much as possible.
