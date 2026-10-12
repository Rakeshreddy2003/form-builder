import React from 'react';
import { LuTriangleAlert, LuX } from 'react-icons/lu';

export interface FormErrorProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const FormError: React.FC<FormErrorProps> = ({
  message,
  onDismiss,
  onRetry,
}) => {
  return (
    <div className="rk-banner-error" role="alert">
      <div className="rk-banner-icon">
        <LuTriangleAlert size={20} />
      </div>

      <div className="rk-banner-content">
        <p className="rk-banner-text">{message}</p>
      </div>

      <div className="rk-banner-actions">
        {onRetry && (
          <button type="button" className="rk-btn-link" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="rk-btn-icon-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            <LuX size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

