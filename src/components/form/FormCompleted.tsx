import React, { useState } from 'react';
import { LuCheck, LuX, LuClock } from 'react-icons/lu';
import type { FormDefinition } from '../../types/form.types.ts';
import type { FormResponse } from '../../types/response.types.ts';
import { defaultExcelAdapter } from '../../services/integrations/excel/excelAdapter.ts';

export interface FormCompletedProps {
  form: FormDefinition;
  response: FormResponse;
  onRestart: () => void;
  onRetrySync: () => Promise<void>;
}

export const FormCompleted: React.FC<FormCompletedProps> = ({
  form,
  response,
  onRestart,
  onRetrySync,
}) => {
  const [retrying, setRetrying] = useState(false);
  const syncStatus = response.sync?.status || (response.status === 'SYNCED' ? 'SYNCED' : 'PENDING');

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetrySync();
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = defaultExcelAdapter.toCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.id}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rk-completed-card" role="region" aria-label="Form Submission Complete">
      <div className="rk-completed-icon-wrapper">
        <svg className="rk-completed-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="rk-completed-title">Submission Confirmed!</h2>
      <p className="rk-completed-subtitle">
        Your response has been securely recorded and processed by the form engine.
      </p>

      {/* Response Metadata Card */}
      <div className="rk-meta-card">
        <div className="rk-meta-row">
          <span className="rk-meta-label">Response ID:</span>
          <code className="rk-meta-code">{response.responseId}</code>
        </div>
        <div className="rk-meta-row">
          <span className="rk-meta-label">Form Definition:</span>
          <span className="rk-meta-value">{form.title} (v{form.version})</span>
        </div>
        <div className="rk-meta-row">
          <span className="rk-meta-label">Excel Sync Status:</span>
          <div className="rk-sync-status-container">
            {syncStatus === 'SYNCED' && (
              <span className="rk-badge rk-badge-success">
                <LuCheck className="rk-btn-icon-inline" />
                <span>Synced to Spreadsheet</span>
              </span>
            )}
            {syncStatus === 'FAILED' && (
              <div className="rk-sync-failed-group">
                <span className="rk-badge rk-badge-error">
                  <LuX className="rk-btn-icon-inline" />
                  <span>Sync Failed ({response.sync?.error || 'Network error'})</span>
                </span>
                <button
                  type="button"
                  className="rk-btn rk-btn-retry"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? 'Retrying...' : 'Retry Sync'}
                </button>
              </div>
            )}
            {syncStatus === 'PENDING' && (
              <span className="rk-badge rk-badge-warning">
                <LuClock className="rk-btn-icon-inline" />
                <span>Sync Pending</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Answer Summary Preview */}
      <div className="rk-answers-summary">
        <h3 className="rk-summary-title">Summary of Recorded Answers</h3>
        <div className="rk-summary-table">
          {form.questions.map((q) => {
            const answer = response.answers[q.id];
            if (answer === undefined || answer === null || answer === '') return null;

            let displayVal = String(answer);
            if (typeof answer === 'boolean') displayVal = answer ? 'Yes' : 'No';
            if (Array.isArray(answer)) displayVal = answer.join(', ');

            return (
              <div key={q.id} className="rk-summary-row">
                <span className="rk-summary-q-label">{q.label}</span>
                <span className="rk-summary-q-ans">{displayVal}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rk-completed-actions">
        <button
          type="button"
          className="rk-btn rk-btn-outline"
          onClick={handleDownloadCsv}
        >
          <svg className="rk-btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Export Spreadsheet (CSV)
        </button>

        <button
          type="button"
          className="rk-btn rk-btn-primary"
          onClick={onRestart}
        >
          Fill Out Another Response
        </button>
      </div>
    </div>
  );
};

