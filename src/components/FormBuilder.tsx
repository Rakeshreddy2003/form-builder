import React, { useState } from 'react';
import type { Survey, Question, QuestionType } from '../types/survey.ts';

interface FormBuilderProps {
  survey: Survey;
  onSaveSurvey: (updatedSurvey: Survey, navigateToRespondent?: boolean) => void;
  onPreviewSurvey: () => void;
  onLoadDemo: (demoType: 'profession' | 'general') => void;
}

const QUESTION_TYPE_INFO: Record<QuestionType, { label: string; desc: string }> = {
  short_answer: {
    label: 'Short answer',
    desc: 'Respondents will type a name or short response.',
  },
  long_answer: {
    label: 'Long answer',
    desc: 'Respondents will type a description or longer text.',
  },
  single_choice: {
    label: 'Single choice',
    desc: 'Respondents will select one option from the list.',
  },
  multiple_choice: {
    label: 'Multiple choice',
    desc: 'Respondents will select several options from the list.',
  },
  numeric: {
    label: 'Numeric',
    desc: 'Respondents will enter a number.',
  },
};

export const FormBuilder: React.FC<FormBuilderProps> = ({
  survey,
  onSaveSurvey,
  onPreviewSurvey,
  onLoadDemo,
}) => {
  const [currentSurvey, setCurrentSurvey] = useState<Survey>(survey);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Sync if survey prop changes from parent
  React.useEffect(() => {
    setCurrentSurvey(survey);
  }, [survey]);

  // Map of targetQuestionId -> { parentQuestionId, optionKey }
  // Tracks every question that is already linked to ANY option in the entire survey
  const allLinkedQuestionsMap = React.useMemo(() => {
    const map = new Map<string, { parentQuestionId: string; optionKey: string }>();
    for (const question of currentSurvey.questions) {
      if (question.flow === 'link' && question.optionLinks) {
        for (const [optionKey, targetId] of Object.entries(question.optionLinks)) {
          if (
            targetId &&
            targetId !== 'NEXT' &&
            targetId !== 'END' &&
            targetId !== '__CREATE_NEW__'
          ) {
            map.set(targetId, { parentQuestionId: question.id, optionKey });
          }
        }
      }
    }
    return map;
  }, [currentSurvey.questions]);

  const updateSurveyField = (field: keyof Survey, val: any) => {
    setCurrentSurvey((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleAddQuestion = () => {
    if (currentSurvey.questions.length >= 15) {
      alert('You have reached the limit of 15 questions per survey.');
      return;
    }

    // Do NOT prefill label or options with dummy text!
    // Creator should see placeholders and type directly without needing to backspace/delete.
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: '', // Empty, no prefilled text
      type: 'short_answer',
      options: [],
      flow: 'general',
      optionLinks: {},
      required: false,
    };

    setCurrentSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  const handleUpdateQuestion = (qIndex: number, updates: Partial<Question>) => {
    setCurrentSurvey((prev) => {
      const copy = [...prev.questions];
      copy[qIndex] = { ...copy[qIndex], ...updates };
      return { ...prev, questions: copy };
    });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    const qToDelete = currentSurvey.questions[qIndex];
    const qName = qToDelete.label.trim() || `Question ${qIndex + 1}`;
    if (!confirm(`Are you sure you want to delete ${qName}?`)) {
      return;
    }

    setCurrentSurvey((prev) => {
      const filtered = prev.questions.filter((_, idx) => idx !== qIndex);
      // Also clean up any optionLinks pointing to the deleted question
      const cleaned = filtered.map((q) => {
        const links = { ...q.optionLinks };
        let modified = false;
        Object.keys(links).forEach((key) => {
          if (links[key] === qToDelete.id) {
            delete links[key];
            modified = true;
          }
        });
        const defaultNext = q.defaultNextId === qToDelete.id ? undefined : q.defaultNextId;
        return modified || defaultNext !== q.defaultNextId
          ? { ...q, optionLinks: links, defaultNextId: defaultNext }
          : q;
      });
      return { ...prev, questions: cleaned };
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentSurvey.questions.length) return;

    setCurrentSurvey((prev) => {
      const copy = [...prev.questions];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, questions: copy };
    });
  };

  const handleAddOption = (qIndex: number) => {
    const q = currentSurvey.questions[qIndex];
    // Add empty option string so placeholder displays without requiring backspacing
    handleUpdateQuestion(qIndex, {
      options: [...q.options, ''],
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, newVal: string) => {
    const q = currentSurvey.questions[qIndex];
    const oldVal = q.options[optIndex];
    const updatedOptions = [...q.options];
    updatedOptions[optIndex] = newVal;

    // Preserve link mapping if option name changed
    const updatedLinks = { ...q.optionLinks };
    if (oldVal in updatedLinks) {
      const target = updatedLinks[oldVal];
      delete updatedLinks[oldVal];
      updatedLinks[newVal] = target;
    }

    handleUpdateQuestion(qIndex, {
      options: updatedOptions,
      optionLinks: updatedLinks,
    });
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    const q = currentSurvey.questions[qIndex];
    if (q.options.length <= 1) {
      alert('A choice question must have at least one option.');
      return;
    }
    const valToRemove = q.options[optIndex];
    const updatedOptions = q.options.filter((_, idx) => idx !== optIndex);
    const updatedLinks = { ...q.optionLinks };
    delete updatedLinks[valToRemove];

    handleUpdateQuestion(qIndex, {
      options: updatedOptions,
      optionLinks: updatedLinks,
    });
  };

  const handleSetOptionLink = (
    qIndex: number,
    optionVal: string,
    targetQuestionId: string
  ) => {
    const q = currentSurvey.questions[qIndex];

    // If creator clicked "+ Create destination question directly"
    if (targetQuestionId === '__CREATE_NEW__') {
      if (currentSurvey.questions.length >= 15) {
        alert('Cannot create question: 15 questions limit reached.');
        return;
      }
      const newId = `q_followup_${Date.now()}`;
      const newFollowUp: Question = {
        id: newId,
        label: '', // Empty label with placeholder
        type: 'short_answer',
        options: [],
        flow: 'general',
        optionLinks: {},
        description: `Follow-up question for option "${optionVal || 'selected option'}"`,
        required: false,
      };

      const updatedQuestions = [...currentSurvey.questions, newFollowUp];
      const updatedLinks = {
        ...q.optionLinks,
        [optionVal]: newId,
      };

      setCurrentSurvey((prev) => ({
        ...prev,
        questions: updatedQuestions.map((item, idx) =>
          idx === qIndex ? { ...item, optionLinks: updatedLinks } : item
        ),
      }));
      return;
    }

    const updatedLinks = {
      ...q.optionLinks,
      [optionVal]: targetQuestionId,
    };
    handleUpdateQuestion(qIndex, { optionLinks: updatedLinks });
  };

  /**
   * Finalize and create/save form, then automatically navigate to respondent view.
   */
  const handleCreateForm = () => {
    if (currentSurvey.questions.length === 0) {
      alert('Please add at least one question to create the form.');
      return;
    }

    // Clean up empty question labels and options with clean defaults if creator left them blank
    const finalizedQuestions = currentSurvey.questions.map((q, idx) => {
      const cleanLabel = q.label.trim() || `Question ${idx + 1}`;
      let cleanOptions = q.options;

      if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        cleanOptions = q.options.map((opt, oIdx) => opt.trim() || `Option ${oIdx + 1}`);
      }

      // Re-map option links if option names were assigned default names
      const cleanLinks: Record<string, string> = {};
      if (q.optionLinks) {
        Object.entries(q.optionLinks).forEach(([key, targetId]) => {
          if (cleanOptions.includes(key)) {
            cleanLinks[key] = targetId;
          }
        });
      }

      return {
        ...q,
        label: cleanLabel,
        options: cleanOptions,
        optionLinks: cleanLinks,
      };
    });

    const finalizedSurvey: Survey = {
      ...currentSurvey,
      title: currentSurvey.title.trim() || 'Custom Survey',
      questions: finalizedQuestions,
      updatedAt: new Date().toISOString(),
    };

    // Save and immediately navigate to Respondent View so the creator sees their created form in action!
    setSaveMessage('Form created successfully!');
    onSaveSurvey(finalizedSurvey, true);
  };

  return (
    <div className="builder-container">
      {/* Top Banner / Actions */}
      <div className="builder-header-card">
        <div className="builder-header-top">
          <div>
            <h2 className="builder-title">Create Survey</h2>
            <p className="builder-subtitle">
              Add up to 15 questions to your survey. Questions and options start blank so you can type immediately.
            </p>
          </div>
          <div className="builder-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onLoadDemo('profession')}
              title="Loads the Profession survey with Doctor / Engineer / Lawyer branching logic"
            >
              Demo: Skip Logic
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onLoadDemo('general')}
              title="Loads standard sequential survey with gender & appliances"
            >
              Demo: General Form
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateForm}
              title="Create form and test in respondent view"
            >
              Create Form
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onPreviewSurvey}
            >
              Test Survey →
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="alert-success-banner">{saveMessage}</div>
        )}

        {/* Form Title & Description Config */}
        <div className="builder-meta-grid">
          <div className="form-group">
            <label className="field-label" htmlFor="survey-title-input">
              Survey Title
            </label>
            <input
              id="survey-title-input"
              type="text"
              className="form-input"
              value={currentSurvey.title}
              onChange={(e) => updateSurveyField('title', e.target.value)}
              placeholder="e.g. Profession survey"
            />
          </div>
          <div className="form-group">
            <label className="field-label" htmlFor="survey-desc-input">
              Description (Optional)
            </label>
            <input
              id="survey-desc-input"
              type="text"
              className="form-input"
              value={currentSurvey.description || ''}
              onChange={(e) => updateSurveyField('description', e.target.value)}
              placeholder="Brief description for respondents"
            />
          </div>
        </div>

        {/* Question Counter Pill */}
        <div className="counter-strip">
          <span className="counter-badge">
            {currentSurvey.questions.length} of 15 questions used
          </span>
          {currentSurvey.questions.length >= 15 && (
            <span className="limit-warning">
              Maximum question limit reached (15).
            </span>
          )}
        </div>
      </div>

      {/* List of Questions */}
      <div className="questions-list">
        {currentSurvey.questions.map((q, qIndex) => {
          const isChoiceType =
            q.type === 'single_choice' || q.type === 'multiple_choice';

          return (
            <div key={q.id} className="question-card" id={`q-card-${q.id}`}>
              {/* Question Card Header */}
              <div className="question-card-header">
                <div className="q-number-title">
                  <span className="q-badge">Question {qIndex + 1}</span>
                  <span className="q-preview-title">
                    {q.label.trim() ? q.label : `(Untitled Question)`}
                  </span>
                  {q.flow === 'link' && (
                    <span className="logic-badge">Skip Logic Active</span>
                  )}
                </div>

                <div className="q-reorder-group">
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={qIndex === 0}
                    onClick={() => handleMoveQuestion(qIndex, 'up')}
                    title="Move up"
                    aria-label={`Move question ${qIndex + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={qIndex === currentSurvey.questions.length - 1}
                    onClick={() => handleMoveQuestion(qIndex, 'down')}
                    title="Move down"
                    aria-label={`Move question ${qIndex + 1} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn delete-btn"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    title="Delete question"
                    aria-label={`Delete question ${qIndex + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Question Text Input — NO PREFILLED TEXT, ONLY PLACEHOLDER! */}
              <div className="form-group">
                <label className="field-label">Enter your question</label>
                <input
                  type="text"
                  className="form-input q-label-input"
                  value={q.label}
                  onChange={(e) =>
                    handleUpdateQuestion(qIndex, { label: e.target.value })
                  }
                  placeholder={`e.g. What is your question?`}
                />
              </div>

              {/* Question Type & Helper Text */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label">Answer type</label>
                  <select
                    className="form-select"
                    value={q.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      handleUpdateQuestion(qIndex, {
                        type: newType,
                        // If switching to choice, start with 2 empty options (no prefilled values)
                        options:
                          newType === 'single_choice' ||
                          newType === 'multiple_choice'
                            ? q.options.length > 0
                              ? q.options
                              : ['', '']
                            : q.options,
                      });
                    }}
                  >
                    <option value="short_answer">Short answer</option>
                    <option value="long_answer">Long answer</option>
                    <option value="single_choice">Single choice</option>
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Respondent experience</label>
                  <div className="type-explanation">
                    {QUESTION_TYPE_INFO[q.type]?.desc}
                  </div>
                </div>
              </div>

              {/* For Single Choice and Multiple Choice: Options Editor with NO PREFILLED VALUES */}
              {isChoiceType && (
                <div className="options-manager-card">
                  <label className="field-label">Answer Options</label>
                  <div className="options-list">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="option-row">
                        <span className="option-bullet">
                          {q.type === 'single_choice' ? '○' : '□'}
                        </span>
                        <input
                          type="text"
                          className="form-input opt-input"
                          value={opt}
                          onChange={(e) =>
                            handleUpdateOption(qIndex, optIndex, e.target.value)
                          }
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <button
                          type="button"
                          className="icon-btn-sm"
                          onClick={() => handleDeleteOption(qIndex, optIndex)}
                          title="Remove option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-sm mt-2"
                    onClick={() => handleAddOption(qIndex)}
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {/* Question Flow Setting: General Question vs Link Question */}
              <div className="flow-settings-box">
                <label className="field-label">Question flow</label>
                <div className="flow-radios">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`flow_${q.id}`}
                      value="general"
                      checked={q.flow === 'general'}
                      onChange={() =>
                        handleUpdateQuestion(qIndex, { flow: 'general' })
                      }
                    />
                    <span>
                      <strong>General question:</strong> Continue to the next question in normal sequence.
                    </span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`flow_${q.id}`}
                      value="link"
                      checked={q.flow === 'link'}
                      onChange={() =>
                        handleUpdateQuestion(qIndex, {
                          flow: 'link',
                          type: isChoiceType ? q.type : 'single_choice',
                          options: q.options.length > 0 ? q.options : ['', ''],
                        })
                      }
                    />
                    <span>
                      <strong>Link question:</strong> Configure which question should appear for each answer option (Skip logic).
                    </span>
                  </label>
                </div>

                {/* If Link Question: Destination Selector Table */}
                {q.flow === 'link' && isChoiceType && (
                  <div className="link-table-wrapper">
                    <div className="table-caption">
                      Destination selector: Choose what to show for each answer option
                    </div>
                    <table className="link-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Answer option</th>
                          <th style={{ width: '60%' }}>Show this question</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.options.map((opt, optIdx) => {
                          const optionDisplay = opt.trim() || `Option ${optIdx + 1}`;
                          const currentLink = q.optionLinks?.[opt] || 'NEXT';

                          return (
                            <tr key={optIdx}>
                              <td>
                                <strong>{optionDisplay}</strong>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={currentLink}
                                  onChange={(e) =>
                                    handleSetOptionLink(qIndex, opt, e.target.value)
                                  }
                                >
                                  <option value="NEXT">
                                    → Next question in sequence
                                  </option>
                                  <option value="END">
                                    ✓ End survey (Submit)
                                  </option>
                                  <optgroup label="Select destination question:">
                                    {(() => {
                                      const available = currentSurvey.questions.filter((otherQ) => {
                                        // 1. Cannot link to self
                                        if (otherQ.id === q.id) return false;

                                        // 2. Once a question is linked to ANY option in the dropdown, it should NOT show again!
                                        const linkedInfo = allLinkedQuestionsMap.get(otherQ.id);
                                        if (linkedInfo) {
                                          // Only show if it is linked to THIS specific option of THIS question (the currently selected link)
                                          return linkedInfo.parentQuestionId === q.id && linkedInfo.optionKey === opt;
                                        }

                                        // Not linked to any option -> available to be linked!
                                        return true;
                                      });

                                      if (available.length === 0) {
                                        return (
                                          <option disabled value="">
                                            (All other questions are already linked)
                                          </option>
                                        );
                                      }

                                      return available.map((otherQ) => {
                                        const actualNumber =
                                          currentSurvey.questions.findIndex(
                                            (item) => item.id === otherQ.id
                                          ) + 1;
                                        const qTitle = otherQ.label.trim()
                                          ? otherQ.label.slice(0, 45)
                                          : `(Untitled Question ${actualNumber})`;
                                        return (
                                          <option
                                            key={otherQ.id}
                                            value={otherQ.id}
                                          >
                                            Question {actualNumber}: {qTitle}
                                          </option>
                                        );
                                      });
                                    })()}
                                  </optgroup>
                                  <option value="__CREATE_NEW__">
                                    + Create destination question directly...
                                  </option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Optional default destination for general flow continuation */}
                {q.flow === 'general' && (
                  <div className="default-next-row">
                    <label className="field-label-sm">
                      After answering this question, continue to:
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={q.defaultNextId || 'NEXT'}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateQuestion(qIndex, {
                          defaultNextId: val === 'NEXT' ? undefined : val,
                        });
                      }}
                    >
                      <option value="NEXT">
                        Next question in sequence ({qIndex + 2 <= currentSurvey.questions.length ? `Question ${qIndex + 2}` : 'End of survey'})
                      </option>
                      <option value="END">End of survey (Submit)</option>
                      <optgroup label="Jump directly to:">
                        {currentSurvey.questions
                          .filter((otherQ) => {
                            if (otherQ.id === q.id) return false;
                            // Exclude questions linked to any option in the survey
                            const linkedInfo = allLinkedQuestionsMap.get(otherQ.id);
                            if (linkedInfo && q.defaultNextId !== otherQ.id) {
                              return false;
                            }
                            return true;
                          })
                          .map((otherQ) => {
                            const actualNumber =
                              currentSurvey.questions.findIndex(
                                (item) => item.id === otherQ.id
                              ) + 1;
                            const qTitle = otherQ.label.trim()
                              ? otherQ.label.slice(0, 45)
                              : `(Untitled Question ${actualNumber})`;
                            return (
                              <option key={otherQ.id} value={otherQ.id}>
                                Question {actualNumber}: {qTitle}
                              </option>
                            );
                          })}
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div className="builder-bottom-bar">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={currentSurvey.questions.length >= 15}
          onClick={handleAddQuestion}
        >
          + Add Question ({currentSurvey.questions.length}/15)
        </button>
        <div className="flex-gap">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateForm}
          >
            Create Form
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onPreviewSurvey}
          >
            Test Respondent View →
          </button>
        </div>
      </div>
    </div>
  );
};
