import type { QuestionDefinition, FormAnswers } from '../../types/form.types.ts';
import type { ValidationResult, ValidationError, ValidationRule } from '../../types/validation.types.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string') return val.trim().length === 0;
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

export function validateQuestion(
  question: QuestionDefinition,
  value: unknown,
  answers: FormAnswers = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  const isRequired = question.required || question.validation?.some((r) => r.type === 'required');
  const isEmpty = isEmptyValue(value);

  if (isRequired && isEmpty) {
    const customRequiredRule = question.validation?.find((r) => r.type === 'required');
    errors.push({
      questionId: question.id,
      message: customRequiredRule?.message || `${question.label} is required.`,
      ruleType: 'required',
    });
    return { isValid: false, errors };
  }

  if (isEmpty) {
    return { isValid: true, errors: [] };
  }

  const rules = question.validation || [];
  for (const rule of rules) {
    if (rule.type === 'required') continue;

    const error = evaluateRule(question.id, rule, value, answers);
    if (error) {
      errors.push(error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function evaluateRule(
  questionId: string,
  rule: ValidationRule,
  value: unknown,
  answers: FormAnswers
): ValidationError | null {
  switch (rule.type) {
    case 'minLength': {
      const min = Number(rule.value);
      const strVal = String(value ?? '');
      if (strVal.length < min) {
        return {
          questionId,
          ruleType: 'minLength',
          message: rule.message || `Must be at least ${min} characters.`,
        };
      }
      break;
    }

    case 'maxLength': {
      const max = Number(rule.value);
      const strVal = String(value ?? '');
      if (strVal.length > max) {
        return {
          questionId,
          ruleType: 'maxLength',
          message: rule.message || `Cannot exceed ${max} characters.`,
        };
      }
      break;
    }

    case 'min': {
      const minNum = Number(rule.value);
      const valNum = Number(value);
      if (Number.isNaN(valNum) || valNum < minNum) {
        return {
          questionId,
          ruleType: 'min',
          message: rule.message || `Must be at least ${minNum}.`,
        };
      }
      break;
    }

    case 'max': {
      const maxNum = Number(rule.value);
      const valNum = Number(value);
      if (Number.isNaN(valNum) || valNum > maxNum) {
        return {
          questionId,
          ruleType: 'max',
          message: rule.message || `Cannot exceed ${maxNum}.`,
        };
      }
      break;
    }

    case 'email': {
      const strVal = String(value ?? '').trim();
      if (!EMAIL_REGEX.test(strVal)) {
        return {
          questionId,
          ruleType: 'email',
          message: rule.message || 'Please enter a valid email address.',
        };
      }
      break;
    }

    case 'pattern': {
      if (rule.value) {
        const regex = typeof rule.value === 'string' ? new RegExp(rule.value) : (rule.value as RegExp);
        const strVal = String(value ?? '');
        if (!regex.test(strVal)) {
          return {
            questionId,
            ruleType: 'pattern',
            message: rule.message || 'Invalid format.',
          };
        }
      }
      break;
    }

    case 'custom': {
      if (typeof rule.customValidator === 'function') {
        const isCustomValid = rule.customValidator(value, answers);
        if (!isCustomValid) {
          return {
            questionId,
            ruleType: 'custom',
            message: rule.message || 'Validation failed.',
          };
        }
      }
      break;
    }
  }

  return null;
}

export function validateActiveQuestions(
  activeQuestions: QuestionDefinition[],
  answers: FormAnswers
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const question of activeQuestions) {
    const result = validateQuestion(question, answers[question.id], answers);
    if (!result.isValid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

