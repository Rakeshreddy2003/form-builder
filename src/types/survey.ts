export type QuestionType =
  | 'short_answer'
  | 'long_answer'
  | 'single_choice'
  | 'multiple_choice'
  | 'numeric';

export type QuestionFlow = 'general' | 'link';

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options: string[]; // Options for single_choice and multiple_choice
  flow: QuestionFlow; // 'general' or 'link'
  // When flow === 'link', map option label -> destination question id or 'END' or 'NEXT'
  optionLinks: Record<string, string>;
  // Optional override for destination when continuing after this question
  defaultNextId?: string;
  description?: string;
  required?: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[]; // Max 15 questions
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string; // e.g. "001", "002"
  surveyId: string;
  submittedAt: string;
  answers: Record<string, any>; // questionId -> response value
}
