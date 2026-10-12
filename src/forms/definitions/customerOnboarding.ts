import type { FormDefinition } from '../../types/form.types.ts';

export const customerOnboardingForm: FormDefinition = {
  id: 'customer-onboarding',
  version: 1,
  title: 'Customer Onboarding Application',
  description: 'Welcome! Please answer a few questions so we can configure your account.',
  status: 'PUBLISHED',
  excelMapping: {
    customer_type: 'Customer Type',
    personal_full_name: 'Full Name',
    date_of_birth: 'Date of Birth',
    employment_status: 'Employment Status',
    company_legal_name: 'Company Legal Name',
    business_size: 'Business Size',
    tax_id: 'Tax / EIN Number',
    industry: 'Industry',
    contact_email: 'Contact Email',
    subscribed_features: 'Subscribed Features',
    accept_terms: 'Accepted Terms',
    notes: 'Additional Notes',
  },
  questions: [
    {
      id: 'customer_type',
      type: 'singleSelect',
      label: 'Are you registering as an Individual or a Business?',
      description: 'Select your legal entity classification to personalize your onboarding flow.',
      required: true,
      options: [
        {
          value: 'individual',
          label: 'Individual / Personal',
          description: 'Single user account for personal projects or freelancing.',
        },
        {
          value: 'business',
          label: 'Business / Company',
          description: 'Team account with multi-seat collaboration and business billing.',
        },
      ],
    },

    // --- Branch A: Individual Questions ---
    {
      id: 'personal_full_name',
      type: 'text',
      label: 'What is your legal full name?',
      placeholder: 'e.g. Jane Austen',
      required: true,
      validation: [
        {
          type: 'minLength',
          value: 3,
          message: 'Full name must be at least 3 characters.',
        },
      ],
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'individual',
      },
    },
    {
      id: 'date_of_birth',
      type: 'date',
      label: 'Date of Birth',
      description: 'Used for identity verification requirements.',
      required: true,
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'individual',
      },
    },
    {
      id: 'employment_status',
      type: 'singleSelect',
      label: 'What is your current employment status?',
      options: [
        { value: 'employed', label: 'Employed Full-time' },
        { value: 'self_employed', label: 'Self-employed / Freelancer' },
        { value: 'student', label: 'Student' },
        { value: 'retired', label: 'Retired' },
      ],
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'individual',
      },
    },

    // --- Branch B: Business Questions ---
    {
      id: 'company_legal_name',
      type: 'text',
      label: 'What is your registered company name?',
      placeholder: 'e.g. Acme Corporation, Inc.',
      required: true,
      validation: [
        {
          type: 'minLength',
          value: 2,
          message: 'Company name must have at least 2 characters.',
        },
      ],
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'business',
      },
    },
    {
      id: 'business_size',
      type: 'dropdown',
      label: 'How many employees work at your organization?',
      required: true,
      options: [
        { value: '1-10', label: '1 - 10 employees (Startup)' },
        { value: '11-50', label: '11 - 50 employees (Growing)' },
        { value: '51-200', label: '51 - 200 employees (Mid-Market)' },
        { value: '201+', label: '201+ employees (Enterprise)' },
      ],
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'business',
      },
    },
    {
      id: 'tax_id',
      type: 'text',
      label: 'What is your Business Tax / EIN / Registration Number?',
      placeholder: 'e.g. 12-3456789',
      required: true,
      validation: [
        {
          type: 'minLength',
          value: 5,
          message: 'Tax registration number must be at least 5 characters.',
        },
      ],
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'business',
      },
    },
    {
      id: 'industry',
      type: 'singleSelect',
      label: 'Which primary industry best describes your business?',
      options: [
        { value: 'technology', label: 'Technology & Software' },
        { value: 'finance', label: 'Banking & Financial Services' },
        { value: 'healthcare', label: 'Healthcare & Life Sciences' },
        { value: 'retail', label: 'E-commerce & Retail' },
        { value: 'other', label: 'Other Industry' },
      ],
      visibility: {
        questionId: 'customer_type',
        operator: 'equals',
        value: 'business',
      },
    },

    // --- Shared Convergence Questions ---
    {
      id: 'contact_email',
      type: 'email',
      label: 'What is your primary contact email address?',
      placeholder: 'alex@example.com',
      required: true,
      validation: [
        {
          type: 'email',
          message: 'Please enter a valid email address with @ and domain.',
        },
      ],
    },
    {
      id: 'subscribed_features',
      type: 'multiSelect',
      label: 'Which capabilities are you interested in enabling?',
      description: 'You can check multiple options that fit your project roadmap.',
      options: [
        {
          value: 'analytics',
          label: 'Real-time Analytics Dashboard',
          description: 'Visualize customer metrics and live conversion funnels.',
        },
        {
          value: 'api_access',
          label: 'REST & GraphQL API Access',
          description: 'Direct programmatic synchronization with your own backend.',
        },
        {
          value: 'custom_domain',
          label: 'Custom Domain & SSL',
          description: 'Host forms and landing pages on your company URL.',
        },
        {
          value: 'priority_support',
          label: '24/7 Dedicated Priority Support',
          description: 'Guaranteed 1-hour SLA with dedicated solutions architects.',
        },
      ],
    },
    {
      id: 'accept_terms',
      type: 'boolean',
      label: 'Do you agree to the Terms of Service & Privacy Policy?',
      description: 'You must review and agree before activating your account.',
      required: true,
      validation: [
        {
          type: 'custom',
          message: 'You must accept the terms of service to proceed.',
          customValidator: (v) => v === true,
        },
      ],
    },
    {
      id: 'notes',
      type: 'textarea',
      label: 'Any additional comments or custom requirements?',
      placeholder: 'Let our engineering team know if you have specific migration needs...',
      required: false,
    },
  ],
};

