import React from 'react';
import type { QuestionType } from '../../types/form.types.ts';
import type { QuestionProps } from '../questions/QuestionProps.ts';
import {
  TextQuestion,
  TextareaQuestion,
  NumberQuestion,
  EmailQuestion,
  SingleSelectQuestion,
  MultiSelectQuestion,
  DropdownQuestion,
  DateQuestion,
  BooleanQuestion,
} from '../questions/index.ts';

// Reusable component registry typed without any
export const questionComponentRegistry: Record<
  QuestionType,
  React.ComponentType<QuestionProps<never>>
> = {
  text: TextQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  textarea: TextareaQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  number: NumberQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  email: EmailQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  singleSelect: SingleSelectQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  multiSelect: MultiSelectQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  dropdown: DropdownQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  date: DateQuestion as unknown as React.ComponentType<QuestionProps<never>>,
  boolean: BooleanQuestion as unknown as React.ComponentType<QuestionProps<never>>,
};

export function getQuestionComponent(
  type: QuestionType
): React.ComponentType<QuestionProps<never>> {
  const component = questionComponentRegistry[type];
  if (!component) {
    throw new Error(`Unregistered question interaction type: "${type}". Please register a reusable component.`);
  }
  return component;
}

