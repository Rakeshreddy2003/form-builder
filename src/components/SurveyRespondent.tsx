import React, { useState, useMemo } from 'react';
import type { Survey, Question, SurveyResponse } from '../types/survey.ts';
import {
  resolveNextQuestion,
  getNextQuestionPreview,
  getActiveQuestions,
} from '../utils/flowEngine.ts';

interface SurveyRespondentProps {
  survey: Survey;
  onSubmitResponse: (answers: Record<string, any>) => SurveyResponse;
  onViewResponses: () => void;
  onEditInBuilder: () => void;
}

export const SurveyRespondent: React.FC<SurveyRespondentProps> = ({
  survey,
  onSubmitResponse,
  onViewResponses,
  onEditInBuilder,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(
    survey.questions[0]?.id || ''
  );
  // Navigation history to cleanly support "Previous" through branching paths
  const [history, setHistory] = useState<string[]>(
    survey.questions[0]?.id ? [survey.questions[0].id] : []
  );
  const [submittedResponse, setSubmittedResponse] = useState<SurveyResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync if active survey changes
  React.useEffect(() => {
    const firstId = survey.questions[0]?.id || '';
    setCurrentQuestionId(firstId);
    setHistory(firstId ? [firstId] : []);
    setAnswers({});
    setSubmittedResponse(null);
    setValidationError(null);
  }, [survey.id, survey.updatedAt]);

  // Current Question
  const currentQuestion: Question | undefined = useMemo(() => {
    return survey.questions.find((q) => q.id === currentQuestionId) || survey.questions[0];
  }, [survey.questions, currentQuestionId]);

  // Eligible Active Questions based on current branch answers
  const activeQuestions = useMemo(() => {
    return getActiveQuestions(survey, answers);
  }, [survey, answers]);

  const activeQuestionIndex = useMemo(() => {
    const idx = activeQuestions.findIndex((q) => q.id === currentQuestion?.id);
    return idx >= 0 ? idx + 1 : history.length;
  }, [activeQuestions, currentQuestion, history.length]);

  // Live Next Step Resolution
  const nextResolution = useMemo(() => {
    if (!currentQuestion) return { nextQuestion: null, isEnd: true, reason: 'none' as const };
    return resolveNextQuestion(survey, currentQuestion, answers, history);
  }, [survey, currentQuestion, answers, history]);

  // Live Next Question Preview Text
  const nextQuestionPreview = useMemo(() => {
    return getNextQuestionPreview(survey, currentQuestion || null, answers, history);
  }, [survey, currentQuestion, answers, history]);

  // Handle Answer Changes
  const handleAnswerChange = (val: any) => {
    setValidationError(null);
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const handleToggleMultipleChoice = (option: string) => {
    setValidationError(null);
    if (!currentQuestion) return;
    const currentList: string[] = Array.isArray(answers[currentQuestion.id])
      ? answers[currentQuestion.id]
      : [];
    const exists = currentList.includes(option);
    const updated = exists
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }));
  };

  // Next / Submit Handler
  const handleNext = () => {
    if (!currentQuestion) return;

    // Optional validation for required fields
    const currentVal = answers[currentQuestion.id];
    if (
      currentQuestion.required &&
      (currentVal === undefined ||
        currentVal === null ||
        currentVal === '' ||
        (Array.isArray(currentVal) && currentVal.length === 0))
    ) {
      setValidationError('Please answer this question before continuing.');
      return;
    }

    if (nextResolution.isEnd || !nextResolution.nextQuestion) {
      // Submit survey!
      const newResponse = onSubmitResponse(answers);
      setSubmittedResponse(newResponse);
      return;
    }

    // Advance to target question
    const nextQId = nextResolution.nextQuestion.id;
    setHistory((prev) => [...prev, nextQId]);
    setCurrentQuestionId(nextQId);
    setValidationError(null);
  };

  // Previous Handler
  const handlePrevious = () => {
    if (history.length <= 1) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current question
    const prevQId = newHistory[newHistory.length - 1];

    setHistory(newHistory);
    setCurrentQuestionId(prevQId);
    setValidationError(null);
  };

  // Restart Survey
  const handleRestart = () => {
    setAnswers({});
    const firstQ = survey.questions[0]?.id || '';
    setCurrentQuestionId(firstQ);
    setHistory(firstQ ? [firstQ] : []);
    setSubmittedResponse(null);
    setValidationError(null);
  };

  if (!currentQuestion || survey.questions.length === 0) {
    return (
      <div className="respondent-container empty-state-box">
        <h3>This survey has no questions yet.</h3>
        <p>Please open the Form Creator to add questions to this survey.</p>
        <button type="button" className="btn btn-primary" onClick={onEditInBuilder}>
          Open Form Creator
        </button>
      </div>
    );
  }

  // Submitted Thank You Screen
  if (submittedResponse) {
    return (
      <div className="respondent-container">
        <div className="completion-card">
          <div className="completion-badge">✓</div>
          <h2 className="completion-title">Thank you!</h2>
          <p className="completion-subtitle">
            Your survey response has been saved successfully as{' '}
            <strong>Respondent #{submittedResponse.id}</strong>.
          </p>

          <div className="completion-summary-box">
            <h4>Response Summary:</h4>
            <div className="summary-list">
              {survey.questions.map((q) => {
                const ans = submittedResponse.answers[q.id];
                if (ans === undefined || ans === null || ans === '') return null;
                return (
                  <div key={q.id} className="summary-item">
                    <span className="summary-q">{q.label}:</span>
                    <span className="summary-a">
                      {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="completion-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRestart}
            >
              Submit Another Response
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onViewResponses}
            >
              View Responses & Export Excel →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];
  const canGoPrevious = history.length > 1;
  const isFinalStep = nextResolution.isEnd || !nextResolution.nextQuestion;
  const totalRelevantQuestions = Math.max(activeQuestions.length, history.length);

  return (
    <div className="respondent-container">
      <div className="survey-card">
        {/* Survey Header & Step Indicator */}
        <div className="survey-card-header">
          <div className="survey-title-row">
            <h1 className="survey-title">{survey.title}</h1>
            <span className="step-indicator">
              {activeQuestionIndex} of {totalRelevantQuestions}
            </span>
          </div>

          {/* Simple Clean Progress Bar */}
          <div className="progress-bar-bg" role="progressbar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${(activeQuestionIndex / Math.max(totalRelevantQuestions, 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Body */}
        <div className="survey-question-body">
          <h2 className="survey-question-text">
            {currentQuestion.label || `Question ${activeQuestionIndex}`}
            {currentQuestion.required && <span className="required-asterisk"> *</span>}
          </h2>

          {currentQuestion.description && (
            <p className="question-desc">{currentQuestion.description}</p>
          )}

          {/* Input Based on Question Type */}
          <div className="question-input-wrapper">
            {/* 1. Short Answer */}
            {currentQuestion.type === 'short_answer' && (
              <input
                type="text"
                className="form-input text-input-lg"
                placeholder="Type your response here..."
                value={currentAnswer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                autoFocus
              />
            )}

            {/* 2. Long Answer */}
            {currentQuestion.type === 'long_answer' && (
              <textarea
                className="form-input textarea-lg"
                rows={4}
                placeholder="Type your description here..."
                value={currentAnswer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                autoFocus
              />
            )}

            {/* 3. Numeric */}
            {currentQuestion.type === 'numeric' && (
              <input
                type="number"
                className="form-input text-input-lg"
                placeholder="Enter a number..."
                value={currentAnswer !== undefined ? currentAnswer : ''}
                onChange={(e) =>
                  handleAnswerChange(e.target.value === '' ? '' : Number(e.target.value))
                }
                autoFocus
              />
            )}

            {/* 4. Single Choice */}
            {currentQuestion.type === 'single_choice' && (
              <div className="options-choice-group">
                {currentQuestion.options.map((opt, optIdx) => {
                  const optDisplay = opt.trim() || `Option ${optIdx + 1}`;
                  const isSelected = currentAnswer === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`option-choice-btn ${
                        isSelected ? 'option-choice-active' : ''
                      }`}
                      onClick={() => handleAnswerChange(opt)}
                    >
                      <span className="choice-radio-circle">
                        {isSelected && <span className="choice-radio-inner" />}
                      </span>
                      <span className="choice-text">{optDisplay}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && (
              <div className="options-choice-group">
                {currentQuestion.options.map((opt, optIdx) => {
                  const optDisplay = opt.trim() || `Option ${optIdx + 1}`;
                  const isSelected =
                    Array.isArray(currentAnswer) && currentAnswer.includes(opt);
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`option-choice-btn ${
                        isSelected ? 'option-choice-active' : ''
                      }`}
                      onClick={() => handleToggleMultipleChoice(opt)}
                    >
                      <span className="choice-check-box">
                        {isSelected && '✓'}
                      </span>
                      <span className="choice-text">{optDisplay}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {validationError && (
            <div className="validation-error-text">{validationError}</div>
          )}

          {/* Skip Logic Live Preview Box */}
          <div className="next-preview-box">
            <span className="next-preview-label">Preview of the next question:</span>
            <span className="next-preview-value">
              {nextQuestionPreview || 'Next question in sequence'}
            </span>
          </div>
        </div>

        {/* Navigation Buttons: Previous and Next */}
        <div className="survey-nav-footer">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canGoPrevious}
            onClick={handlePrevious}
          >
            Previous
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
          >
            {isFinalStep ? 'Submit Survey' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
