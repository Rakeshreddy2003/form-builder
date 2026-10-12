import { useState, useCallback, useMemo } from 'react';
import type { FormDefinition, QuestionDefinition, FormAnswers } from '../../types/form.types.ts';
import type { FormResponse } from '../../types/response.types.ts';
import {
  getActiveQuestions,
  resolveNextQuestion,
  resolvePreviousQuestion,
} from '../engine/questionResolver.ts';
import { validateQuestion, validateActiveQuestions } from '../engine/validationEngine.ts';
import { calculateProgress, type ProgressResult } from '../engine/progressCalculator.ts';
import { cleanupStaleAnswers } from '../engine/staleAnswerHandler.ts';
import { defaultResponseService, ResponseService } from '../../services/response/responseService.ts';
import { defaultExcelSyncService, ExcelSyncService } from '../../services/integrations/excel/excelSyncService.ts';

export interface UseFormEngineOptions {
  form: FormDefinition;
  initialAnswers?: FormAnswers;
  responseService?: ResponseService;
  syncService?: ExcelSyncService;
  onCompleted?: (response: FormResponse) => void;
}

export function useFormEngine({
  form,
  initialAnswers = {},
  responseService = defaultResponseService,
  syncService = defaultExcelSyncService,
  onCompleted,
}: UseFormEngineOptions) {
  const initialActive = useMemo(
    () => getActiveQuestions(form, initialAnswers),
    [form, initialAnswers]
  );
  const initialFirstQ = initialActive[0] || null;

  const [answers, setAnswers] = useState<FormAnswers>(initialAnswers);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    initialFirstQ ? initialFirstQ.id : null
  );
  const [visitedHistory, setVisitedHistory] = useState<string[]>(
    initialFirstQ ? [initialFirstQ.id] : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [completedResponse, setCompletedResponse] = useState<FormResponse | null>(null);

  // Derived active questions
  const activeQuestions = useMemo(() => {
    return getActiveQuestions(form, answers);
  }, [form, answers]);

  // Current question definition
  const currentQuestion: QuestionDefinition | null = useMemo(() => {
    if (!currentQuestionId) return activeQuestions[0] || null;
    return form.questions.find((q) => q.id === currentQuestionId) || null;
  }, [form.questions, currentQuestionId, activeQuestions]);

  // Progress calculation strictly against active questions
  const progress: ProgressResult = useMemo(() => {
    return calculateProgress(form, answers, currentQuestionId, isCompleted);
  }, [form, answers, currentQuestionId, isCompleted]);

  // Can go back
  const canGoBack = useMemo(() => {
    if (!currentQuestionId || isCompleted) return false;
    const prev = resolvePreviousQuestion({
      form,
      currentQuestionId,
      answers,
      visitedHistory,
    });
    return prev !== null;
  }, [form, currentQuestionId, answers, visitedHistory, isCompleted]);

  // Is last question
  const isLastQuestion = useMemo(() => {
    if (!currentQuestionId || activeQuestions.length === 0) return true;
    const nextQ = resolveNextQuestion({
      form,
      currentQuestionId,
      answers,
    });
    return nextQ === null;
  }, [form, currentQuestionId, answers, activeQuestions.length]);

  // Handle setting an answer with STALE ANSWER CLEANUP
  const setAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setAnswers((prevAnswers) => {
        const updated = { ...prevAnswers, [questionId]: value };
        // Clean stale answers for branches that become inactive
        const { cleanedAnswers } = cleanupStaleAnswers(form, updated);
        return cleanedAnswers;
      });

      // Clear validation error on change
      setErrors((prevErrors) => {
        if (!prevErrors[questionId]) return prevErrors;
        const nextErrors = { ...prevErrors };
        delete nextErrors[questionId];
        return nextErrors;
      });
    },
    [form]
  );

  // Submit complete form
  const submitForm = useCallback(
    async (finalAnswers: FormAnswers) => {
      setIsSubmitting(true);
      setGeneralError(null);

      try {
        // 1. Centralized validation of all active questions
        const validation = validateActiveQuestions(activeQuestions, finalAnswers);
        if (!validation.isValid) {
          const newErrors: Record<string, string> = {};
          for (const err of validation.errors) {
            newErrors[err.questionId] = err.message;
          }
          setErrors(newErrors);
          setIsSubmitting(false);
          return;
        }

        // 2. Persist FormResponse independently from Excel
        const newResponse = responseService.createResponse(form.id, form.version);
        newResponse.answers = finalAnswers;
        newResponse.status = 'COMPLETED';
        newResponse.completedAt = new Date().toISOString();
        await responseService.saveResponse(newResponse);

        // 3. Synchronize to Excel via Adapter (idempotent & failure safe)
        await syncService.syncResponse(form, newResponse);

        // 4. Retrieve finalized response with sync status
        const finalized = (await responseService.getResponse(newResponse.responseId)) || newResponse;
        setCompletedResponse(finalized);
        setIsCompleted(true);
        onCompleted?.(finalized);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An error occurred during submission.';
        setGeneralError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeQuestions, form, responseService, syncService, onCompleted]
  );

  // Navigate to Next question
  const next = useCallback(() => {
    if (!currentQuestion) return;

    // Validate current question
    const currentVal = answers[currentQuestion.id];
    const validation = validateQuestion(currentQuestion, currentVal, answers);

    if (!validation.isValid) {
      setErrors((prev) => ({
        ...prev,
        [currentQuestion.id]: validation.errors[0]?.message || 'Please answer this question.',
      }));
      return;
    }

    // Resolve next question
    const nextQ = resolveNextQuestion({
      form,
      currentQuestionId: currentQuestion.id,
      answers,
    });

    if (nextQ) {
      setCurrentQuestionId(nextQ.id);
      setVisitedHistory((prev) => [...prev, nextQ.id]);
    } else {
      // Reached end of form -> submit
      submitForm(answers);
    }
  }, [currentQuestion, answers, form, submitForm]);

  // Navigate to Previous question
  const previous = useCallback(() => {
    if (!currentQuestionId) return;

    const prevQ = resolvePreviousQuestion({
      form,
      currentQuestionId,
      answers,
      visitedHistory,
    });

    if (prevQ) {
      setCurrentQuestionId(prevQ.id);
      setVisitedHistory((prev) => {
        // Pop current question if it was the last visited
        if (prev.length > 1 && prev[prev.length - 1] === currentQuestionId) {
          return prev.slice(0, -1);
        }
        return [...prev, prevQ.id];
      });
      // Clear current errors when navigating back
      setErrors({});
    }
  }, [currentQuestionId, form, answers, visitedHistory]);

  // Retry Excel synchronization for completed response
  const retrySync = useCallback(async () => {
    if (!completedResponse) return;
    setIsSubmitting(true);
    setGeneralError(null);

    try {
      await syncService.retrySync(form, completedResponse.responseId);
      const updated = await responseService.getResponse(completedResponse.responseId);
      if (updated) {
        setCompletedResponse(updated);
      }
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Retry synchronization failed.');
    } finally {
      setIsSubmitting(false);
    }
  }, [completedResponse, form, syncService, responseService]);

  // Reset form
  const reset = useCallback(() => {
    const active = getActiveQuestions(form, {});
    const firstQ = active[0] || null;
    setCurrentQuestionId(firstQ ? firstQ.id : null);
    setVisitedHistory(firstQ ? [firstQ.id] : []);
    setAnswers({});
    setErrors({});
    setIsCompleted(false);
    setCompletedResponse(null);
    setGeneralError(null);
  }, [form]);

  return {
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
    submit: () => submitForm(answers),
    retrySync,
    reset,
    setGeneralError,
  };
}
