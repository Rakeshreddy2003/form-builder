import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const TextareaQuestion: React.FC<QuestionProps<string>> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const inputId = `textarea_${question.id}`;
  const errorId = `error_${question.id}`;
  const descId = `desc_${question.id}`;

  return (
    <div className="rk-input-wrapper">
      <textarea
        id={inputId}
        className={`rk-textarea ${error ? 'rk-input-error' : ''}`}
        rows={4}
        value={value ?? ''}
        placeholder={question.placeholder || 'Type your detailed answer here...'}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={[question.description ? descId : null, error ? errorId : null]
          .filter(Boolean)
          .join(' ') || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

