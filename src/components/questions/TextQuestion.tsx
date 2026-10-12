import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const TextQuestion: React.FC<QuestionProps<string>> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const inputId = `input_${question.id}`;
  const errorId = `error_${question.id}`;
  const descId = `desc_${question.id}`;

  return (
    <div className="rk-input-wrapper">
      <input
        id={inputId}
        type="text"
        className={`rk-input ${error ? 'rk-input-error' : ''}`}
        value={value ?? ''}
        placeholder={question.placeholder || 'Type your answer here...'}
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

