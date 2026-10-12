import type { Survey, Question } from '../types/survey.ts';

export interface NextStepResolution {
  nextQuestion: Question | null;
  isEnd: boolean;
  reason: 'link' | 'sequence' | 'default_target' | 'none';
  targetLabel?: string;
}

/**
 * Checks whether a question is eligible to be shown given the survey answers so far.
 * If a question is linked as a destination for specific option(s) of a link question,
 * it will ONLY be shown if the parent question was answered with one of those options.
 * Otherwise, it is skipped and will never appear.
 */
export function isQuestionEligible(
  candidateQ: Question,
  survey: Survey,
  answers: Record<string, any>,
  visitedIds?: Set<string>
): boolean {
  if (visitedIds && visitedIds.has(candidateQ.id)) {
    return false;
  }

  // Check all link questions in the survey
  for (const parentQ of survey.questions) {
    if (parentQ.id === candidateQ.id) continue;
    if (parentQ.flow !== 'link' || !parentQ.optionLinks) continue;

    // Find all options of parentQ that explicitly link to candidateQ
    const matchingOptions = Object.entries(parentQ.optionLinks)
      .filter(([_, targetId]) => targetId === candidateQ.id)
      .map(([opt]) => opt);

    if (matchingOptions.length > 0) {
      // candidateQ is a conditional follow-up for parentQ under matchingOptions
      const parentAnswer = answers[parentQ.id];

      // If parent has not been answered yet, or parent answer does not match any of the linking options:
      // candidateQ is NOT eligible and must not appear!
      if (parentAnswer === undefined || parentAnswer === null || parentAnswer === '') {
        return false;
      }

      if (parentQ.type === 'single_choice') {
        if (!matchingOptions.includes(String(parentAnswer))) {
          return false;
        }
      } else if (parentQ.type === 'multiple_choice') {
        if (Array.isArray(parentAnswer)) {
          const hasMatch = matchingOptions.some((opt) => parentAnswer.includes(opt));
          if (!hasMatch) return false;
        } else if (!matchingOptions.includes(String(parentAnswer))) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Returns all questions in the survey that are currently eligible based on answers so far.
 */
export function getActiveQuestions(
  survey: Survey,
  answers: Record<string, any>
): Question[] {
  return survey.questions.filter((q) => isQuestionEligible(q, survey, answers));
}

/**
 * Determines the next question based on current question, user answers, and skip logic.
 * Ensures questions linked to other unselected options are skipped and never appear.
 */
export function resolveNextQuestion(
  survey: Survey,
  currentQuestion: Question | null,
  answers: Record<string, any>,
  visitedHistory: string[] = []
): NextStepResolution {
  const visitedSet = new Set(visitedHistory);

  if (!currentQuestion) {
    // First eligible question in survey
    const firstEligible = survey.questions.find((q) =>
      isQuestionEligible(q, survey, answers)
    );
    return {
      nextQuestion: firstEligible || null,
      isEnd: !firstEligible,
      reason: 'sequence',
      targetLabel: firstEligible?.label,
    };
  }

  const currentIndex = survey.questions.findIndex((q) => q.id === currentQuestion.id);

  // 1. If current question is a Link Question (Skip logic based on answer options)
  if (currentQuestion.flow === 'link') {
    const answer = answers[currentQuestion.id];

    if (currentQuestion.type === 'single_choice' && typeof answer === 'string' && answer) {
      const targetId = currentQuestion.optionLinks?.[answer];
      if (targetId === 'END') {
        return {
          nextQuestion: null,
          isEnd: true,
          reason: 'link',
          targetLabel: 'End of survey (Submit)',
        };
      }
      if (targetId && targetId !== 'NEXT') {
        const targetQ = survey.questions.find((q) => q.id === targetId);
        if (targetQ && isQuestionEligible(targetQ, survey, answers)) {
          return {
            nextQuestion: targetQ,
            isEnd: false,
            reason: 'link',
            targetLabel: targetQ.label,
          };
        }
      }
    } else if (currentQuestion.type === 'multiple_choice' && Array.isArray(answer) && answer.length > 0) {
      // Find first selected option that has a defined link
      for (const opt of answer) {
        const targetId = currentQuestion.optionLinks?.[opt];
        if (targetId === 'END') {
          return {
            nextQuestion: null,
            isEnd: true,
            reason: 'link',
            targetLabel: 'End of survey (Submit)',
          };
        }
        if (targetId && targetId !== 'NEXT') {
          const targetQ = survey.questions.find((q) => q.id === targetId);
          if (targetQ && isQuestionEligible(targetQ, survey, answers)) {
            return {
              nextQuestion: targetQ,
              isEnd: false,
              reason: 'link',
              targetLabel: targetQ.label,
            };
          }
        }
      }
    }
  }

  // 2. Check explicit defaultNextId (e.g. follow-up question joining back to a common question)
  if (currentQuestion.defaultNextId) {
    if (currentQuestion.defaultNextId === 'END') {
      return {
        nextQuestion: null,
        isEnd: true,
        reason: 'default_target',
        targetLabel: 'End of survey (Submit)',
      };
    }
    const targetQ = survey.questions.find((q) => q.id === currentQuestion.defaultNextId);
    if (targetQ && isQuestionEligible(targetQ, survey, answers)) {
      return {
        nextQuestion: targetQ,
        isEnd: false,
        reason: 'default_target',
        targetLabel: targetQ.label,
      };
    }
  }

  // 3. Search forward in sequence, skipping any questions that belong to other unselected options or were already visited
  for (let i = currentIndex + 1; i < survey.questions.length; i++) {
    const candidate = survey.questions[i];
    if (isQuestionEligible(candidate, survey, answers, visitedSet)) {
      return {
        nextQuestion: candidate,
        isEnd: false,
        reason: 'sequence',
        targetLabel: candidate.label,
      };
    }
  }

  // End of survey
  return {
    nextQuestion: null,
    isEnd: true,
    reason: 'sequence',
    targetLabel: 'End of survey (Submit)',
  };
}

/**
 * Returns a live preview string of the next question based on current selection.
 */
export function getNextQuestionPreview(
  survey: Survey,
  currentQuestion: Question | null,
  answers: Record<string, any>,
  visitedHistory: string[] = []
): string {
  if (!currentQuestion) return '';

  const resolution = resolveNextQuestion(survey, currentQuestion, answers, visitedHistory);
  if (resolution.isEnd || !resolution.nextQuestion) {
    return 'End of survey (Submit)';
  }
  return resolution.nextQuestion.label || '(Next Question)';
}
