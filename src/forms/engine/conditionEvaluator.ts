import type { Condition, SimpleCondition, CompoundCondition, ConditionOperator } from '../../types/condition.types.ts';
import type { FormAnswers } from '../../types/form.types.ts';

function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string') return val.trim().length === 0;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val as object).length === 0;
  return false;
}

function evaluateOperator(operator: ConditionOperator, actual: unknown, expected: unknown): boolean {
  switch (operator) {
    case 'equals':
      if (typeof actual === 'boolean' || typeof expected === 'boolean') {
        return Boolean(actual) === Boolean(expected);
      }
      if (typeof actual === 'number' || typeof expected === 'number') {
        return Number(actual) === Number(expected);
      }
      return String(actual ?? '').trim() === String(expected ?? '').trim();

    case 'notEquals':
      return !evaluateOperator('equals', actual, expected);

    case 'contains':
      if (Array.isArray(actual)) {
        return actual.some((item) => String(item).trim() === String(expected ?? '').trim());
      }
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.toLowerCase().includes(expected.toLowerCase());
      }
      return false;

    case 'notContains':
      return !evaluateOperator('contains', actual, expected);

    case 'greaterThan': {
      const actualNum = Number(actual);
      const expectedNum = Number(expected);
      if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) return false;
      return actualNum > expectedNum;
    }

    case 'greaterThanOrEqual': {
      const actualNum = Number(actual);
      const expectedNum = Number(expected);
      if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) return false;
      return actualNum >= expectedNum;
    }

    case 'lessThan': {
      const actualNum = Number(actual);
      const expectedNum = Number(expected);
      if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) return false;
      return actualNum < expectedNum;
    }

    case 'lessThanOrEqual': {
      const actualNum = Number(actual);
      const expectedNum = Number(expected);
      if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) return false;
      return actualNum <= expectedNum;
    }

    case 'in':
      if (Array.isArray(expected)) {
        return expected.some((exp) => evaluateOperator('equals', actual, exp));
      }
      return false;

    case 'notIn':
      if (Array.isArray(expected)) {
        return !expected.some((exp) => evaluateOperator('equals', actual, exp));
      }
      return true;

    case 'isEmpty':
      return isEmptyValue(actual);

    case 'isNotEmpty':
      return !isEmptyValue(actual);

    default:
      return false;
  }
}

export function evaluateCondition(condition?: Condition, answers: FormAnswers = {}): boolean {
  if (!condition) {
    return true;
  }

  const compound = condition as CompoundCondition;
  if (Array.isArray(compound.all)) {
    return compound.all.every((subCondition) => evaluateCondition(subCondition, answers));
  }

  if (Array.isArray(compound.any)) {
    return compound.any.some((subCondition) => evaluateCondition(subCondition, answers));
  }

  if (compound.not) {
    return !evaluateCondition(compound.not, answers);
  }

  const simple = condition as SimpleCondition;
  const targetKey = simple.questionId ?? simple.question;
  if (!targetKey) {
    return true;
  }

  const actualValue = answers[targetKey];
  return evaluateOperator(simple.operator, actualValue, simple.value);
}

