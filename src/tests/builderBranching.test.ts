import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { FormDefinition } from '../types/form.types.ts';
import {
  resolveNextQuestion,
  resolvePreviousQuestion,
  getActiveQuestions,
} from '../forms/engine/questionResolver.ts';
import { calculateProgress } from '../forms/engine/progressCalculator.ts';
import { cleanupStaleAnswers } from '../forms/engine/staleAnswerHandler.ts';
import { validateFormDefinition, MAX_FORM_QUESTIONS } from '../forms/engine/configValidator.ts';

// Test form matching Section 33 Chained Branching Specification
const testBranchingForm: FormDefinition = {
  id: 'survey_branching_test',
  version: 1,
  title: 'Professional Background Survey',
  description: 'Test chained branching, rejoining, and end-survey routes.',
  status: 'PUBLISHED',
  questions: [
    // Q1
    {
      id: 'q_profession',
      type: 'singleSelect',
      label: 'What is your profession?',
      required: true,
      options: [
        { value: 'doctor', label: 'Doctor' },
        { value: 'engineer', label: 'Engineer' },
        { value: 'lawyer', label: 'Lawyer' },
        { value: 'retired', label: 'Retired (End Survey)' },
      ],
      next: [
        {
          when: { questionId: 'q_profession', operator: 'equals', value: 'doctor' },
          targetQuestionId: 'q_doc_specialty',
        },
        {
          when: { questionId: 'q_profession', operator: 'equals', value: 'engineer' },
          targetQuestionId: 'q_eng_exp',
        },
        {
          when: { questionId: 'q_profession', operator: 'equals', value: 'lawyer' },
          targetQuestionId: 'q_law_practice',
        },
        {
          when: { questionId: 'q_profession', operator: 'equals', value: 'retired' },
          targetQuestionId: null, // End Survey
        },
      ],
    },

    // Q2 - Doctor Path
    {
      id: 'q_doc_specialty',
      type: 'singleSelect',
      label: 'What is your medical specialty?',
      required: true,
      options: [
        { value: 'cardiologist', label: 'Cardiologist' },
        { value: 'neurologist', label: 'Neurologist' },
      ],
      visibility: { questionId: 'q_profession', operator: 'equals', value: 'doctor' },
      next: [
        {
          when: { questionId: 'q_doc_specialty', operator: 'equals', value: 'cardiologist' },
          targetQuestionId: 'q_cardio_fellowship',
        },
        {
          when: { questionId: 'q_doc_specialty', operator: 'equals', value: 'neurologist' },
          targetQuestionId: 'q_neuro_research',
        },
      ],
    },

    // Q3A - Doctor Cardiologist sub-branch
    {
      id: 'q_cardio_fellowship',
      type: 'text',
      label: 'Where did you complete your cardiology fellowship?',
      required: true,
      visibility: {
        all: [
          { questionId: 'q_profession', operator: 'equals', value: 'doctor' },
          { questionId: 'q_doc_specialty', operator: 'equals', value: 'cardiologist' },
        ],
      },
      next: [
        // Rejoin at Q4 Final Remarks
        { targetQuestionId: 'q_final_remarks' },
      ],
    },

    // Q3B - Doctor Neurologist sub-branch
    {
      id: 'q_neuro_research',
      type: 'text',
      label: 'What is your current neurology research area?',
      required: true,
      visibility: {
        all: [
          { questionId: 'q_profession', operator: 'equals', value: 'doctor' },
          { questionId: 'q_doc_specialty', operator: 'equals', value: 'neurologist' },
        ],
      },
      next: [
        // Rejoin at Q4 Final Remarks
        { targetQuestionId: 'q_final_remarks' },
      ],
    },

    // Q2 - Engineer Path
    {
      id: 'q_eng_exp',
      type: 'singleSelect',
      label: 'How many years of engineering experience do you have?',
      required: true,
      options: [
        { value: 'junior', label: '1 - 3 years' },
        { value: 'senior', label: '4+ years' },
      ],
      visibility: { questionId: 'q_profession', operator: 'equals', value: 'engineer' },
      next: [
        // Rejoin at Q4 Final Remarks
        { targetQuestionId: 'q_final_remarks' },
      ],
    },

    // Q2 - Lawyer Path
    {
      id: 'q_law_practice',
      type: 'singleSelect',
      label: 'Which type of law do you practice?',
      required: true,
      options: [
        { value: 'corporate', label: 'Corporate' },
        { value: 'criminal', label: 'Criminal' },
      ],
      visibility: { questionId: 'q_profession', operator: 'equals', value: 'lawyer' },
      next: [
        // Rejoin at Q4 Final Remarks
        { targetQuestionId: 'q_final_remarks' },
      ],
    },

    // Q4 - Rejoined Shared Final Question
    {
      id: 'q_final_remarks',
      type: 'textarea',
      label: 'Any final remarks or questions?',
      required: false,
    },
  ],
};

describe('Builder Chained Branching & Graph Flow (Section 33)', () => {
  it('validates the configuration passes graph and destination checks', () => {
    const result = validateFormDefinition(testBranchingForm);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('routes Doctor selection to Q2 Doctor Specialty', () => {
    const nextQ = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_profession',
      answers: { q_profession: 'doctor' },
    });
    assert.ok(nextQ);
    assert.strictEqual(nextQ.id, 'q_doc_specialty');
  });

  it('routes Cardiologist selection to Q3A Cardiology Fellowship', () => {
    const nextQ = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_doc_specialty',
      answers: {
        q_profession: 'doctor',
        q_doc_specialty: 'cardiologist',
      },
    });
    assert.ok(nextQ);
    assert.strictEqual(nextQ.id, 'q_cardio_fellowship');
  });

  it('routes Neurologist selection to Q3B Neurology Research', () => {
    const nextQ = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_doc_specialty',
      answers: {
        q_profession: 'doctor',
        q_doc_specialty: 'neurologist',
      },
    });
    assert.ok(nextQ);
    assert.strictEqual(nextQ.id, 'q_neuro_research');
  });

  it('routes Engineer selection to Q2 Engineering Experience', () => {
    const nextQ = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_profession',
      answers: { q_profession: 'engineer' },
    });
    assert.ok(nextQ);
    assert.strictEqual(nextQ.id, 'q_eng_exp');
  });

  it('routes Lawyer selection to Q2 Legal Practice', () => {
    const nextQ = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_profession',
      answers: { q_profession: 'lawyer' },
    });
    assert.ok(nextQ);
    assert.strictEqual(nextQ.id, 'q_law_practice');
  });

  it('rejoins separate branches at Q4 Final Remarks', () => {
    // From Cardiologist fellowship -> rejoins at Q4
    const fromCardio = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_cardio_fellowship',
      answers: {
        q_profession: 'doctor',
        q_doc_specialty: 'cardiologist',
        q_cardio_fellowship: 'Stanford Medical Center',
      },
    });
    assert.ok(fromCardio);
    assert.strictEqual(fromCardio.id, 'q_final_remarks');

    // From Engineer experience -> rejoins at Q4
    const fromEng = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_eng_exp',
      answers: {
        q_profession: 'engineer',
        q_eng_exp: 'senior',
      },
    });
    assert.ok(fromEng);
    assert.strictEqual(fromEng.id, 'q_final_remarks');

    // From Lawyer practice -> rejoins at Q4
    const fromLaw = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_law_practice',
      answers: {
        q_profession: 'lawyer',
        q_law_practice: 'corporate',
      },
    });
    assert.ok(fromLaw);
    assert.strictEqual(fromLaw.id, 'q_final_remarks');
  });

  it('routes Retired option directly to End Survey (null)', () => {
    const nextQ = resolveNextQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_profession',
      answers: { q_profession: 'retired' },
    });
    // targetQuestionId: null signals terminal end of survey
    assert.strictEqual(nextQ, null);
  });

  it('supports Previous navigation backwards along visited path', () => {
    const prevQ = resolvePreviousQuestion({
      form: testBranchingForm,
      currentQuestionId: 'q_cardio_fellowship',
      answers: {
        q_profession: 'doctor',
        q_doc_specialty: 'cardiologist',
      },
      visitedHistory: ['q_profession', 'q_doc_specialty', 'q_cardio_fellowship'],
    });
    assert.ok(prevQ);
    assert.strictEqual(prevQ.id, 'q_doc_specialty');
  });

  it('stale answer cleanup removes inactive downstream branch answers when Q1 changes', () => {
    const doctorAnswers = {
      q_profession: 'doctor',
      q_doc_specialty: 'cardiologist',
      q_cardio_fellowship: 'Johns Hopkins',
    };

    // User navigates back to Q1 and switches profession from 'doctor' to 'engineer'
    const changedAnswers = {
      ...doctorAnswers,
      q_profession: 'engineer',
    };

    const { cleanedAnswers, removedQuestionIds } = cleanupStaleAnswers(testBranchingForm, changedAnswers);

    // Doctor-specific answers should be purged
    assert.deepStrictEqual(removedQuestionIds.sort(), ['q_cardio_fellowship', 'q_doc_specialty'].sort());
    assert.strictEqual(cleanedAnswers.q_profession, 'engineer');
    assert.strictEqual(cleanedAnswers.q_doc_specialty, undefined);
    assert.strictEqual(cleanedAnswers.q_cardio_fellowship, undefined);
  });

  it('calculates progress accurately according to active questions along current branch', () => {
    const activeDoctorQuestions = getActiveQuestions(testBranchingForm, {
      q_profession: 'doctor',
      q_doc_specialty: 'cardiologist',
    });
    // Active: q_profession, q_doc_specialty, q_cardio_fellowship, q_final_remarks = 4 questions
    assert.strictEqual(activeDoctorQuestions.length, 4);

    const progAtStart = calculateProgress(testBranchingForm, {}, 'q_profession', false);
    // At first question with no answers yet
    assert.strictEqual(progAtStart.currentStep, 1);
    assert.strictEqual(progAtStart.percentage, 0);

    const progAtCardio = calculateProgress(
      testBranchingForm,
      { q_profession: 'doctor', q_doc_specialty: 'cardiologist' },
      'q_cardio_fellowship',
      false
    );
    // 2 answered out of 4 active: 50%
    assert.strictEqual(progAtCardio.percentage, 50);
    assert.strictEqual(progAtCardio.currentStep, 3);
  });

  it('strictly enforces the MAX_FORM_QUESTIONS (15) limit in configuration validator', () => {
    // Generate a form with 16 questions
    const oversizedQuestions = Array.from({ length: 16 }, (_, i) => ({
      id: `q_item_${i + 1}`,
      type: 'text' as const,
      label: `Question ${i + 1}`,
    }));

    const oversizedForm: FormDefinition = {
      id: 'oversized_survey',
      version: 1,
      title: 'Oversized Survey',
      status: 'PUBLISHED',
      questions: oversizedQuestions,
    };

    const result = validateFormDefinition(oversizedForm, { maxQuestions: MAX_FORM_QUESTIONS });
    assert.strictEqual(result.isValid, false);
    assert.ok(
      result.errors.some((err) =>
        err.includes(`exceeds the maximum allowed limit of ${MAX_FORM_QUESTIONS}`)
      )
    );
  });
});
