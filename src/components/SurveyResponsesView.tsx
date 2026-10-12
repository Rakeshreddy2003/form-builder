import React from 'react';
import type { Survey, SurveyResponse } from '../types/survey.ts';
import { exportResponsesToExcel } from '../utils/excelExporter.ts';
import { sampleProfessionResponses } from '../data/defaultSurveys.ts';

interface SurveyResponsesViewProps {
  survey: Survey;
  responses: SurveyResponse[];
  onTakeSurvey: () => void;
  onClearResponses: () => void;
  onAddSampleResponses: (samples: SurveyResponse[]) => void;
}

export const SurveyResponsesView: React.FC<SurveyResponsesViewProps> = ({
  survey,
  responses,
  onTakeSurvey,
  onClearResponses,
  onAddSampleResponses,
}) => {
  const handleExport = () => {
    exportResponsesToExcel(survey, responses);
  };

  const handleLoadSamples = () => {
    onAddSampleResponses(sampleProfessionResponses);
  };

  return (
    <div className="responses-container">
      {/* Header and Controls */}
      <div className="responses-header-card">
        <div className="responses-header-row">
          <div>
            <h2 className="responses-title">Survey Responses & Excel Export</h2>
            <p className="responses-subtitle">
              Survey: <strong>{survey.title}</strong> — {responses.length} respondent{responses.length === 1 ? '' : 's'} recorded.
            </p>
          </div>

          <div className="responses-action-buttons">
            <button
              type="button"
              className="btn btn-primary btn-excel"
              onClick={handleExport}
              disabled={responses.length === 0}
              title="Download structured spreadsheet as .xlsx"
            >
              Export to Excel (.xlsx)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onTakeSurvey}
            >
              + Fill Survey
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLoadSamples}
              title="Loads sample Doctor / Engineer / Lawyer responses"
            >
              Load Sample Data
            </button>
            {responses.length > 0 && (
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => {
                  if (confirm('Clear all recorded responses for this survey?')) {
                    onClearResponses();
                  }
                }}
              >
                Clear Responses
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="responses-stats-strip">
          <div className="stat-pill">
            <span className="stat-label">Total Respondents:</span>
            <span className="stat-val">{responses.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Total Survey Questions:</span>
            <span className="stat-val">{survey.questions.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Export Format:</span>
            <span className="stat-val">Microsoft Excel (.xlsx)</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Skipped Logic Behavior:</span>
            <span className="stat-val">Clean Blank Cells (No fabricated data)</span>
          </div>
        </div>
      </div>

      {/* Responses Table */}
      {responses.length === 0 ? (
        <div className="empty-responses-card">
          <h3>No responses recorded yet</h3>
          <p>
            Respondents who complete the survey will appear here. Questions skipped
            by conditional logic are automatically recorded as blank cells.
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onTakeSurvey}
            >
              Take Survey as Respondent
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLoadSamples}
            >
              Load Demo Responses (001, 002, 003)
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper-card">
          <div className="table-scroll-container">
            <table className="responses-data-table">
              <thead>
                <tr>
                  <th className="sticky-col-1">Respondent</th>
                  <th className="sticky-col-2">Submitted At</th>
                  {survey.questions.map((q, idx) => (
                    <th key={q.id} title={q.label}>
                      <span className="th-q-num">Q{idx + 1}:</span> {q.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((resp) => (
                  <tr key={resp.id}>
                    <td className="sticky-col-1 font-mono-id">
                      {resp.id}
                    </td>
                    <td className="sticky-col-2 text-muted">
                      {new Date(resp.submittedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    {survey.questions.map((q) => {
                      const val = resp.answers[q.id];
                      const isSkipped =
                        val === undefined ||
                        val === null ||
                        val === '' ||
                        (Array.isArray(val) && val.length === 0);

                      if (isSkipped) {
                        return (
                          <td key={q.id} className="td-skipped-blank">
                            <span className="blank-tag" title="Question skipped via logic">
                              (blank)
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={q.id} className="td-answer-cell">
                          {Array.isArray(val) ? (
                            <span className="tag-group">
                              {val.map((item) => (
                                <span key={item} className="answer-tag">
                                  {item}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="answer-text">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-note">
            * In the exported .xlsx spreadsheet, cells marked as (blank) are completely empty.
          </div>
        </div>
      )}
    </div>
  );
};
