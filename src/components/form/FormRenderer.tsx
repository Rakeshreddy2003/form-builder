import React from 'react';
import type { FormDefinition } from '../../types/form.types.ts';
import type { FormResponse } from '../../types/response.types.ts';
import { useFormEngine } from '../../forms/hooks/useFormEngine.ts';
import { FormProgress } from './FormProgress.tsx';
import { FormQuestion } from './FormQuestion.tsx';
import { FormNavigation } from './FormNavigation.tsx';
import { FormError } from './FormError.tsx';
import { FormCompleted } from './FormCompleted.tsx';

export interface FormRendererProps {
  form: FormDefinition;
  onCompleted?: (response: FormResponse) => void;
  onAnswerChange?: (questionId: string, value: unknown) => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  onCompleted,
  onAnswerChange,
}) => {
  const {
    currentQuestion,
    answers,
    errors,
    progress,
    canGoBack,
    isLastQuestion,
    isCompleted,
    isSubmitting,
    generalError,
    completedResponse,
    setAnswer,
    next,
    previous,
    submit,
    retrySync,
    reset,
    setGeneralError,
  } = useFormEngine({
    form,
    onCompleted,
  });

  const handleAnswer = (val: unknown) => {
    if (currentQuestion) {
      setAnswer(currentQuestion.id, val);
      onAnswerChange?.(currentQuestion.id, val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Advance on Enter key if not inside textarea or button
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
        e.preventDefault();
        if (isLastQuestion) {
          submit();
        } else {
          next();
        }
      }
    }
  };

  if (isCompleted && completedResponse) {
    return (
      <div className="rk-form-wrapper">
        <FormCompleted
          form={form}
          response={completedResponse}
          onRestart={reset}
          onRetrySync={retrySync}
        />
      </div>
    );
  }

  return (
    <div className="rk-form-wrapper">
      <header className="rk-form-header">
        <div className="rk-form-title-group">
          <h1 className="rk-form-title">{form.title}</h1>
          <span className="rk-version-badge">v{form.version}</span>
        </div>
        {form.description && <p className="rk-form-description">{form.description}</p>}
      </header>

      <FormProgress
        percentage={progress.percentage}
        currentStep={progress.currentStep}
        totalSteps={progress.totalActiveCount}
      />

      {generalError && (
        <FormError
          message={generalError}
          onDismiss={() => setGeneralError(null)}
          onRetry={isLastQuestion ? submit : next}
        />
      )}

      <form
        className="rk-form-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (isLastQuestion) submit();
          else next();
        }}
        onKeyDown={handleKeyDown}
        noValidate
      >
        {currentQuestion ? (
          <FormQuestion
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onChange={handleAnswer}
            error={errors[currentQuestion.id]}
            disabled={isSubmitting}
          />
        ) : (
          <div className="rk-empty-form-state">
            <p>No active questions available.</p>
          </div>
        )}

        <FormNavigation
          canGoBack={canGoBack}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          onPrevious={previous}
          onNext={next}
          onSubmit={submit}
        />
      </form>
    </div>
  );
};

