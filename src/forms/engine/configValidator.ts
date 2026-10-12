import type {
  FormDefinition,
  QuestionDefinition,
  QuestionType,
  NavigationRule,
} from '../../types/form.types.ts';
import type { Condition, SimpleCondition, CompoundCondition } from '../../types/condition.types.ts';

const VALID_QUESTION_TYPES: readonly QuestionType[] = [
  'text',
  'textarea',
  'number',
  'email',
  'singleSelect',
  'multiSelect',
  'dropdown',
  'date',
  'boolean',
];

export const MAX_FORM_QUESTIONS = 15;

export interface FormValidationOptions {
  maxQuestions?: number;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function extractConditionReferences(condition?: Condition): string[] {
  if (!condition) return [];

  const refs: string[] = [];
  const compound = condition as CompoundCondition;

  if (Array.isArray(compound.all)) {
    for (const c of compound.all) {
      refs.push(...extractConditionReferences(c));
    }
  }

  if (Array.isArray(compound.any)) {
    for (const c of compound.any) {
      refs.push(...extractConditionReferences(c));
    }
  }

  if (compound.not) {
    refs.push(...extractConditionReferences(compound.not));
  }

  const simple = condition as SimpleCondition;
  const targetId = simple.questionId ?? simple.question;
  if (targetId) {
    refs.push(targetId);
  }

  return refs;
}

export function validateFormDefinition(
  form: FormDefinition,
  options?: FormValidationOptions
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!form.id || typeof form.id !== 'string' || form.id.trim() === '') {
    errors.push('Form must have a non-empty string ID.');
  }

  if (typeof form.version !== 'number' || form.version < 1) {
    errors.push('Form version must be a positive integer.');
  }

  if (!form.title || typeof form.title !== 'string' || form.title.trim() === '') {
    errors.push('Form must have a title.');
  }

  if (!Array.isArray(form.questions) || form.questions.length === 0) {
    errors.push('Form must contain at least one question.');
    return { isValid: false, errors, warnings };
  }

  if (options?.maxQuestions !== undefined && form.questions.length > options.maxQuestions) {
    errors.push(
      `Form contains ${form.questions.length} questions, which exceeds the maximum allowed limit of ${options.maxQuestions} questions.`
    );
  }

  const questionIdSet = new Set<string>();
  const allQuestionIds = new Set(form.questions.map((q) => q.id));

  for (const question of form.questions) {
    if (!question.id || typeof question.id !== 'string') {
      errors.push('Question is missing a valid ID.');
      continue;
    }

    if (questionIdSet.has(question.id)) {
      errors.push(`Duplicate question ID detected: "${question.id}". Question IDs must be globally unique within the form.`);
    }
    questionIdSet.add(question.id);

    if (!VALID_QUESTION_TYPES.includes(question.type)) {
      errors.push(`Question "${question.id}" has unsupported type: "${question.type}".`);
    }

    if (!question.label || typeof question.label !== 'string' || question.label.trim() === '') {
      errors.push(`Question "${question.id}" must have a label.`);
    }

    const needsOptions = ['singleSelect', 'multiSelect', 'dropdown'].includes(question.type);
    if (needsOptions) {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        errors.push(`Question "${question.id}" of type "${question.type}" must specify at least one option.`);
      } else {
        const optionValueSet = new Set<string>();
        for (const opt of question.options) {
          if (optionValueSet.has(opt.value)) {
            errors.push(`Question "${question.id}" contains duplicate option value: "${opt.value}".`);
          }
          optionValueSet.add(opt.value);
        }
      }
    }

    if (question.visibility) {
      const refs = extractConditionReferences(question.visibility);
      for (const ref of refs) {
        if (!allQuestionIds.has(ref)) {
          errors.push(`Question "${question.id}" visibility references non-existent question: "${ref}".`);
        }
        if (ref === question.id) {
          errors.push(`Question "${question.id}" visibility references itself, which creates an illegal self-dependency.`);
        }
      }
    }

    if (question.next) {
      for (const rule of question.next) {
        if (rule.targetQuestionId !== null && !allQuestionIds.has(rule.targetQuestionId)) {
          errors.push(`Question "${question.id}" next rule references non-existent question: "${rule.targetQuestionId}".`);
        }
        if (rule.targetQuestionId === question.id) {
          errors.push(`Question "${question.id}" has a navigation rule pointing to itself, causing an infinite loop.`);
        }
        if (rule.when) {
          const refs = extractConditionReferences(rule.when);
          for (const ref of refs) {
            if (!allQuestionIds.has(ref)) {
              errors.push(`Question "${question.id}" next condition references non-existent question: "${ref}".`);
            }
          }
        }
      }
    }
  }

  for (const q of form.questions) {
    const visited = new Set<string>();
    let currId: string | null = q.id;

    while (currId) {
      visited.add(currId);
      const currentQ: QuestionDefinition | undefined = form.questions.find((x: QuestionDefinition) => x.id === currId);
      const unconditionalRule: NavigationRule | undefined = currentQ?.next?.find((n: NavigationRule) => !n.when);

      if (unconditionalRule) {
        const nextId: string | null = unconditionalRule.targetQuestionId;
        if (nextId === null) {
          break;
        }
        if (visited.has(nextId)) {
          errors.push(`Circular navigation loop detected involving question "${nextId}".`);
          break;
        }
        currId = nextId;
      } else {
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
