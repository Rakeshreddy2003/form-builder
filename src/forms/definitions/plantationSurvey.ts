import type { FormDefinition } from '../../types/form.types.ts';

export const plantationSurveyForm: FormDefinition = {
  id: 'plantation-survey',
  version: 1,
  title: 'Toddy Palm Plantation Field Survey',
  description: 'Agricultural field assessment on palm cultivation, tapping workforce, safety gear, yield economics, and welfare policies.',
  status: 'PUBLISHED',
  excelMapping: {
    district_mandal: 'District & Mandal',
    years_running: 'Years in Operation',
    land_ownership: 'Land Ownership Type',
    plantation_size: 'Plantation Size',
    palm_types: 'Palm Varieties Tapped',
    palm_types_other_specify: 'Other Palm Varieties',
    total_trees: 'Total Trees Count',
    tapped_trees: 'Tapped Trees Count',
    peak_daily_yield: 'Peak Daily Yield',
    skilled_tappers_count: 'Number of Tappers',
    tapper_payment_model: 'Tapper Payment Model',
    safety_equipment: 'Safety Equipment & Aid',
    main_product_sold: 'Main Product Sold',
    primary_buyer: 'Primary Buyer / Channel',
    license_ease: 'Excise License Ease',
    welfare_benefits: 'Government Welfare Received',
    biggest_danger: 'Primary Business Threat',
    biggest_policy_need: '5-Year Policy Need',
  },
  questions: [
    // =========================================================================
    // SECTION A — BASIC DETAILS & PLANTATION SIZE
    // =========================================================================
    {
      id: 'district_mandal',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'text',
      label: 'Which District and Mandal is this plantation located in?',
      placeholder: 'e.g. Guntur District, Tenali Mandal',
      required: true,
      validation: [
        {
          type: 'minLength',
          value: 3,
          message: 'Please provide both District and Mandal names.',
        },
      ],
    },
    {
      id: 'years_running',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'number',
      label: 'How many years has this land been a toddy plantation?',
      placeholder: 'e.g. 15',
      required: true,
      validation: [
        {
          type: 'min',
          value: 0,
          message: 'Years running must be 0 or greater.',
        },
      ],
    },
    {
      id: 'land_ownership',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'singleSelect',
      label: 'Who owns this land?',
      required: true,
      options: [
        {
          value: 'own_patta',
          label: 'Own land (Patta)',
          description: 'Privately owned freehold land registered in farmer name.',
        },
        {
          value: 'leased',
          label: 'Leased/Rented from a landlord',
          description: 'Cultivated under periodic cash or harvest lease.',
        },
        {
          value: 'temple_govt_common',
          label: 'Temple land / Government land / Village common land',
          description: 'Endowment, poramboke, or community grama katham land.',
        },
      ],
    },
    {
      id: 'plantation_size',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'singleSelect',
      label: 'What is the total size of this plantation?',
      required: true,
      options: [
        { value: 'under_2_acres', label: 'Less than 2 acres' },
        { value: '2_to_5_acres', label: '2 to 5 acres' },
        { value: '6_to_10_acres', label: '6 to 10 acres' },
        { value: 'over_10_acres', label: 'More than 10 acres' },
      ],
    },
    {
      id: 'palm_types',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'multiSelect',
      label: 'What types of palm trees do you tap for juice/sap?',
      description: 'Select all tree varieties tapped on this land.',
      required: true,
      options: [
        {
          value: 'palmyra',
          label: 'Toddy Palm / Palmyra (Tati Chettu)',
          description: 'Native tall palmyra trees tapped seasonally.',
        },
        {
          value: 'coconut',
          label: 'Coconut Palm (Kobbari Chettu)',
          description: 'Coconut palms tapped for fresh sweet toddy/neera.',
        },
        {
          value: 'wild_date',
          label: 'Wild Date Palm (Eetha Chettu)',
          description: 'Date palms common in scrub and upland belts.',
        },
        {
          value: 'other',
          label: 'Other',
          description: 'Other local palm varieties.',
        },
      ],
    },
    {
      id: 'palm_types_other_specify',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'text',
      label: 'Please specify the other tree variety tapped for juice/sap:',
      placeholder: 'Enter other palm tree name...',
      required: true,
      visibility: {
        questionId: 'palm_types',
        operator: 'contains',
        value: 'other',
      },
      validation: [
        {
          type: 'minLength',
          value: 2,
          message: 'Please specify the tree variety.',
        },
      ],
    },
    {
      id: 'total_trees',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'number',
      label: 'How many total palm trees do you have on this plantation?',
      placeholder: 'e.g. 150',
      required: true,
      validation: [
        {
          type: 'min',
          value: 1,
          message: 'Total trees must be at least 1.',
        },
      ],
    },
    {
      id: 'tapped_trees',
      section: 'SECTION A — BASIC DETAILS & PLANTATION SIZE',
      type: 'number',
      label: 'How many trees are currently being tapped for juice/sap?',
      placeholder: 'e.g. 90',
      required: true,
      validation: [
        {
          type: 'min',
          value: 0,
          message: 'Tapped trees cannot be negative.',
        },
        {
          type: 'custom',
          message: 'Trees being tapped cannot exceed total trees on the plantation.',
          customValidator: (val, answers) => {
            const numTapped = Number(val);
            const total = Number(answers.total_trees);
            if (Number.isNaN(numTapped)) return false;
            if (Number.isNaN(total)) return true;
            return numTapped <= total;
          },
        },
      ],
    },

    // =========================================================================
    // SECTION B — DAILY WORK, LABOR & SAFETY
    // =========================================================================
    {
      id: 'peak_daily_yield',
      section: 'SECTION B — DAILY WORK, LABOR & SAFETY',
      type: 'singleSelect',
      label: 'On a good day during peak season, how many liters of juice/sap do you get from the whole plantation?',
      required: true,
      options: [
        { value: 'under_50_liters', label: 'Under 50 liters per day' },
        { value: '50_to_150_liters', label: '50 to 150 liters per day' },
        { value: '151_to_300_liters', label: '151 to 300 liters per day' },
        { value: 'over_300_liters', label: 'Over 300 liters per day' },
      ],
    },
    {
      id: 'skilled_tappers_count',
      section: 'SECTION B — DAILY WORK, LABOR & SAFETY',
      type: 'number',
      label: 'How many skilled toddy tappers (Goudas/workers) are currently working here?',
      placeholder: 'e.g. 3',
      required: true,
      validation: [
        {
          type: 'min',
          value: 0,
          message: 'Number of workers cannot be negative.',
        },
      ],
    },
    {
      id: 'tapper_payment_model',
      section: 'SECTION B — DAILY WORK, LABOR & SAFETY',
      type: 'singleSelect',
      label: 'How do you pay the tappers?',
      required: true,
      options: [
        {
          value: 'salary',
          label: 'Fixed daily or monthly salary',
          description: 'Guaranteed wage paid regardless of harvest volume.',
        },
        {
          value: 'piece_rate',
          label: 'Paid by the liter (Piece-rate)',
          description: 'Payment tied directly to liters of sap harvested.',
        },
        {
          value: 'share_cropping',
          label: 'Percentage split of the daily sales money (Share-cropping)',
          description: 'Owner and tapper split daily cash sales 50-50 or agreed ratio.',
        },
        {
          value: 'tree_rent',
          label: 'Flat rent per tree (Tapper pays rent for the tree and keeps all sales money)',
          description: 'Tapper pays seasonal rent to land/tree owner.',
        },
      ],
    },
    {
      id: 'safety_equipment',
      section: 'SECTION B — DAILY WORK, LABOR & SAFETY',
      type: 'multiSelect',
      label: 'What safety items or help do tappers have here?',
      description: "Select all applicable items. Selecting 'No safety equipment' will clear other options.",
      required: true,
      options: [
        {
          value: 'climbing_gear',
          label: 'Modern climbing gear / safety harnesses / climbing machines',
        },
        {
          value: 'accident_insurance',
          label: 'YSR Bima / Accident insurance',
        },
        {
          value: 'first_aid',
          label: 'First-aid kit or medical help for tree falls',
        },
        {
          value: 'traditional_tools',
          label: 'Traditional tools only (Moku / ropes)',
        },
        {
          value: 'no_safety',
          label: 'No safety equipment at all',
          exclusive: true,
        },
      ],
    },

    // =========================================================================
    // SECTION C — SELLING & PRODUCTS
    // =========================================================================
    {
      id: 'main_product_sold',
      section: 'SECTION C — SELLING & PRODUCTS',
      type: 'singleSelect',
      label: 'What is the main product you sell from the tree sap?',
      required: true,
      options: [
        {
          value: 'raw_toddy',
          label: 'Raw, fermented Toddy (Kallu)',
          description: 'Traditional fermented beverage consumed same day.',
        },
        {
          value: 'fresh_neera',
          label: 'Fresh, sweet Neera (Non-alcoholic)',
          description: 'Unfermented, chilled sap rich in nutrients.',
        },
        {
          value: 'palm_jaggery',
          label: 'Palm Jaggery (Bellam) / Palm Candy (Tati Kalkanda)',
          description: 'Boiled down into solid jaggery blocks or crystallized candy.',
        },
        {
          value: 'bulk_factories',
          label: 'Sold in bulk to factories/distilleries',
          description: 'Industrial off-take for distillation or processing.',
        },
      ],
    },
    {
      id: 'primary_buyer',
      section: 'SECTION C — SELLING & PRODUCTS',
      type: 'singleSelect',
      label: 'Who buys most of your product?',
      required: true,
      options: [
        {
          value: 'cooperative_tcs',
          label: 'Local Toddy Cooperative Societies (TCS) / Licensed local shops',
        },
        {
          value: 'middlemen',
          label: 'Middlemen / Private contractors',
        },
        {
          value: 'direct_sales',
          label: 'Direct sales to villagers and tourists',
        },
        {
          value: 'jaggery_units',
          label: 'Jaggery making units / commercial buyers',
        },
      ],
    },

    // =========================================================================
    // SECTION D — GOVERNMENT, RULES & HARDSHIPS
    // =========================================================================
    {
      id: 'license_ease',
      section: 'SECTION D — GOVERNMENT, RULES & HARDSHIPS',
      type: 'singleSelect',
      label: 'How easy or hard is it to get or renew tapping licenses from the Excise (Abkari) Department?',
      required: true,
      options: [
        { value: 'very_simple', label: 'Very simple and clear' },
        { value: 'manageable', label: 'A bit slow but manageable' },
        { value: 'extremely_difficult', label: 'Extremely difficult, slow, and too much paperwork' },
        { value: 'informal', label: 'We operate informally without licenses' },
      ],
    },
    {
      id: 'welfare_benefits',
      section: 'SECTION D — GOVERNMENT, RULES & HARDSHIPS',
      type: 'multiSelect',
      label: 'What government help or welfare benefits have this plantation or the tappers received?',
      description: "Select all benefits received. 'None of the above' is mutually exclusive.",
      required: true,
      options: [
        {
          value: 'climbing_kits',
          label: 'Free or cheap climbing kits / mechanical bikes',
        },
        {
          value: 'planting_grants',
          label: 'Money grants for planting new trees',
        },
        {
          value: 'welfare_pension',
          label: 'Tappers Welfare Board pensions or financial aid',
        },
        {
          value: 'jaggery_training',
          label: 'Government training to make Jaggery/Sweets',
        },
        {
          value: 'none',
          label: 'None of the above',
          exclusive: true,
        },
      ],
    },
    {
      id: 'biggest_danger',
      section: 'SECTION D — GOVERNMENT, RULES & HARDSHIPS',
      type: 'singleSelect',
      label: 'What is currently the biggest danger to the survival of your toddy business?',
      required: true,
      options: [
        {
          value: 'labor_shortage',
          label: 'No young people want to do this dangerous work anymore',
        },
        {
          value: 'climate_change',
          label: 'Climate change (Droughts, no water, or wrong rains)',
        },
        {
          value: 'tree_pests',
          label: 'Tree pests, beetles, and tree diseases',
        },
        {
          value: 'excise_laws',
          label: 'Strict excise laws, police/department harassment, or sudden bans',
        },
      ],
    },
    {
      id: 'biggest_policy_need',
      section: 'SECTION D — GOVERNMENT, RULES & HARDSHIPS',
      type: 'textarea',
      label: 'What is the single biggest help or policy change you need from the government to grow your income over the next 5 years?',
      placeholder: 'Please describe the biggest support or policy change you need...',
      required: true,
      validation: [
        {
          type: 'minLength',
          value: 10,
          message: 'Please provide at least 10 characters describing your policy need.',
        },
      ],
    },
  ],
};

