import React, { useState } from 'react';
import type { FormDefinition } from '../../types/form.types.ts';

export interface StateInspectorProps {
  form: FormDefinition;
  answers: Record<string, unknown>;
  activeQuestionIds: string[];
}

export const StateInspector: React.FC<StateInspectorProps> = ({
  form,
  answers,
  activeQuestionIds,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="rk-inspector-card">
      <div className="rk-inspector-header" onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0}>
        <div className="rk-inspector-title-group">
          <span className="rk-inspector-pill">ENGINE STATE</span>
          <span className="rk-inspector-summary">
            Active: {activeQuestionIds.length} / {form.questions.length} questions | Keys: {Object.keys(answers).length}
          </span>
        </div>
        <button type="button" className="rk-btn-ghost-sm">
          {isOpen ? 'Collapse' : 'Expand Inspector'}
        </button>
      </div>

      {isOpen && (
        <div className="rk-inspector-body">
          <div className="rk-inspector-section">
            <h4 className="rk-inspector-subtitle">Active Question Path (Evaluated by Condition Engine):</h4>
            <div className="rk-inspector-badges">
              {activeQuestionIds.map((id, idx) => (
                <span key={id} className="rk-path-badge">
                  {idx + 1}. {id}
                </span>
              ))}
            </div>
          </div>

          <div className="rk-inspector-section">
            <h4 className="rk-inspector-subtitle">Response State (Keyed strictly by stable question IDs):</h4>
            <pre className="rk-json-preview">{JSON.stringify(answers, null, 2)}</pre>
          </div>
        </div>
      )}
    </aside>
  );
};

