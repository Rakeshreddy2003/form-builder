import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const BooleanQuestion: React.FC<QuestionProps<boolean>> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label={question.label}
      className="rk-boolean-grid"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === true}
        disabled={disabled}
        className={`rk-boolean-button ${value === true ? 'rk-boolean-selected' : ''}`}
        onClick={() => onChange(true)}
      >
        <span className="rk-boolean-text">Yes</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === false}
        disabled={disabled}
        className={`rk-boolean-button ${value === false ? 'rk-boolean-selected' : ''}`}
        onClick={() => onChange(false)}
      >
        <span className="rk-boolean-text">No</span>
      </button>
    </div>
  );
};

