export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  value?: unknown;
  message: string;
  /** Custom pure predicate function for advanced rules */
  customValidator?: (value: unknown, answers: Record<string, unknown>) => boolean;
}

export interface ValidationError {
  questionId: string;
  message: string;
  ruleType: ValidationRuleType;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

