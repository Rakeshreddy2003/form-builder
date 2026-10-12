import type { FormDefinition } from '../../types/form.types.ts';
import {
  plantationSurveyForm,
  customerOnboardingForm,
  employeeOnboardingV1Form,
  employeeOnboardingV2Form,
} from '../../forms/definitions/index.ts';
import { generateUniqueId } from '../../utils/ids.ts';

const CUSTOM_FORMS_STORAGE_KEY = 'rk_custom_form_definitions';

export class FormStore {
  private builtInForms: Map<string, FormDefinition> = new Map();
  private customForms: Map<string, FormDefinition> = new Map();

  constructor() {
    this.registerBuiltIn(plantationSurveyForm);
    this.registerBuiltIn(customerOnboardingForm);
    this.registerBuiltIn(employeeOnboardingV1Form);
    this.registerBuiltIn(employeeOnboardingV2Form);
    this.hydrateCustomForms();
  }

  private registerBuiltIn(form: FormDefinition): void {
    this.builtInForms.set(`${form.id}-v${form.version}`, form);
  }

  private hydrateCustomForms(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(CUSTOM_FORMS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as FormDefinition[];
        for (const form of parsed) {
          this.customForms.set(`${form.id}-v${form.version}`, form);
        }
      }
    } catch {
      // storage unavailable
    }
  }

  private persistCustomForms(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const all = Array.from(this.customForms.values());
      localStorage.setItem(CUSTOM_FORMS_STORAGE_KEY, JSON.stringify(all));
    } catch {
      // storage error
    }
  }

  getAllForms(): FormDefinition[] {
    const list: FormDefinition[] = [];
    // Custom forms take precedence if overridden
    for (const [key, form] of this.builtInForms.entries()) {
      if (this.customForms.has(key)) {
        list.push(this.customForms.get(key)!);
      } else {
        list.push(form);
      }
    }
    for (const [key, form] of this.customForms.entries()) {
      if (!this.builtInForms.has(key)) {
        list.push(form);
      }
    }
    return list;
  }

  getForm(id: string, version?: number): FormDefinition | null {
    if (version !== undefined) {
      const key = `${id}-v${version}`;
      return this.customForms.get(key) || this.builtInForms.get(key) || null;
    }
    // Return latest version
    const all = this.getAllForms().filter((f) => f.id === id);
    if (all.length === 0) return null;
    all.sort((a, b) => b.version - a.version);
    return all[0];
  }

  saveForm(form: FormDefinition): FormDefinition {
    const cloned = JSON.parse(JSON.stringify(form)) as FormDefinition;
    const key = `${cloned.id}-v${cloned.version}`;
    this.customForms.set(key, cloned);
    this.persistCustomForms();
    return cloned;
  }

  deleteForm(id: string, version?: number): boolean {
    if (version !== undefined) {
      const key = `${id}-v${version}`;
      const deleted = this.customForms.delete(key);
      if (deleted) this.persistCustomForms();
      return deleted;
    }
    let anyDeleted = false;
    for (const key of Array.from(this.customForms.keys())) {
      if (key.startsWith(`${id}-v`)) {
        this.customForms.delete(key);
        anyDeleted = true;
      }
    }
    if (anyDeleted) this.persistCustomForms();
    return anyDeleted;
  }

  createNewDraftForm(): FormDefinition {
    const newId = `survey_${generateUniqueId('form')}`;
    return {
      id: newId,
      version: 1,
      title: 'Untitled Survey',
      description: 'Describe the purpose of this questionnaire...',
      status: 'DRAFT',
      questions: [],
    };
  }
}

export const defaultFormStore = new FormStore();

