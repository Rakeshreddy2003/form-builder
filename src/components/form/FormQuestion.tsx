import React from 'react';
import type { QuestionDefinition } from '../../types/form.types.ts';
import { getQuestionComponent } from './componentRegistry.ts';

export interface FormQuestionProps {
  question: QuestionDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export const FormQuestion: React.FC<FormQuestionProps> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const descId = `desc_${question.id}`;
  const errorId = `error_${question.id}`;

  const inputElement = React.createElement(getQuestionComponent(question.type), {
    question,
    value: value as never,
    onChange: onChange as (v: never) => void,
    error,
    disabled,
    autoFocus: true,
  });

  return (
    <div className="rk-question-container" key={question.id}>
      <header className="rk-question-header">
        {question.section && (
          <div className="rk-question-section-tag">
            <span className="rk-section-indicator-dot" />
            <span className="rk-section-tag-text">{question.section}</span>
          </div>
        )}

        <label className="rk-question-title" htmlFor={`input_${question.id}`}>
          {question.label}
          {question.required && (
            <span className="rk-required-badge" title="Required" aria-label="Required">
              *
            </span>
          )}
        </label>

        {question.description && (
          <p id={descId} className="rk-question-description">
            {question.description}
          </p>
        )}
      </header>

      <div className="rk-question-body">
        {inputElement}
      </div>

      {error && (
        <div id={errorId} className="rk-error-message" role="alert">
          <svg className="rk-error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

