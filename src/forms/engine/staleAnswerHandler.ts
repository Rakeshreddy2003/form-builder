import type { FormDefinition, FormAnswers } from '../../types/form.types.ts';
import { isQuestionVisible } from './questionResolver.ts';

export interface StaleAnswerCleanupResult {
  cleanedAnswers: FormAnswers;
  removedQuestionIds: string[];
}

export function cleanupStaleAnswers(
  form: FormDefinition,
  currentAnswers: FormAnswers
): StaleAnswerCleanupResult {
  const answers = { ...currentAnswers };
  const removedQuestionIds: string[] = [];

  let changed = true;
  let iterations = 0;
  const maxIterations = form.questions.length + 1;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const question of form.questions) {
      if (question.id in answers) {
        const visible = isQuestionVisible(question, answers);
        if (!visible) {
          delete answers[question.id];
          if (!removedQuestionIds.includes(question.id)) {
            removedQuestionIds.push(question.id);
          }
          changed = true;
        }
      }
    }
  }

  return {
    cleanedAnswers: answers,
    removedQuestionIds,
  };
}
