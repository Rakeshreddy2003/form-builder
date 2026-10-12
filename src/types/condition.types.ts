export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

export interface SimpleCondition {
  /** Stable ID of the question this condition evaluates against */
  questionId?: string;
  /** Alias support for architectural consistency */
  question?: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface CompoundCondition {
  /** Logical AND: all conditions must evaluate to true */
  all?: Condition[];
  /** Logical OR: at least one condition must evaluate to true */
  any?: Condition[];
  /** Logical NOT: condition must evaluate to false */
  not?: Condition;
}

export type Condition = SimpleCondition | CompoundCondition;

