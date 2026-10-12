import React, { useState } from 'react';
import {
  LuPlus,
  LuClipboardList,
  LuClipboardCheck,
  LuSquarePen,
  LuCopy,
  LuTrash2,
} from 'react-icons/lu';
import type { FormDefinition } from '../../types/form.types.ts';

export interface FormListViewProps {
  forms: FormDefinition[];
  onCreateNew: () => void;
  onEditForm: (form: FormDefinition) => void;
  onFillSurvey: (form: FormDefinition) => void;
  onDuplicateForm: (form: FormDefinition) => void;
  onDeleteForm: (formId: string) => void;
}

export const FormListView: React.FC<FormListViewProps> = ({
  forms,
  onCreateNew,
  onEditForm,
  onFillSurvey,
  onDuplicateForm,
  onDeleteForm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredForms = forms.filter((f) => {
    const matchTitle = f.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDesc = f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTitle || matchDesc;
  });

  return (
    <div className="rk-form-list-container">
      {/* List Header */}
      <div className="rk-form-list-header">
        <div>
          <h2 className="rk-list-title">Survey Forms Management</h2>
          <p className="rk-list-subtitle">
            Create, edit, branch, and deploy interactive field questionnaires.
          </p>
        </div>

        <button type="button" className="rk-btn-primary" onClick={onCreateNew}>
          <LuPlus className="rk-btn-icon-inline" />
          <span>Create New Survey</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="rk-list-search-bar">
        <input
          type="text"
          className="rk-text-input rk-search-input"
          placeholder="Search surveys by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="rk-list-total-count">
          Showing {filteredForms.length} of {forms.length} surveys
        </span>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <div className="rk-builder-empty-state">
          <div className="rk-empty-icon" aria-hidden="true">
            <LuClipboardList size={44} />
          </div>
          <h3 className="rk-empty-title">No surveys found</h3>
          <p className="rk-empty-desc">
            {searchTerm ? 'No surveys matched your search term.' : 'Get started by creating your first survey.'}
          </p>
          <button type="button" className="rk-btn-primary" onClick={onCreateNew}>
            <LuPlus className="rk-btn-icon-inline" />
            <span>Create New Survey</span>
          </button>
        </div>
      ) : (
        <div className="rk-forms-grid">
          {filteredForms.map((form) => {
            const isCustom = !['plantation-survey-2026', 'customer-onboarding', 'employee-onboarding'].includes(form.id);

            return (
              <div key={`${form.id}-v${form.version}`} className="rk-form-item-card">
                <div className="rk-form-item-top">
                  <div className="rk-form-item-badges">
                    <span
                      className={`rk-status-badge ${
                        form.status === 'PUBLISHED' ? 'rk-status-published' : 'rk-status-draft'
                      }`}
                    >
                      {form.status}
                    </span>
                    <span className="rk-version-badge">v{form.version}</span>
                    <span className="rk-count-tag">{form.questions.length} questions</span>
                  </div>
                </div>

                <h3 className="rk-form-item-title">{form.title}</h3>
                {form.description && (
                  <p className="rk-form-item-desc">{form.description}</p>
                )}

                <div className="rk-form-item-footer">
                  <div className="rk-form-item-actions-left">
                    <button
                      type="button"
                      className="rk-btn-primary rk-btn-sm"
                      onClick={() => onFillSurvey(form)}
                      title="Answer this survey in respondent mode"
                    >
                      <LuClipboardCheck className="rk-btn-icon-inline" />
                      <span>Fill Survey</span>
                    </button>
                    <button
                      type="button"
                      className="rk-btn-secondary rk-btn-sm"
                      onClick={() => onEditForm(form)}
                      title="Edit questions and branching in builder"
                    >
                      <LuSquarePen className="rk-btn-icon-inline" />
                      <span>Edit Form</span>
                    </button>
                  </div>

                  <div className="rk-form-item-actions-right">
                    <button
                      type="button"
                      className="rk-icon-btn"
                      onClick={() => onDuplicateForm(form)}
                      title="Duplicate as new draft"
                      aria-label="Duplicate survey"
                    >
                      <LuCopy size={16} />
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        className="rk-icon-btn rk-btn-danger-icon"
                        onClick={() => {
                          if (window.confirm(`Delete custom survey "${form.title}"?`)) {
                            onDeleteForm(form.id);
                          }
                        }}
                        title="Delete survey"
                        aria-label="Delete survey"
                      >
                        <LuTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
