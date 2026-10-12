import React, { useState } from 'react';
import {
  LuPlus,
  LuCircleAlert,
  LuTriangleAlert,
  LuX,
  LuFileText,
  LuGitFork,
  LuSquarePen,
  LuArrowUp,
  LuArrowDown,
  LuTrash2,
} from 'react-icons/lu';
import type { QuestionDefinition } from '../../types/form.types.ts';
import { MAX_FORM_QUESTIONS } from '../../forms/engine/configValidator.ts';

export interface QuestionListProps {
  questions: QuestionDefinition[];
  onAddQuestion: () => void;
  onEditQuestion: (question: QuestionDefinition) => void;
  onEditLogic: (question: QuestionDefinition) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onAddQuestion,
  onEditQuestion,
  onEditLogic,
  onDeleteQuestion,
  onMoveQuestion,
}) => {
  const [deleteWarning, setDeleteWarning] = useState<{
    question: QuestionDefinition;
    referencingQuestions: string[];
  } | null>(null);

  const isAtLimit = questions.length >= MAX_FORM_QUESTIONS;

  const handleDeleteClick = (question: QuestionDefinition) => {
    // Check if any other question in the form has a navigation rule pointing to this question
    const referencing: string[] = [];
    for (const q of questions) {
      if (q.id === question.id) continue;
      if (q.next) {
        for (const rule of q.next) {
          if (rule.targetQuestionId === question.id) {
            referencing.push(`"${q.label}" (${q.id})`);
            break;
          }
        }
      }
    }

    if (referencing.length > 0) {
      setDeleteWarning({
        question,
        referencingQuestions: referencing,
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete question "${question.label}"?`)) {
      onDeleteQuestion(question.id);
    }
  };

  return (
    <div className="rk-builder-questions-section">
      {/* Question Counter Bar */}
      <div className="rk-questions-count-bar">
        <div className="rk-count-info">
          <span className="rk-count-label">Questions</span>
          <span className={`rk-count-badge ${isAtLimit ? 'rk-badge-limit' : ''}`}>
            {questions.length} / {MAX_FORM_QUESTIONS}
          </span>
        </div>

        <button
          type="button"
          className="rk-btn-primary"
          onClick={onAddQuestion}
          disabled={isAtLimit}
          title={isAtLimit ? 'Maximum limit of 15 questions reached' : 'Add a new question'}
        >
          <LuPlus className="rk-btn-icon-inline" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Limit Alert Message */}
      {isAtLimit && (
        <div className="rk-limit-banner" role="status">
          <span className="rk-limit-icon" aria-hidden="true">
            <LuCircleAlert size={20} />
          </span>
          <div>
            <strong>Maximum Question Limit Reached:</strong> This survey contains {MAX_FORM_QUESTIONS} of {MAX_FORM_QUESTIONS} maximum questions.
            To add another question, please remove an existing one first.
          </div>
        </div>
      )}

      {/* Referenced Deletion Warning Modal */}
      {deleteWarning && (
        <div className="rk-modal-backdrop" role="alertdialog">
          <div className="rk-modal-card rk-modal-card-warning">
            <div className="rk-modal-header">
              <h3 className="rk-modal-title rk-text-danger">
                <LuTriangleAlert className="rk-btn-icon-inline" />
                <span>Cannot Delete Question</span>
              </h3>
              <button
                type="button"
                className="rk-modal-close-btn"
                onClick={() => setDeleteWarning(null)}
                aria-label="Close dialog"
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="rk-modal-body">
              <p>
                Question <strong>&quot;{deleteWarning.question.label}&quot;</strong> is targeted as a branch destination by:
              </p>
              <ul className="rk-referencing-list">
                {deleteWarning.referencingQuestions.map((title, i) => (
                  <li key={i}>{title}</li>
                ))}
              </ul>
              <p className="rk-modal-desc">
                Please reassign or delete the branching rules in those questions first to prevent broken links.
              </p>
            </div>
            <div className="rk-modal-footer">
              <button
                type="button"
                className="rk-btn-secondary"
                onClick={() => setDeleteWarning(null)}
              >
                Understood, Keep Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="rk-builder-empty-state">
          <div className="rk-empty-icon" aria-hidden="true">
            <LuFileText size={42} />
          </div>
          <h3 className="rk-empty-title">No questions yet</h3>
          <p className="rk-empty-desc">
            Add your first question to start building the field survey questionnaire.
          </p>
          <button
            type="button"
            className="rk-btn-primary"
            onClick={onAddQuestion}
          >
            <LuPlus className="rk-btn-icon-inline" />
            <span>Add First Question</span>
          </button>
        </div>
      ) : (
        <div className="rk-question-cards-stack">
          {questions.map((q, idx) => {
            const hasBranching = Boolean(q.next && q.next.length > 0);
            const isSingleChoice = q.type === 'singleSelect';

            return (
              <div key={q.id} className="rk-question-card">
                <div className="rk-card-main">
                  {/* Top metadata badges */}
                  <div className="rk-card-meta-row">
                    <span className="rk-card-number">Q{idx + 1}</span>
                    {q.section && <span className="rk-badge-section">{q.section}</span>}
                    <span className="rk-badge-type">{formatQuestionType(q.type)}</span>
                    <span className={`rk-badge-req ${q.required ? 'rk-badge-required' : 'rk-badge-optional'}`}>
                      {q.required ? 'Required' : 'Optional'}
                    </span>
                    {hasBranching && (
                      <span className="rk-badge-branching">
                        <LuGitFork className="rk-btn-icon-inline" />
                        <span>Branching ({q.next!.length} rule{q.next!.length > 1 ? 's' : ''})</span>
                      </span>
                    )}
                  </div>

                  {/* Question Label */}
                  <h4 className="rk-card-label">{q.label}</h4>
                  {q.description && (
                    <p className="rk-card-description">{q.description}</p>
                  )}

                  {/* Options Preview for Choice Types */}
                  {q.options && q.options.length > 0 && (
                    <div className="rk-card-options-preview">
                      <span className="rk-options-header-text">Options:</span>
                      <ul className="rk-card-options-list">
                        {q.options.slice(0, 4).map((opt) => (
                          <li key={opt.value} className="rk-card-option-item">
                            <span className="rk-bullet-dot">•</span>
                            <span>{opt.label}</span>
                            {opt.exclusive && <span className="rk-exclusive-tag">(exclusive)</span>}
                          </li>
                        ))}
                        {q.options.length > 4 && (
                          <li className="rk-more-options-item">
                            + {q.options.length - 4} more option{q.options.length - 4 > 1 ? 's' : ''}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Actions Toolbar */}
                <div className="rk-card-actions-bar">
                  <button
                    type="button"
                    className="rk-btn-secondary rk-btn-sm"
                    onClick={() => onEditQuestion(q)}
                    title="Edit question text, type, and options"
                  >
                    <LuSquarePen className="rk-btn-icon-inline" />
                    <span>Edit</span>
                  </button>

                  {isSingleChoice && (
                    <button
                      type="button"
                      className="rk-btn-secondary rk-btn-sm rk-btn-logic"
                      onClick={() => onEditLogic(q)}
                      title="Configure conditional branching routing"
                    >
                      <LuGitFork className="rk-btn-icon-inline" />
                      <span>Logic</span>
                    </button>
                  )}

                  <div className="rk-card-move-buttons">
                    <button
                      type="button"
                      className="rk-icon-btn"
                      onClick={() => onMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      title="Move up"
                      aria-label="Move question up"
                    >
                      <LuArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="rk-icon-btn"
                      onClick={() => onMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      title="Move down"
                      aria-label="Move question down"
                    >
                      <LuArrowDown size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="rk-icon-btn rk-btn-danger-icon"
                    onClick={() => handleDeleteClick(q)}
                    title="Delete question"
                    aria-label="Delete question"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function formatQuestionType(type: string): string {
  switch (type) {
    case 'text':
      return 'Short Answer';
    case 'textarea':
      return 'Long Answer';
    case 'number':
      return 'Numeric';
    case 'singleSelect':
      return 'Single Choice';
    case 'multiSelect':
      return 'Multiple Choice';
    case 'email':
      return 'Email';
    case 'dropdown':
      return 'Dropdown';
    case 'date':
      return 'Date';
    default:
      return type;
  }
}
