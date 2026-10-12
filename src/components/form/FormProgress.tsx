import React from 'react';

export interface FormProgressProps {
  percentage: number;
  currentStep: number;
  totalSteps: number;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  percentage,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="rk-progress-container">
      <div className="rk-progress-meta">
        <span className="rk-progress-step-text">
          Question {currentStep} of {totalSteps}
        </span>
        <span className="rk-progress-percentage">{percentage}% completed</span>
      </div>

      <div
        className="rk-progress-bar-track"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Form completion progress"
      >
        <div
          className="rk-progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

