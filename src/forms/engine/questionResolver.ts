import type { FormDefinition, QuestionDefinition, FormAnswers } from '../../types/form.types.ts';
import { evaluateCondition } from './conditionEvaluator.ts';

export function isQuestionVisible(question: QuestionDefinition, answers: FormAnswers): boolean {
  if (!question.visibility) {
    return true;
  }
  return evaluateCondition(question.visibility, answers);
}

export function getActiveQuestions(form: FormDefinition, answers: FormAnswers): QuestionDefinition[] {
  return form.questions.filter((question) => isQuestionVisible(question, answers));
}

export interface ResolveNextQuestionParams {
  form: FormDefinition;
  currentQuestionId: string | null;
  answers: FormAnswers;
}

export function resolveNextQuestion({
  form,
  currentQuestionId,
  answers,
}: ResolveNextQuestionParams): QuestionDefinition | null {
  const activeQuestions = getActiveQuestions(form, answers);
  if (activeQuestions.length === 0) {
    return null;
  }

  if (!currentQuestionId) {
    return activeQuestions[0] || null;
  }

  const currentQuestion = form.questions.find((q) => q.id === currentQuestionId);
  if (!currentQuestion) {
    return activeQuestions[0] || null;
  }

  if (currentQuestion.next && currentQuestion.next.length > 0) {
    for (const rule of currentQuestion.next) {
      const conditionMatches = !rule.when || evaluateCondition(rule.when, answers);
      if (conditionMatches) {
        if (rule.targetQuestionId === null) {
          return null;
        }

        const target = form.questions.find((q) => q.id === rule.targetQuestionId);
        if (target) {
          if (isQuestionVisible(target, answers)) {
            return target;
          }
          const targetIndexInAll = form.questions.findIndex((q) => q.id === target.id);
          const nextActive = form.questions
            .slice(targetIndexInAll + 1)
            .find((q) => isQuestionVisible(q, answers));
          return nextActive || null;
        }
      }
    }
  }

  const currentActiveIndex = activeQuestions.findIndex((q) => q.id === currentQuestionId);
  if (currentActiveIndex >= 0) {
    if (currentActiveIndex < activeQuestions.length - 1) {
      return activeQuestions[currentActiveIndex + 1];
    }
    return null;
  }

  const currentIndexInAll = form.questions.findIndex((q) => q.id === currentQuestionId);
  const nextActive = form.questions
    .slice(currentIndexInAll + 1)
    .find((q) => isQuestionVisible(q, answers));

  return nextActive || null;
}

export interface ResolvePreviousQuestionParams {
  form: FormDefinition;
  currentQuestionId: string | null;
  answers: FormAnswers;
  visitedHistory?: string[];
}

export function resolvePreviousQuestion({
  form,
  currentQuestionId,
  answers,
  visitedHistory = [],
}: ResolvePreviousQuestionParams): QuestionDefinition | null {
  const activeQuestions = getActiveQuestions(form, answers);
  if (activeQuestions.length === 0 || !currentQuestionId) {
    return null;
  }

  if (visitedHistory.length > 1) {
    for (let i = visitedHistory.length - 2; i >= 0; i--) {
      const priorId = visitedHistory[i];
      const match = activeQuestions.find((q) => q.id === priorId);
      if (match) {
        return match;
      }
    }
  }

  const currentIndex = activeQuestions.findIndex((q) => q.id === currentQuestionId);
  if (currentIndex > 0) {
    return activeQuestions[currentIndex - 1];
  }

  return null;
}

