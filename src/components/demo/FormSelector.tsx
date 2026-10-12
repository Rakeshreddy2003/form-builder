import React from 'react';
import type { FormDefinition } from '../../types/form.types.ts';

export interface FormSelectorProps {
  forms: FormDefinition[];
  selectedFormId: string;
  selectedFormVersion: number;
  onSelectForm: (form: FormDefinition) => void;
}

export const FormSelector: React.FC<FormSelectorProps> = ({
  forms,
  selectedFormId,
  selectedFormVersion,
  onSelectForm,
}) => {
  return (
    <div className="rk-form-selector-bar">
      <div className="rk-selector-label-group">
        <span className="rk-selector-caption">Active Form Definition:</span>
      </div>

      <div className="rk-selector-pills">
        {forms.map((form) => {
          const isSelected = form.id === selectedFormId && form.version === selectedFormVersion;
          return (
            <button
              key={`${form.id}-v${form.version}`}
              type="button"
              className={`rk-selector-pill ${isSelected ? 'rk-selector-pill-active' : ''}`}
              onClick={() => onSelectForm(form)}
            >
              <span className="rk-pill-title">{form.title}</span>
              <span className="rk-pill-version">v{form.version}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

