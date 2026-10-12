import React from 'react';
import type { QuestionProps } from './QuestionProps.ts';

export const MultiSelectQuestion: React.FC<QuestionProps<string[]>> = ({
  question,
  value = [],
  onChange,
  disabled = false,
}) => {
  const options = question.options || [];
  const selectedValues = Array.isArray(value) ? value : [];

  const handleToggle = (optVal: string) => {
    if (disabled) return;
    const targetOption = options.find((o) => o.value === optVal);
    const isTargetExclusive = Boolean(targetOption?.exclusive);

    if (selectedValues.includes(optVal)) {
      onChange(selectedValues.filter((v) => v !== optVal));
    } else {
      if (isTargetExclusive) {
        // Selecting an exclusive option deselects all other options
        onChange([optVal]);
      } else {
        // Selecting a standard option deselects any active exclusive options
        const exclusiveValues = options.filter((o) => o.exclusive).map((o) => o.value);
        const nonExclusiveSelection = selectedValues.filter((v) => !exclusiveValues.includes(v));
        onChange([...nonExclusiveSelection, optVal]);
      }
    }
  };

  return (
    <div
      role="group"
      aria-label={question.label}
      className="rk-options-grid"
    >
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const optionId = `chk_${question.id}_${option.value}`;

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
              type="checkbox"
              value={option.value}
              checked={isSelected}
              disabled={disabled}
              className="rk-checkbox-hidden"
              onChange={() => handleToggle(option.value)}
            />
            <div className="rk-option-indicator">
              <span className={`rk-checkbox-box ${isSelected ? 'rk-checkbox-checked' : ''}`}>
                {isSelected && (
                  <svg className="rk-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
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

