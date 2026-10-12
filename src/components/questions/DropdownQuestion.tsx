import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const DropdownQuestion: React.FC<QuestionProps<string>> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const inputId = `select_${question.id}`;
  const errorId = `error_${question.id}`;
  const descId = `desc_${question.id}`;
  const options = question.options || [];

  return (
    <div className="rk-input-wrapper">
      <select
        id={inputId}
        className={`rk-select ${error ? 'rk-input-error' : ''}`}
        value={value ?? ''}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={[question.description ? descId : null, error ? errorId : null]
          .filter(Boolean)
          .join(' ') || undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {question.placeholder || '-- Please select an option --'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

