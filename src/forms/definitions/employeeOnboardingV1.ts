import type { FormDefinition } from '../../types/form.types.ts';

export const employeeOnboardingV1Form: FormDefinition = {
  id: 'employee-onboarding',
  version: 1,
  title: 'Employee Onboarding (v1)',
  description: 'Internal personnel onboarding questionnaire.',
  status: 'PUBLISHED',
  excelMapping: {
    employee_name: 'Employee Name',
    employment_type: 'Employment Type',
    contract_end_date: 'Contract End Date',
    university: 'University / College',
    department: 'Assigned Department',
    emergency_contact: 'Emergency Email',
  },
  questions: [
    {
      id: 'employee_name',
      type: 'text',
      label: 'What is your legal full name?',
      placeholder: 'First and last name',
      required: true,
      validation: [
        {
          type: 'minLength',
          value: 2,
          message: 'Name must be at least 2 characters.',
        },
      ],
    },
    {
      id: 'employment_type',
      type: 'singleSelect',
      label: 'What is your employment arrangement?',
      required: true,
      options: [
        { value: 'full_time', label: 'Full-time Employee' },
        { value: 'contractor', label: 'Contractor / Fixed-Term' },
        { value: 'intern', label: 'University Intern' },
      ],
    },
    {
      id: 'contract_end_date',
      type: 'date',
      label: 'When does your current contract conclude?',
      description: 'Required for contractor compliance tracking.',
      required: true,
      visibility: {
        questionId: 'employment_type',
        operator: 'equals',
        value: 'contractor',
      },
    },
    {
      id: 'university',
      type: 'text',
      label: 'Which university or college are you currently attending?',
      placeholder: 'e.g. Stanford University',
      required: true,
      visibility: {
        questionId: 'employment_type',
        operator: 'equals',
        value: 'intern',
      },
    },
    {
      id: 'department',
      type: 'dropdown',
      label: 'Which team will you be joining?',
      required: true,
      options: [
        { value: 'engineering', label: 'Core Engineering' },
        { value: 'product', label: 'Product & Design' },
        { value: 'sales', label: 'Sales & Growth' },
        { value: 'support', label: 'Customer Success' },
      ],
    },
    {
      id: 'emergency_contact',
      type: 'email',
      label: 'What is your emergency contact email?',
      required: true,
      validation: [
        {
          type: 'email',
          message: 'Please provide a valid emergency contact email.',
        },
      ],
    },
  ],
};

