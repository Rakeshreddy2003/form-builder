import type { FormDefinition, FormAnswers } from '../../types/form.types.ts';
import { getActiveQuestions } from './questionResolver.ts';

export interface ProgressResult {
  percentage: number;
  completedCount: number;
  totalActiveCount: number;
  currentStep: number;
}

function hasAnswer(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'boolean') return true;
  if (typeof val === 'number') return !Number.isNaN(val);
  return true;
}

export function calculateProgress(
  form: FormDefinition,
  answers: FormAnswers,
  currentQuestionId: string | null,
  isFormCompleted = false
): ProgressResult {
  const activeQuestions = getActiveQuestions(form, answers);
  const totalActiveCount = activeQuestions.length;

  if (totalActiveCount === 0) {
    return {
      percentage: 100,
      completedCount: 0,
      totalActiveCount: 0,
      currentStep: 0,
    };
  }

  if (isFormCompleted) {
    return {
      percentage: 100,
      completedCount: totalActiveCount,
      totalActiveCount,
      currentStep: totalActiveCount,
    };
  }

  const currentIndex = currentQuestionId
    ? activeQuestions.findIndex((q) => q.id === currentQuestionId)
    : 0;

  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 1;
  const completedCount = activeQuestions.filter((q) => hasAnswer(answers[q.id])).length;

  const percentage = Math.min(
    100,
    Math.max(0, Math.round((completedCount / totalActiveCount) * 100))
  );

  return {
    percentage,
    completedCount,
    totalActiveCount,
    currentStep,
  };
}

