import React, { useState } from 'react';
import { LuX, LuTriangleAlert, LuGitFork } from 'react-icons/lu';
import type { QuestionDefinition, NavigationRule } from '../../types/form.types.ts';
import type { SimpleCondition } from '../../types/condition.types.ts';

export interface BranchingLogicModalProps {
  question: QuestionDefinition;
  allQuestions: QuestionDefinition[];
  onSave: (updatedNextRules: NavigationRule[] | undefined) => void;
  onCancel: () => void;
}

export const BranchingLogicModal: React.FC<BranchingLogicModalProps> = ({
  question,
  allQuestions,
  onSave,
  onCancel,
}) => {
  const options = question.options || [];

  // Parse existing question.next rules into an option -> destination map
  const initialMap: Record<string, string> = {};
  for (const opt of options) {
    initialMap[opt.value] = 'default';
  }

  if (question.next) {
    for (const rule of question.next) {
      if (rule.when) {
        const sc = rule.when as SimpleCondition;
        const targetQId = sc.questionId ?? sc.question;
        if (targetQId === question.id && sc.operator === 'equals' && typeof sc.value === 'string') {
          initialMap[sc.value] = rule.targetQuestionId === null ? 'END_SURVEY' : rule.targetQuestionId;
        }
      }
    }
  }

  const [branchMap, setBranchMap] = useState<Record<string, string>>(initialMap);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available candidate target questions (all questions except current question)
  const candidateQuestions = allQuestions.filter((q) => q.id !== question.id);

  const handleDestinationChange = (optionValue: string, destination: string) => {
    setBranchMap((prev) => ({
      ...prev,
      [optionValue]: destination,
    }));
  };

  const handleSave = () => {
    setErrorMessage(null);

    // Validate that no destination references a deleted question
    const allIds = new Set(allQuestions.map((q) => q.id));
    for (const dest of Object.values(branchMap)) {
      if (dest !== 'default' && dest !== 'END_SURVEY') {
        if (!allIds.has(dest)) {
          setErrorMessage(`Option destination points to an unknown or deleted question (${dest}). Please choose a valid target.`);
          return;
        }
        if (dest === question.id) {
          setErrorMessage(`Question cannot route to itself. Please choose a different target.`);
          return;
        }
      }
    }

    // Build the NavigationRule[] array
    const rules: NavigationRule[] = [];
    for (const opt of options) {
      const dest = branchMap[opt.value];
      if (dest && dest !== 'default') {
        rules.push({
          when: {
            questionId: question.id,
            operator: 'equals',
            value: opt.value,
          },
          targetQuestionId: dest === 'END_SURVEY' ? null : dest,
        });
      }
    }

    onSave(rules.length > 0 ? rules : undefined);
  };

  const handleClearAll = () => {
    const cleared: Record<string, string> = {};
    for (const opt of options) {
      cleared[opt.value] = 'default';
    }
    setBranchMap(cleared);
  };

  return (
    <div className="rk-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logic-modal-title">
      <div className="rk-modal-card rk-modal-card-wide">
        <div className="rk-modal-header">
          <div>
            <h2 id="logic-modal-title" className="rk-modal-title">
              <LuGitFork className="rk-btn-icon-inline" />
              <span>Branching Logic: {question.label}</span>
            </h2>
            <p className="rk-modal-subtitle">
              Configure question flow based on respondent choice. Options set to Default continue sequentially.
            </p>
          </div>
          <button
            type="button"
            className="rk-modal-close-btn"
            onClick={onCancel}
            aria-label="Close modal"
          >
            <LuX size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="rk-modal-error-alert" role="alert">
            <LuTriangleAlert className="rk-btn-icon-inline" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="rk-logic-modal-body">
          <div className="rk-logic-question-summary">
            <span className="rk-chip-badge">Single Choice</span>
            <span className="rk-chip-id">ID: {question.id}</span>
          </div>

          <table className="rk-logic-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>When Respondent Selects</th>
                <th style={{ width: '60%' }}>Go To Destination Question</th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt) => {
                const currentDest = branchMap[opt.value] || 'default';
                const isBroken =
                  currentDest !== 'default' &&
                  currentDest !== 'END_SURVEY' &&
                  !allQuestions.some((q) => q.id === currentDest);

                return (
                  <tr key={opt.value} className={isBroken ? 'rk-row-error' : undefined}>
                    <td className="rk-logic-opt-cell">
                      <div className="rk-logic-opt-display">
                        <span className="rk-logic-radio-dot" />
                        <div>
                          <strong className="rk-logic-opt-label">{opt.label}</strong>
                          <span className="rk-logic-opt-val">({opt.value})</span>
                        </div>
                      </div>
                    </td>
                    <td className="rk-logic-dest-cell">
                      <select
                        className={`rk-select-input ${isBroken ? 'rk-input-error' : ''}`}
                        value={currentDest}
                        onChange={(e) => handleDestinationChange(opt.value, e.target.value)}
                        aria-label={`Destination for ${opt.label}`}
                      >
                        <option value="default">
                          ↓ (Default — Next question in sequence)
                        </option>
                        <option value="END_SURVEY">
                          End Survey (Complete & Submit)
                        </option>
                        <optgroup label="Jump to specific question">
                          {candidateQuestions.map((q) => {
                            const qIdx = allQuestions.findIndex((x) => x.id === q.id) + 1;
                            const preview = q.label.length > 55 ? `${q.label.slice(0, 55)}...` : q.label;
                            return (
                              <option key={q.id} value={q.id}>
                                Q{qIdx}: {preview}
                              </option>
                            );
                          })}
                        </optgroup>
                      </select>
                      {isBroken && (
                        <span className="rk-dest-error-msg">
                          <LuTriangleAlert className="rk-btn-icon-inline" />
                          <span>Destination points to a deleted question!</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {options.length === 0 && (
            <p className="rk-empty-note">This question has no options configured.</p>
          )}
        </div>

        <div className="rk-modal-footer">
          <button type="button" className="rk-btn-secondary" onClick={handleClearAll}>
            Reset to Sequential
          </button>
          <div className="rk-footer-right-buttons">
            <button type="button" className="rk-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="rk-btn-primary" onClick={handleSave}>
              Save Branching Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
