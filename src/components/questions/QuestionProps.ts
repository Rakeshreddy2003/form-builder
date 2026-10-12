import type { QuestionDefinition } from '../../types/form.types.ts';

export interface QuestionProps<T = unknown> {
  question: QuestionDefinition;
  value: T;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

