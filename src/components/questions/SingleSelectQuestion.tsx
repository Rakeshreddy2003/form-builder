import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const SingleSelectQuestion: React.FC<QuestionProps<string>> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  const options = question.options || [];

  return (
    <div
      role="radiogroup"
      aria-label={question.label}
      className="rk-options-grid"
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const optionId = `opt_${question.id}_${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={`rk-option-card ${isSelected ? 'rk-option-card-selected' : ''} ${
              disabled ? 'rk-option-card-disabled' : ''
            }`}
          >
            <input
              id={optionId}
              type="radio"
              name={question.id}
              value={option.value}
              checked={isSelected}
              disabled={disabled}
              className="rk-radio-hidden"
              onChange={() => onChange(option.value)}
            />
            <div className="rk-option-indicator">
              <span className={`rk-radio-circle ${isSelected ? 'rk-radio-checked' : ''}`} />
            </div>
            <div className="rk-option-content">
              <span className="rk-option-label">{option.label}</span>
              {option.description && (
                <span className="rk-option-desc">{option.description}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};

