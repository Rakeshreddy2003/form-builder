import React, { useState, useMemo } from 'react';
import {
  LuArrowLeft,
  LuCircleDot,
  LuSave,
  LuSend,
  LuCircleCheck,
  LuListOrdered,
  LuGitFork,
  LuEye,
  LuFlaskConical,
  LuRotateCcw,
  LuFlag,
  LuTriangleAlert,
  LuX,
} from 'react-icons/lu';
import type { FormDefinition, QuestionDefinition, NavigationRule } from '../../types/form.types.ts';
import {
  validateFormDefinition,
  MAX_FORM_QUESTIONS,
  type ConfigValidationResult,
} from '../../forms/engine/configValidator.ts';
import { QuestionList } from './QuestionList.tsx';
import { QuestionEditorModal } from './QuestionEditorModal.tsx';
import { BranchingLogicModal } from './BranchingLogicModal.tsx';
import { FormRenderer } from '../form/FormRenderer.tsx';

export interface FormBuilderViewProps {
  initialForm: FormDefinition;
  onSave: (form: FormDefinition) => void;
  onBack: () => void;
}

type BuilderTab = 'questions' | 'logic' | 'preview';

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({
  initialForm,
  onSave,
  onBack,
}) => {
  const [form, setForm] = useState<FormDefinition>(() =>
    JSON.parse(JSON.stringify(initialForm))
  );
  const [activeTab, setActiveTab] = useState<BuilderTab>('questions');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<{
    question: QuestionDefinition | null; // null means adding a new question
  } | null>(null);

  const [logicQuestion, setLogicQuestion] = useState<QuestionDefinition | null>(null);

  // Validation errors modal / alert
  const [validationResult, setValidationResult] = useState<ConfigValidationResult | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Preview key to allow hard restart
  const [previewKey, setPreviewKey] = useState<number>(0);

  // Existing question IDs for duplicate check
  const existingQuestionIds = useMemo(
    () => form.questions.map((q) => q.id),
    [form.questions]
  );

  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => ({ ...prev, title: newTitle }));
    setIsDirty(true);
  };

  const handleDescriptionChange = (newDesc: string) => {
    setForm((prev) => ({ ...prev, description: newDesc }));
    setIsDirty(true);
  };

  // Add or update question
  const handleSaveQuestion = (updatedQ: QuestionDefinition) => {
    setForm((prev) => {
      const idx = prev.questions.findIndex((q) => q.id === updatedQ.id);
      let updatedQuestions: QuestionDefinition[];
      if (idx >= 0) {
        updatedQuestions = [...prev.questions];
        updatedQuestions[idx] = updatedQ;
      } else {
        // If updating an existing question whose ID was edited:
        const oldQ = editingQuestion?.question;
        const oldIdx = oldQ ? prev.questions.findIndex((q) => q.id === oldQ.id) : -1;
        if (oldIdx >= 0) {
          updatedQuestions = [...prev.questions];
          updatedQuestions[oldIdx] = updatedQ;
        } else {
          updatedQuestions = [...prev.questions, updatedQ];
        }
      }
      return { ...prev, questions: updatedQuestions };
    });
    setEditingQuestion(null);
    setIsDirty(true);
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
    setIsDirty(true);
  };

  // Move question
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= form.questions.length) return;

    setForm((prev) => {
      const questionsCopy = [...prev.questions];
      const temp = questionsCopy[index];
      questionsCopy[index] = questionsCopy[targetIdx];
      questionsCopy[targetIdx] = temp;
      return { ...prev, questions: questionsCopy };
    });
    setIsDirty(true);
  };

  // Save branching rules on a question
  const handleSaveLogic = (rules: NavigationRule[] | undefined) => {
    if (!logicQuestion) return;
    setForm((prev) => {
      const nextQuestions = prev.questions.map((q) => {
        if (q.id === logicQuestion.id) {
          return { ...q, next: rules };
        }
        return q;
      });
      return { ...prev, questions: nextQuestions };
    });
    setLogicQuestion(null);
    setIsDirty(true);
  };

  // Save draft
  const handleSaveDraft = () => {
    const toSave: FormDefinition = {
      ...form,
      status: form.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    };
    onSave(toSave);
    setIsDirty(false);
    setSaveSuccessMessage('Draft saved successfully.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Publish form
  const handlePublish = () => {
    const toPublish: FormDefinition = {
      ...form,
      status: 'PUBLISHED',
      version: form.status === 'PUBLISHED' ? form.version + 1 : form.version,
    };

    const result = validateFormDefinition(toPublish, { maxQuestions: MAX_FORM_QUESTIONS });
    if (!result.isValid) {
      setValidationResult(result);
      return;
    }

    onSave(toPublish);
    setForm(toPublish);
    setIsDirty(false);
    setSaveSuccessMessage(`Form published successfully as v${toPublish.version}!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleBack = () => {
    if (isDirty) {
      if (
        window.confirm(
          'You have unsaved changes in this form. Are you sure you want to exit without saving?'
        )
      ) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  // Single choice questions for logic tab
  const singleChoiceQuestions = useMemo(
    () => form.questions.filter((q) => q.type === 'singleSelect'),
    [form.questions]
  );

  return (
    <div className="rk-form-builder-container">
      {/* Top action and header toolbar */}
      <header className="rk-builder-header">
        <div className="rk-builder-nav-row">
          <button type="button" className="rk-btn-secondary rk-btn-sm" onClick={handleBack}>
            <LuArrowLeft className="rk-btn-icon-inline" />
            <span>Back to Survey List</span>
          </button>

          <div className="rk-builder-status-group">
            <span
              className={`rk-status-badge ${
                form.status === 'PUBLISHED' ? 'rk-status-published' : 'rk-status-draft'
              }`}
            >
              {form.status}
            </span>
            <span className="rk-version-badge">v{form.version}</span>
            {isDirty && (
              <span className="rk-unsaved-badge" title="Form has changes not yet saved">
                <LuCircleDot size={12} className="rk-btn-icon-inline" />
                <span>Unsaved changes</span>
              </span>
            )}
          </div>

          <div className="rk-builder-actions-group">
            <button
              type="button"
              className="rk-btn-secondary"
              onClick={handleSaveDraft}
              title="Save current progress as draft"
            >
              <LuSave className="rk-btn-icon-inline" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              className="rk-btn-primary"
              onClick={handlePublish}
              title="Validate and publish form for respondents"
            >
              <LuSend className="rk-btn-icon-inline" />
              <span>Publish Form</span>
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {saveSuccessMessage && (
          <div className="rk-toast-success" role="status">
            <LuCircleCheck size={18} className="rk-btn-icon-inline" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Survey Title & Description Card */}
        <div className="rk-builder-meta-card">
          <div className="rk-form-field-group">
            <label htmlFor="builder-title" className="rk-field-label">
              Survey Title <span className="rk-required-star">*</span>
            </label>
            <input
              id="builder-title"
              type="text"
              className="rk-text-input rk-title-input"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Toddy Palm Plantation Field Survey"
              required
            />
          </div>

          <div className="rk-form-field-group">
            <label htmlFor="builder-desc" className="rk-field-label">
              Description & Field Instructions
            </label>
            <textarea
              id="builder-desc"
              className="rk-textarea-input"
              rows={2}
              value={form.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe the survey purpose, audience, and instructions for respondents..."
            />
          </div>
        </div>

        {/* Builder View Tabs */}
        <nav className="rk-builder-tabs-nav" aria-label="Builder tabs">
          <button
            type="button"
            className={`rk-tab-btn ${activeTab === 'questions' ? 'rk-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <LuListOrdered className="rk-btn-icon-inline" />
            <span>Questions ({form.questions.length}/15)</span>
          </button>
          <button
            type="button"
            className={`rk-tab-btn ${activeTab === 'logic' ? 'rk-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('logic')}
          >
            <LuGitFork className="rk-btn-icon-inline" />
            <span>Branching Logic ({singleChoiceQuestions.length})</span>
          </button>
          <button
            type="button"
            className={`rk-tab-btn ${activeTab === 'preview' ? 'rk-tab-btn-active' : ''}`}
            onClick={() => {
              setActiveTab('preview');
              setPreviewKey((k) => k + 1);
            }}
          >
            <LuEye className="rk-btn-icon-inline" />
            <span>Preview Survey</span>
          </button>
        </nav>
      </header>

      {/* Main Tab Content */}
      <main className="rk-builder-main-content">
        {/* Tab 1: Questions List */}
        {activeTab === 'questions' && (
          <QuestionList
            questions={form.questions}
            onAddQuestion={() => setEditingQuestion({ question: null })}
            onEditQuestion={(q) => setEditingQuestion({ question: q })}
            onEditLogic={(q) => setLogicQuestion(q)}
            onDeleteQuestion={handleDeleteQuestion}
            onMoveQuestion={handleMoveQuestion}
          />
        )}

        {/* Tab 2: Branching Logic Overview */}
        {activeTab === 'logic' && (
          <div className="rk-logic-overview-pane">
            <div className="rk-pane-header">
              <div>
                <h3 className="rk-pane-title">Conditional Flow & Branching Rules</h3>
                <p className="rk-pane-desc">
                  Route respondents down custom question paths or directly to End Survey based on single choice answers.
                </p>
              </div>
            </div>

            {singleChoiceQuestions.length === 0 ? (
              <div className="rk-builder-empty-state">
                <div className="rk-empty-icon" aria-hidden="true">
                  <LuGitFork size={40} />
                </div>
                <h4 className="rk-empty-title">No single choice questions found</h4>
                <p className="rk-empty-desc">
                  Branching rules are configured on single choice questions. Add a single choice question to configure custom question routes.
                </p>
                <button
                  type="button"
                  className="rk-btn-secondary"
                  onClick={() => setActiveTab('questions')}
                >
                  Go to Questions
                </button>
              </div>
            ) : (
              <div className="rk-logic-cards-list">
                {singleChoiceQuestions.map((q) => {
                  const options = q.options || [];
                  const rules = q.next || [];
                  const configuredCount = rules.length;

                  return (
                    <div key={q.id} className="rk-logic-summary-card">
                      <div className="rk-logic-card-top">
                        <div>
                          <span className="rk-card-number">
                            Q{form.questions.findIndex((x) => x.id === q.id) + 1}
                          </span>
                          <strong className="rk-logic-card-title">{q.label}</strong>
                          <span className="rk-chip-id">({q.id})</span>
                        </div>
                        <button
                          type="button"
                          className="rk-btn-primary rk-btn-sm"
                          onClick={() => setLogicQuestion(q)}
                        >
                          <LuGitFork className="rk-btn-icon-inline" />
                          <span>Configure Branching</span>
                        </button>
                      </div>

                      <div className="rk-logic-rules-preview">
                        <span className="rk-preview-label">
                          Configured Routes ({configuredCount} of {options.length} options):
                        </span>
                        <ul className="rk-preview-routes-list">
                          {options.map((opt) => {
                            const matchedRule = rules.find((r) => {
                              const when = r.when as { value?: unknown };
                              return when?.value === opt.value;
                            });

                            let destLabel: React.ReactNode = '↓ Next question in sequence';
                            let isTerminal = false;
                            let isMissing = false;

                            if (matchedRule) {
                              if (matchedRule.targetQuestionId === null) {
                                destLabel = (
                                  <>
                                    <LuFlag className="rk-btn-icon-inline" />
                                    <span>End Survey (Submit Form)</span>
                                  </>
                                );
                                isTerminal = true;
                              } else {
                                const targetQ = form.questions.find(
                                  (x) => x.id === matchedRule.targetQuestionId
                                );
                                if (targetQ) {
                                  const tIdx = form.questions.findIndex((x) => x.id === targetQ.id) + 1;
                                  destLabel = `→ Q${tIdx}: ${targetQ.label.slice(0, 45)}...`;
                                } else {
                                  destLabel = (
                                    <>
                                      <LuTriangleAlert className="rk-btn-icon-inline" />
                                      <span>Broken reference ({matchedRule.targetQuestionId})</span>
                                    </>
                                  );
                                  isMissing = true;
                                }
                              }
                            }

                            return (
                              <li key={opt.value} className="rk-route-item">
                                <span className="rk-route-option-name">{opt.label}:</span>
                                <span
                                  className={`rk-route-dest ${
                                    isTerminal
                                      ? 'rk-dest-terminal'
                                      : isMissing
                                      ? 'rk-dest-missing'
                                      : matchedRule
                                      ? 'rk-dest-active'
                                      : 'rk-dest-default'
                                  }`}
                                >
                                  {destLabel}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Live Interactive Preview */}
        {activeTab === 'preview' && (
          <div className="rk-preview-pane">
            <div className="rk-preview-banner">
              <div className="rk-preview-banner-text">
                <span className="rk-preview-badge">
                  <LuFlaskConical className="rk-btn-icon-inline" />
                  <span>Live Form Engine Preview</span>
                </span>
                <p>
                  Testing the exact respondent experience using the dynamic runtime engine. Test answer inputs, validations, branching routes, and end survey paths.
                </p>
              </div>
              <button
                type="button"
                className="rk-btn-secondary rk-btn-sm"
                onClick={() => setPreviewKey((k) => k + 1)}
                title="Reset answers and restart from Question 1"
              >
                <LuRotateCcw className="rk-btn-icon-inline" />
                <span>Restart Preview</span>
              </button>
            </div>

            {/* Zero Engine Duplication: Direct usage of FormRenderer */}
            <div className="rk-preview-renderer-container">
              <FormRenderer
                key={previewKey}
                form={form}
                onCompleted={() => {
                  window.alert('Preview survey completed successfully!');
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion.question}
          existingQuestionIds={existingQuestionIds}
          onSave={handleSaveQuestion}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* Branching Logic Modal */}
      {logicQuestion && (
        <BranchingLogicModal
          question={logicQuestion}
          allQuestions={form.questions}
          onSave={handleSaveLogic}
          onCancel={() => setLogicQuestion(null)}
        />
      )}

      {/* Validation Errors Dialog */}
      {validationResult && !validationResult.isValid && (
        <div className="rk-modal-backdrop" role="alertdialog">
          <div className="rk-modal-card rk-modal-card-warning">
            <div className="rk-modal-header">
              <h3 className="rk-modal-title rk-text-danger">
                <LuTriangleAlert className="rk-btn-icon-inline" />
                <span>Form Cannot Be Published</span>
              </h3>
              <button
                type="button"
                className="rk-modal-close-btn"
                onClick={() => setValidationResult(null)}
                aria-label="Close dialog"
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="rk-modal-body">
              <p>Please fix the following validation errors before publishing this survey:</p>
              <ul className="rk-referencing-list">
                {validationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <div className="rk-modal-footer">
              <button
                type="button"
                className="rk-btn-primary"
                onClick={() => setValidationResult(null)}
              >
                Fix Errors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
