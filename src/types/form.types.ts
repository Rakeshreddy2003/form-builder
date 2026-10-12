import type { Condition } from './condition.types.ts';
import type { ValidationRule } from './validation.types.ts';

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'singleSelect'
  | 'multiSelect'
  | 'dropdown'
  | 'date'
  | 'boolean';

export type FormLifecycle = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type FormAnswers = Record<string, unknown>;

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  /** If true, selecting this option clears all other options (mutually exclusive) */
  exclusive?: boolean;
}

export interface NavigationRule {
  /** Target question ID or null to indicate completion/submit */
  targetQuestionId: string | null;
  /** Condition that must evaluate to true for this rule to apply */
  when?: Condition;
}

export interface QuestionDefinition {
  /** Stable unique identifier used as the key for answers */
  id: string;
  /** Reusable question interaction type */
  type: QuestionType;
  /** Section heading to group questions (e.g. "Section A: Basic Details") */
  section?: string;
  /** Display label/question text */
  label: string;
  /** Optional secondary helper text or instructions */
  description?: string;
  /** Optional placeholder text for inputs */
  placeholder?: string;
  /** Quick flag indicating whether answering is required */
  required?: boolean;
  /** Available options for selection questions */
  options?: QuestionOption[];
  /** Validation rules evaluated before proceeding */
  validation?: ValidationRule[];
  /** Visibility condition (pure condition tree) */
  visibility?: Condition;
  /** Explicit conditional branching rules. If omitted, sequential ordering is followed */
  next?: NavigationRule[];
  /** Optional alias key for persistence / Excel mapping if different from ID */
  responseKey?: string;
  /** Default value if not answered */
  defaultValue?: unknown;
}

export interface FormDefinition {
  /** Stable identifier for the form */
  id: string;
  /** Version number of this form definition */
  version: number;
  /** Human-readable title of the form */
  title: string;
  /** Optional description of the form */
  description?: string;
  /** Lifecycle state */
  status: FormLifecycle;
  /** All questions defined for this form */
  questions: QuestionDefinition[];
  /** Optional Excel column mappings (questionId -> Column Header) */
  excelMapping?: Record<string, string>;
}

