import type { FormDefinition } from '../../types/form.types.ts';

/**
 * Version 2 of Employee Onboarding Form.
 * Demonstrates backwards-compatible evolution of forms:
 * Adds remote work setup and IT hardware provisioning questions.
 */
export const employeeOnboardingV2Form: FormDefinition = {
  id: 'employee-onboarding',
  version: 2,
  title: 'Employee Onboarding (v2)',
  description: 'Updated employee intake questionnaire with equipment & remote work provisioning.',
  status: 'PUBLISHED',
  excelMapping: {
    employee_name: 'Employee Name',
    employment_type: 'Employment Type',
    contract_end_date: 'Contract End Date',
    university: 'University / College',
    department: 'Assigned Department',
    work_location: 'Work Location Mode',
    hardware_choice: 'Hardware Provisioning',
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
    // New questions added in v2:
    {
      id: 'work_location',
      type: 'singleSelect',
      label: 'What is your expected work arrangement?',
      required: true,
      options: [
        { value: 'remote', label: '100% Fully Remote' },
        { value: 'hybrid', label: 'Hybrid (2+ days in office)' },
        { value: 'on_site', label: 'On-site Office' },
      ],
    },
    {
      id: 'hardware_choice',
      type: 'singleSelect',
      label: 'What hardware workstation would you like IT to configure?',
      required: true,
      options: [
        { value: 'macbook_pro', label: 'Apple MacBook Pro M3 (36GB RAM)' },
        { value: 'thinkpad', label: 'Lenovo ThinkPad X1 Carbon (32GB RAM)' },
        { value: 'linux_workstation', label: 'Dell Precision Linux Workstation (64GB RAM)' },
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

