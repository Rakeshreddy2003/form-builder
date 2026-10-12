import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const NumberQuestion: React.FC<QuestionProps<number | string>> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const inputId = `number_${question.id}`;
  const errorId = `error_${question.id}`;
  const descId = `desc_${question.id}`;

  const minRule = question.validation?.find((r) => r.type === 'min');
  const maxRule = question.validation?.find((r) => r.type === 'max');

  return (
    <div className="rk-input-wrapper">
      <input
        id={inputId}
        type="number"
        className={`rk-input ${error ? 'rk-input-error' : ''}`}
        value={value ?? ''}
        placeholder={question.placeholder || 'Enter a number...'}
        min={minRule?.value !== undefined ? String(minRule.value) : undefined}
        max={maxRule?.value !== undefined ? String(maxRule.value) : undefined}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={[question.description ? descId : null, error ? errorId : null]
          .filter(Boolean)
          .join(' ') || undefined}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? '' : Number(val));
        }}
      />
    </div>
  );
};

