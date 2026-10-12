import React from 'react';

export interface FormNavigationProps {
  canGoBack: boolean;
  isLastQuestion: boolean;
  isSubmitting?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  canGoBack,
  isLastQuestion,
  isSubmitting = false,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  return (
    <footer className="rk-form-navigation">
      <div className="rk-nav-left">
        {canGoBack && (
          <button
            type="button"
            className="rk-btn rk-btn-secondary"
            onClick={onPrevious}
            disabled={isSubmitting}
          >
            <svg className="rk-btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Previous</span>
          </button>
        )}
      </div>

      <div className="rk-nav-right">
        {isLastQuestion ? (
          <button
            type="button"
            className="rk-btn rk-btn-primary rk-btn-submit"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="rk-spinner" />
                <span>Submitting & Syncing...</span>
              </>
            ) : (
              <>
                <span>Submit Form</span>
                <svg className="rk-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="rk-btn rk-btn-primary"
            onClick={onNext}
            disabled={isSubmitting}
          >
            <span>Next</span>
            <svg className="rk-btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </footer>
  );
};

