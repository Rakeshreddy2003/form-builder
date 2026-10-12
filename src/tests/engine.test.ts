import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCondition,
  getActiveQuestions,
  resolveNextQuestion,
  resolvePreviousQuestion,
  validateQuestion,
  calculateProgress,
  cleanupStaleAnswers,
  validateFormDefinition,
} from '../forms/engine/index.ts';

import type { FormDefinition } from '../types/form.types.ts';

describe('Condition Evaluator', () => {
  it('evaluates simple equality operators', () => {
    assert.equal(
      evaluateCondition({ questionId: 'role', operator: 'equals', value: 'admin' }, { role: 'admin' }),
      true
    );
    assert.equal(
      evaluateCondition({ questionId: 'role', operator: 'equals', value: 'admin' }, { role: 'user' }),
      false
    );
    assert.equal(
      evaluateCondition({ questionId: 'role', operator: 'notEquals', value: 'admin' }, { role: 'user' }),
      true
    );
  });

  it('evaluates string and array contains operators', () => {
    assert.equal(
      evaluateCondition({ questionId: 'tags', operator: 'contains', value: 'tech' }, { tags: ['sales', 'tech'] }),
      true
    );
    assert.equal(
      evaluateCondition({ questionId: 'tags', operator: 'contains', value: 'hr' }, { tags: ['sales', 'tech'] }),
      false
    );
    assert.equal(
      evaluateCondition({ questionId: 'bio', operator: 'contains', value: 'developer' }, { bio: 'Senior software developer' }),
      true
    );
  });

  it('evaluates numeric comparisons', () => {
    assert.equal(
      evaluateCondition({ questionId: 'age', operator: 'greaterThanOrEqual', value: 18 }, { age: 18 }),
      true
    );
    assert.equal(
      evaluateCondition({ questionId: 'age', operator: 'greaterThan', value: 18 }, { age: 18 }),
      false
    );
    assert.equal(
      evaluateCondition({ questionId: 'score', operator: 'lessThan', value: 50 }, { score: 45 }),
      true
    );
  });

  it('evaluates in and notIn', () => {
    assert.equal(
      evaluateCondition({ questionId: 'country', operator: 'in', value: ['US', 'CA', 'MX'] }, { country: 'CA' }),
      true
    );
    assert.equal(
      evaluateCondition({ questionId: 'country', operator: 'notIn', value: ['US', 'CA'] }, { country: 'FR' }),
      true
    );
  });

  it('evaluates isEmpty and isNotEmpty', () => {
    assert.equal(
      evaluateCondition({ questionId: 'notes', operator: 'isEmpty' }, { notes: '' }),
      true
    );
    assert.equal(
      evaluateCondition({ questionId: 'notes', operator: 'isNotEmpty' }, { notes: 'hello' }),
      true
    );
  });

  it('evaluates compound conditions (all, any, not)', () => {
    const compoundAll = {
      all: [
        { questionId: 'age', operator: 'greaterThanOrEqual' as const, value: 21 },
        { questionId: 'hasLicense', operator: 'equals' as const, value: true },
      ],
    };
    assert.equal(evaluateCondition(compoundAll, { age: 25, hasLicense: true }), true);
    assert.equal(evaluateCondition(compoundAll, { age: 19, hasLicense: true }), false);

    const compoundAny = {
      any: [
        { questionId: 'memberType', operator: 'equals' as const, value: 'gold' },
        { questionId: 'memberType', operator: 'equals' as const, value: 'platinum' },
      ],
    };
    assert.equal(evaluateCondition(compoundAny, { memberType: 'platinum' }), true);
    assert.equal(evaluateCondition(compoundAny, { memberType: 'bronze' }), false);

    const compoundNot = {
      not: { questionId: 'blacklisted', operator: 'equals' as const, value: true },
    };
    assert.equal(evaluateCondition(compoundNot, { blacklisted: false }), true);
    assert.equal(evaluateCondition(compoundNot, { blacklisted: true }), false);
  });
});

describe('Validation Engine', () => {
  it('validates required fields', () => {
    const question = {
      id: 'name',
      type: 'text' as const,
      label: 'Full Name',
      required: true,
    };

    assert.equal(validateQuestion(question, '').isValid, false);
    assert.equal(validateQuestion(question, '   ').isValid, false);
    assert.equal(validateQuestion(question, 'Jane Doe').isValid, true);
  });

  it('validates minLength and maxLength', () => {
    const question = {
      id: 'code',
      type: 'text' as const,
      label: 'Security Code',
      validation: [
        { type: 'minLength' as const, value: 4, message: 'Too short' },
        { type: 'maxLength' as const, value: 6, message: 'Too long' },
      ],
    };

    assert.equal(validateQuestion(question, '12').isValid, false);
    assert.equal(validateQuestion(question, '12345').isValid, true);
    assert.equal(validateQuestion(question, '1234567').isValid, false);
  });

  it('validates email addresses', () => {
    const question = {
      id: 'email',
      type: 'email' as const,
      label: 'Work Email',
      validation: [{ type: 'email' as const, message: 'Invalid email' }],
    };

    assert.equal(validateQuestion(question, 'plainaddress').isValid, false);
    assert.equal(validateQuestion(question, 'user@example.com').isValid, true);
  });

  it('validates numeric min and max', () => {
    const question = {
      id: 'years',
      type: 'number' as const,
      label: 'Experience',
      validation: [
        { type: 'min' as const, value: 1, message: 'At least 1 year' },
        { type: 'max' as const, value: 50, message: 'Cannot exceed 50' },
      ],
    };

    assert.equal(validateQuestion(question, 0).isValid, false);
    assert.equal(validateQuestion(question, 5).isValid, true);
    assert.equal(validateQuestion(question, 55).isValid, false);
  });

  it('validates custom validator rules', () => {
    const question = {
      id: 'evenNumber',
      type: 'number' as const,
      label: 'Even Number',
      validation: [
        {
          type: 'custom' as const,
          message: 'Must be even',
          customValidator: (v: unknown) => Number(v) % 2 === 0,
        },
      ],
    };

    assert.equal(validateQuestion(question, 3).isValid, false);
    assert.equal(validateQuestion(question, 4).isValid, true);
  });
});

describe('Question Resolver & Flow', () => {
  const sampleForm: FormDefinition = {
    id: 'test-flow',
    version: 1,
    title: 'Flow Test',
    status: 'PUBLISHED',
    questions: [
      {
        id: 'user_type',
        type: 'singleSelect',
        label: 'Type',
        options: [
          { value: 'individual', label: 'Individual' },
          { value: 'business', label: 'Business' },
        ],
      },
      {
        id: 'company_name',
        type: 'text',
        label: 'Company Name',
        visibility: { questionId: 'user_type', operator: 'equals', value: 'business' },
      },
      {
        id: 'company_size',
        type: 'number',
        label: 'Employees',
        visibility: { questionId: 'user_type', operator: 'equals', value: 'business' },
      },
      {
        id: 'email',
        type: 'email',
        label: 'Contact Email',
      },
    ],
  };

  it('filters active questions based on condition', () => {
    const activeIndividual = getActiveQuestions(sampleForm, { user_type: 'individual' });
    assert.deepEqual(activeIndividual.map((q) => q.id), ['user_type', 'email']);

    const activeBusiness = getActiveQuestions(sampleForm, { user_type: 'business' });
    assert.deepEqual(activeBusiness.map((q) => q.id), ['user_type', 'company_name', 'company_size', 'email']);
  });

  it('resolves next question properly skipping inactive questions', () => {
    const nextForInd = resolveNextQuestion({
      form: sampleForm,
      currentQuestionId: 'user_type',
      answers: { user_type: 'individual' },
    });
    assert.equal(nextForInd?.id, 'email');

    const nextForBiz = resolveNextQuestion({
      form: sampleForm,
      currentQuestionId: 'user_type',
      answers: { user_type: 'business' },
    });
    assert.equal(nextForBiz?.id, 'company_name');

    const afterLast = resolveNextQuestion({
      form: sampleForm,
      currentQuestionId: 'email',
      answers: { user_type: 'individual' },
    });
    assert.equal(afterLast, null);
  });

  it('resolves previous question properly in active path', () => {
    const prevFromEmail = resolvePreviousQuestion({
      form: sampleForm,
      currentQuestionId: 'email',
      answers: { user_type: 'individual' },
    });
    assert.equal(prevFromEmail?.id, 'user_type');

    const prevFromEmailBiz = resolvePreviousQuestion({
      form: sampleForm,
      currentQuestionId: 'email',
      answers: { user_type: 'business' },
    });
    assert.equal(prevFromEmailBiz?.id, 'company_size');
  });
});

describe('Progress Calculator', () => {
  const branchingForm: FormDefinition = {
    id: 'branching-progress',
    version: 1,
    title: 'Progress Test',
    status: 'PUBLISHED',
    questions: [
      { id: 'q1', type: 'singleSelect', label: 'Q1' },
      { id: 'q2_branch', type: 'text', label: 'Q2', visibility: { questionId: 'q1', operator: 'equals', value: 'yes' } },
      { id: 'q3_branch', type: 'text', label: 'Q3', visibility: { questionId: 'q1', operator: 'equals', value: 'yes' } },
      { id: 'q4_branch', type: 'text', label: 'Q4', visibility: { questionId: 'q1', operator: 'equals', value: 'yes' } },
      { id: 'q5_common', type: 'text', label: 'Q5' },
    ],
  };

  it('calculates progress based on active question count, NOT total configured count', () => {
    const progressNo = calculateProgress(branchingForm, { q1: 'no' }, 'q1');
    assert.equal(progressNo.totalActiveCount, 2);
    assert.equal(progressNo.completedCount, 1);
    assert.equal(progressNo.percentage, 50);

    const progressYes = calculateProgress(branchingForm, { q1: 'yes' }, 'q1');
    assert.equal(progressYes.totalActiveCount, 5);
    assert.equal(progressYes.completedCount, 1);
    assert.equal(progressYes.percentage, 20);
  });
});

describe('Stale Answer Cleaner', () => {
  const form: FormDefinition = {
    id: 'stale-test',
    version: 1,
    title: 'Stale Cleaner Test',
    status: 'PUBLISHED',
    questions: [
      { id: 'customer_type', type: 'singleSelect', label: 'Type' },
      {
        id: 'company_name',
        type: 'text',
        label: 'Company',
        visibility: { questionId: 'customer_type', operator: 'equals', value: 'business' },
      },
      {
        id: 'tax_id',
        type: 'text',
        label: 'Tax ID',
        visibility: { questionId: 'customer_type', operator: 'equals', value: 'business' },
      },
      { id: 'email', type: 'email', label: 'Email' },
    ],
  };

  it('removes stale answers when upstream answer switches branch', () => {
    const initialAnswers = {
      customer_type: 'individual',
      company_name: 'Acme Corp',
      tax_id: '12-3456789',
      email: 'user@example.com',
    };

    const { cleanedAnswers, removedQuestionIds } = cleanupStaleAnswers(form, initialAnswers);

    assert.deepEqual(removedQuestionIds.sort(), ['company_name', 'tax_id'].sort());
    assert.equal(cleanedAnswers.company_name, undefined);
    assert.equal(cleanedAnswers.tax_id, undefined);
    assert.equal(cleanedAnswers.customer_type, 'individual');
    assert.equal(cleanedAnswers.email, 'user@example.com');
  });
});

describe('Configuration Validator', () => {
  it('accepts valid form configuration', () => {
    const validForm: FormDefinition = {
      id: 'valid-form',
      version: 1,
      title: 'Valid Form',
      status: 'PUBLISHED',
      questions: [
        { id: 'q1', type: 'text', label: 'Question 1' },
        { id: 'q2', type: 'singleSelect', label: 'Question 2', options: [{ value: 'a', label: 'A' }] },
      ],
    };

    const result = validateFormDefinition(validForm);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });

  it('detects duplicate question IDs', () => {
    const duplicateIdForm: FormDefinition = {
      id: 'duplicate-id-form',
      version: 1,
      title: 'Invalid',
      status: 'DRAFT',
      questions: [
        { id: 'q1', type: 'text', label: 'Q1' },
        { id: 'q1', type: 'text', label: 'Q1 duplicate' },
      ],
    };

    const result = validateFormDefinition(duplicateIdForm);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /Duplicate question ID/);
  });

  it('detects non-existent condition references', () => {
    const badRefForm: FormDefinition = {
      id: 'bad-ref',
      version: 1,
      title: 'Bad Reference',
      status: 'DRAFT',
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Q1',
          visibility: { questionId: 'non_existent_id', operator: 'equals', value: 'yes' },
        },
      ],
    };

    const result = validateFormDefinition(badRefForm);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /references non-existent question/);
  });

  it('detects self-referencing visibility conditions', () => {
    const selfRefForm: FormDefinition = {
      id: 'self-ref',
      version: 1,
      title: 'Self Reference',
      status: 'DRAFT',
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Q1',
          visibility: { questionId: 'q1', operator: 'equals', value: 'yes' },
        },
      ],
    };

    const result = validateFormDefinition(selfRefForm);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /references itself/);
  });

  it('validates production forms without error', async () => {
    const { customerOnboardingForm } = await import('../forms/definitions/customerOnboarding.ts');
    const { employeeOnboardingV1Form } = await import('../forms/definitions/employeeOnboardingV1.ts');
    const { employeeOnboardingV2Form } = await import('../forms/definitions/employeeOnboardingV2.ts');

    const { plantationSurveyForm } = await import('../forms/definitions/plantationSurvey.ts');

    const resSurvey = validateFormDefinition(plantationSurveyForm);
    assert.equal(resSurvey.isValid, true, `Plantation survey validation errors: ${resSurvey.errors.join(', ')}`);

    const res1 = validateFormDefinition(customerOnboardingForm);
    assert.equal(res1.isValid, true, `Customer onboarding validation errors: ${res1.errors.join(', ')}`);

    const res2 = validateFormDefinition(employeeOnboardingV1Form);
    assert.equal(res2.isValid, true, `Employee onboarding v1 validation errors: ${res2.errors.join(', ')}`);

    const res3 = validateFormDefinition(employeeOnboardingV2Form);
    assert.equal(res3.isValid, true, `Employee onboarding v2 validation errors: ${res3.errors.join(', ')}`);
  });

  it('validates tree count comparison rules in plantation survey', async () => {
    const { plantationSurveyForm } = await import('../forms/definitions/plantationSurvey.ts');
    const tappedQ = plantationSurveyForm.questions.find((q) => q.id === 'tapped_trees')!;

    // Valid: 80 tapped <= 100 total
    const validRes = validateQuestion(tappedQ, 80, { total_trees: 100 });
    assert.equal(validRes.isValid, true);

    // Invalid: 120 tapped > 100 total
    const invalidRes = validateQuestion(tappedQ, 120, { total_trees: 100 });
    assert.equal(invalidRes.isValid, false);
    assert.match(invalidRes.errors[0].message, /cannot exceed total trees/);
  });
});
