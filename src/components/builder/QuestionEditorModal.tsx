import React, { useState } from 'react';
import {
  LuX,
  LuTriangleAlert,
  LuPlus,
  LuArrowUp,
  LuArrowDown,
  LuTrash2,
} from 'react-icons/lu';
import type { QuestionDefinition, QuestionOption, QuestionType } from '../../types/form.types.ts';
import { generateUniqueId } from '../../utils/ids.ts';

export interface QuestionEditorModalProps {
  question?: QuestionDefinition | null;
  onSave: (question: QuestionDefinition) => void;
  onCancel: () => void;
  existingQuestionIds: string[];
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Short Answer (Text)',
  textarea: 'Long Answer (Paragraph)',
  number: 'Numeric Input',
  singleSelect: 'Single Choice (Radio)',
  multiSelect: 'Multiple Choice (Checkboxes)',
  email: 'Email Address',
  dropdown: 'Dropdown Select',
  date: 'Date Picker',
  boolean: 'Yes / No Toggle',
};

const BUILDER_TYPES: QuestionType[] = [
  'text',
  'textarea',
  'number',
  'singleSelect',
  'multiSelect',
];

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  question,
  onSave,
  onCancel,
  existingQuestionIds,
}) => {
  const isEditing = Boolean(question);

  const [id, setId] = useState<string>(
    question?.id || `q_${generateUniqueId('item')}`
  );
  const [label, setLabel] = useState<string>(question?.label || '');
  const [section, setSection] = useState<string>(question?.section || '');
  const [description, setDescription] = useState<string>(question?.description || '');
  const [placeholder, setPlaceholder] = useState<string>(question?.placeholder || '');
  const [type, setType] = useState<QuestionType>(question?.type || 'text');
  const [required, setRequired] = useState<boolean>(question?.required ?? true);

  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options && question.options.length > 0
      ? JSON.parse(JSON.stringify(question.options))
      : [
          { value: 'opt_1', label: 'Option 1' },
          { value: 'opt_2', label: 'Option 2' },
        ]
  );

  const [minNum, setMinNum] = useState<string>(
    (() => {
      const minRule = question?.validation?.find((v) => v.type === 'min');
      return minRule && typeof minRule.value === 'number' ? String(minRule.value) : '';
    })()
  );

  const [maxNum, setMaxNum] = useState<string>(
    (() => {
      const maxRule = question?.validation?.find((v) => v.type === 'max');
      return maxRule && typeof maxRule.value === 'number' ? String(maxRule.value) : '';
    })()
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const isSelectionType = type === 'singleSelect' || type === 'multiSelect';

  const handleAddOption = () => {
    const newIdx = options.length + 1;
    const newOptVal = `opt_${generateUniqueId('item')}`;
    setOptions([...options, { value: newOptVal, label: `Option ${newIdx}` }]);
  };

  const handleUpdateOption = (index: number, field: keyof QuestionOption, val: unknown) => {
    const next = [...options];
    next[index] = { ...next[index], [field]: val };
    setOptions(next);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      setValidationError('Choice questions must have at least one option.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= options.length) return;
    const next = [...options];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setOptions(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanId = id.trim();
    if (!cleanId) {
      setValidationError('Question ID cannot be empty.');
      return;
    }

    if (!isEditing && existingQuestionIds.includes(cleanId)) {
      setValidationError(`Question ID "${cleanId}" is already used. Please choose a unique ID.`);
      return;
    }

    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setValidationError('Question prompt text is required.');
      return;
    }

    if (isSelectionType) {
      if (options.length === 0) {
        setValidationError('At least one option is required for choice questions.');
        return;
      }
      for (const opt of options) {
        if (!opt.label.trim()) {
          setValidationError('All options must have a display label.');
          return;
        }
        if (!opt.value.trim()) {
          setValidationError('All options must have a unique identifier value.');
          return;
        }
      }
      // Check for duplicate option values
      const valSet = new Set<string>();
      for (const opt of options) {
        if (valSet.has(opt.value)) {
          setValidationError(`Duplicate option value "${opt.value}". Each option value must be unique.`);
          return;
        }
        valSet.add(opt.value);
      }
    }

    const validationRules: QuestionDefinition['validation'] = [];
    if (type === 'number') {
      if (minNum.trim() !== '') {
        const parsedMin = Number(minNum);
        if (!isNaN(parsedMin)) {
          validationRules.push({
            type: 'min',
            value: parsedMin,
            message: `Value must be at least ${parsedMin}.`,
          });
        }
      }
      if (maxNum.trim() !== '') {
        const parsedMax = Number(maxNum);
        if (!isNaN(parsedMax)) {
          validationRules.push({
            type: 'max',
            value: parsedMax,
            message: `Value must not exceed ${parsedMax}.`,
          });
        }
      }
    }

    const updatedQuestion: QuestionDefinition = {
      ...(question || {}),
      id: cleanId,
      type,
      label: cleanLabel,
      section: section.trim() || undefined,
      description: description.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      required,
      options: isSelectionType ? options : undefined,
      validation: validationRules.length > 0 ? validationRules : undefined,
      // Retain existing branching next rules if editing
      next: question?.next,
    };

    onSave(updatedQuestion);
  };

  return (
    <div className="rk-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="rk-modal-card">
        <div className="rk-modal-header">
          <div>
            <h2 id="modal-title" className="rk-modal-title">
              {isEditing ? 'Edit Question' : 'Add New Question'}
            </h2>
            <p className="rk-modal-subtitle">Configure question details, prompt, type, and answer options.</p>
          </div>
          <button
            type="button"
            className="rk-modal-close-btn"
            onClick={onCancel}
            aria-label="Close modal"
          >
            <LuX size={20} />
          </button>
        </div>

        {validationError && (
          <div className="rk-modal-error-alert" role="alert">
            <LuTriangleAlert className="rk-btn-icon-inline" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rk-modal-form-wrapper">
          <div className="rk-modal-form-body">
            {/* Section heading */}
            <div className="rk-form-field-group">
            <label htmlFor="q-section" className="rk-field-label">
              Section (Optional)
            </label>
            <input
              id="q-section"
              type="text"
              className="rk-text-input"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. SECTION A — BASIC DETAILS & PLANTATION SIZE"
            />
            <span className="rk-field-hint">Groups related questions under a header badge.</span>
          </div>

          {/* Question Text */}
          <div className="rk-form-field-group">
            <label htmlFor="q-label" className="rk-field-label">
              Question Prompt / Text <span className="rk-required-star">*</span>
            </label>
            <textarea
              id="q-label"
              className="rk-textarea-input"
              rows={3}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. What types of palm trees do you tap for juice/sap?"
              required
            />
          </div>

          {/* Secondary Description */}
          <div className="rk-form-field-group">
            <label htmlFor="q-desc" className="rk-field-label">
              Secondary Description / Helper Note (Optional)
            </label>
            <input
              id="q-desc"
              type="text"
              className="rk-text-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Select all options that apply to this plantation."
            />
          </div>

          {/* Type & Required row */}
          <div className="rk-field-row">
            <div className="rk-form-field-group rk-flex-1">
              <label htmlFor="q-type" className="rk-field-label">
                Question Type <span className="rk-required-star">*</span>
              </label>
              <select
                id="q-type"
                className="rk-select-input"
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
              >
                {BUILDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="rk-form-field-group rk-flex-toggle">
              <label className="rk-field-label">Required Response</label>
              <label className="rk-switch-label">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                <span className="rk-switch-text">{required ? 'Required (ON)' : 'Optional (OFF)'}</span>
              </label>
            </div>
          </div>

          {/* Placeholder for text inputs */}
          {(type === 'text' || type === 'textarea') && (
            <div className="rk-form-field-group">
              <label htmlFor="q-placeholder" className="rk-field-label">
                Placeholder Text (Optional)
              </label>
              <input
                id="q-placeholder"
                type="text"
                className="rk-text-input"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g. Enter details..."
              />
            </div>
          )}

          {/* Numeric ranges */}
          {type === 'number' && (
            <div className="rk-field-row">
              <div className="rk-form-field-group rk-flex-1">
                <label htmlFor="q-min" className="rk-field-label">Minimum Value</label>
                <input
                  id="q-min"
                  type="number"
                  className="rk-text-input"
                  value={minNum}
                  onChange={(e) => setMinNum(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="rk-form-field-group rk-flex-1">
                <label htmlFor="q-max" className="rk-field-label">Maximum Value (Optional)</label>
                <input
                  id="q-max"
                  type="number"
                  className="rk-text-input"
                  value={maxNum}
                  onChange={(e) => setMaxNum(e.target.value)}
                  placeholder="e.g. 10000"
                />
              </div>
            </div>
          )}

          {/* Options Editor for Choice Questions */}
          {isSelectionType && (
            <div className="rk-options-editor-box">
              <div className="rk-options-editor-header">
                <h3 className="rk-options-editor-title">
                  Answer Options ({options.length})
                </h3>
                <button
                  type="button"
                  className="rk-btn-secondary rk-btn-sm"
                  onClick={handleAddOption}
                >
                  <LuPlus className="rk-btn-icon-inline" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="rk-options-list">
                {options.map((opt, idx) => (
                  <div key={idx} className="rk-option-editor-row">
                    <span className="rk-option-index">{idx + 1}.</span>
                    <input
                      type="text"
                      className="rk-text-input rk-flex-1"
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                      placeholder="Option label"
                    />
                    <input
                      type="text"
                      className="rk-text-input rk-option-value-input"
                      value={opt.value}
                      onChange={(e) => handleUpdateOption(idx, 'value', e.target.value)}
                      placeholder="ID / Value"
                      title="Stored answer identifier"
                    />

                    {type === 'multiSelect' && (
                      <label className="rk-exclusive-checkbox-label" title="Mutually exclusive with other options (e.g. 'None')">
                        <input
                          type="checkbox"
                          checked={Boolean(opt.exclusive)}
                          onChange={(e) => handleUpdateOption(idx, 'exclusive', e.target.checked)}
                        />
                        <span>Exclusive</span>
                      </label>
                    )}

                    <div className="rk-option-reorder-buttons">
                      <button
                        type="button"
                        className="rk-icon-btn"
                        onClick={() => handleMoveOption(idx, 'up')}
                        disabled={idx === 0}
                        title="Move option up"
                        aria-label="Move option up"
                      >
                        <LuArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="rk-icon-btn"
                        onClick={() => handleMoveOption(idx, 'down')}
                        disabled={idx === options.length - 1}
                        title="Move option down"
                        aria-label="Move option down"
                      >
                        <LuArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="rk-icon-btn rk-btn-danger-icon"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={options.length <= 1}
                        title="Remove option"
                        aria-label="Remove option"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question ID (Advanced / Collapsible) */}
          <div className="rk-form-field-group rk-advanced-field">
            <label htmlFor="q-id" className="rk-field-label">
              Question Key / ID <span className="rk-field-hint">(Internal identifier for answers)</span>
            </label>
            <input
              id="q-id"
              type="text"
              className="rk-text-input rk-mono-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. q_profession"
              required
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="rk-modal-footer">
          <button type="button" className="rk-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="rk-btn-primary">
            {isEditing ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
