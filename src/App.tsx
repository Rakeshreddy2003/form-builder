import { useState } from 'react';
import type { Survey, SurveyResponse } from './types/survey.ts';
import { FormBuilder } from './components/FormBuilder.tsx';
import { SurveyRespondent } from './components/SurveyRespondent.tsx';
import { SurveyResponsesView } from './components/SurveyResponsesView.tsx';
import { surveyStorage } from './services/surveyStorage.ts';
import {
  professionSurveyDemo,
  generalSurveyDemo,
} from './data/defaultSurveys.ts';

type AppTab = 'builder' | 'respondent' | 'responses';

export function App() {
  const [surveys, setSurveys] = useState<Survey[]>(() => surveyStorage.getSurveys());
  const [activeSurveyId, setActiveSurveyId] = useState<string>(
    () => surveys[0]?.id || professionSurveyDemo.id
  );
  const [activeTab, setActiveTab] = useState<AppTab>('builder');
  const [responsesMap, setResponsesMap] = useState<Record<string, SurveyResponse[]>>(() =>
    surveyStorage.getAllResponses()
  );

  // Active survey
  const activeSurvey =
    surveys.find((s) => s.id === activeSurveyId) || surveys[0] || professionSurveyDemo;

  // Active survey responses
  const activeResponses = responsesMap[activeSurvey.id] || [];

  // Save survey updates and optionally navigate to respondent view
  const handleSaveSurvey = (updatedSurvey: Survey, navigateToRespondent: boolean = false) => {
    const persisted = surveyStorage.saveSurvey(updatedSurvey);
    const refreshed = surveyStorage.getSurveys();
    setSurveys(refreshed);
    setActiveSurveyId(persisted.id);
    if (navigateToRespondent) {
      setActiveTab('respondent');
    }
  };

  // Submit response from respondent view
  const handleSubmitResponse = (answers: Record<string, any>): SurveyResponse => {
    const newResp = surveyStorage.addResponse(activeSurvey.id, answers);
    setResponsesMap(surveyStorage.getAllResponses());
    return newResp;
  };

  // Clear responses for active survey
  const handleClearResponses = () => {
    surveyStorage.clearResponses(activeSurvey.id);
    setResponsesMap(surveyStorage.getAllResponses());
  };

  // Add sample responses for active survey
  const handleAddSampleResponses = (samples: SurveyResponse[]) => {
    const currentAll = surveyStorage.getAllResponses();
    const existing = currentAll[activeSurvey.id] || [];
    currentAll[activeSurvey.id] = [...existing, ...samples];
    surveyStorage.saveAllResponses(currentAll);
    setResponsesMap({ ...currentAll });
  };

  // Load preset demo
  const handleLoadDemo = (demoType: 'profession' | 'general') => {
    const targetDemo =
      demoType === 'profession' ? professionSurveyDemo : generalSurveyDemo;
    const saved = surveyStorage.saveSurvey(targetDemo);
    setSurveys(surveyStorage.getSurveys());
    setActiveSurveyId(saved.id);
  };

  // Create new blank survey without prefilled question text
  const handleCreateNewBlankSurvey = () => {
    const newSurvey: Survey = {
      id: `survey_${Date.now()}`,
      title: 'Untitled Survey',
      description: 'A new custom survey',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: `q_1_${Date.now()}`,
          label: '', // Empty label with placeholder
          type: 'short_answer',
          options: [],
          flow: 'general',
          optionLinks: {},
          required: false,
        },
      ],
    };
    surveyStorage.saveSurvey(newSurvey);
    setSurveys(surveyStorage.getSurveys());
    setActiveSurveyId(newSurvey.id);
    setActiveTab('builder');
  };

  return (
    <div className="app-shell">
      {/* Top Application Bar */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand-group">
            <h1 className="header-title">Survey Form Generator</h1>
            <p className="header-subtitle">
              Manual question creation, answer type configuration, skip logic routing & Excel (.xlsx) export
            </p>
          </div>

          {/* Survey Selector & New Form Button */}
          <div className="header-controls">
            <div className="survey-select-group">
              <label htmlFor="survey-switcher" className="header-control-label">
                Current Survey:
              </label>
              <select
                id="survey-switcher"
                className="header-select"
                value={activeSurvey.id}
                onChange={(e) => setActiveSurveyId(e.target.value)}
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.questions.length} Qs)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCreateNewBlankSurvey}
              title="Create a new custom survey"
            >
              + New Blank Form
            </button>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <nav className="app-nav-tabs" aria-label="Main Navigation">
          <div className="nav-tabs-inner">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'builder' ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              <span className="tab-number">1</span>
              <span>Create Survey (Form Creator)</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'respondent' ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab('respondent')}
            >
              <span className="tab-number">2</span>
              <span>Respondent View (Take Survey)</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'responses' ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab('responses')}
            >
              <span className="tab-number">3</span>
              <span>Responses & Excel Export</span>
              <span className="tab-counter-badge">{activeResponses.length}</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Tab Views */}
      <main className="app-main-content">
        {activeTab === 'builder' && (
          <FormBuilder
            key={activeSurvey.id}
            survey={activeSurvey}
            onSaveSurvey={handleSaveSurvey}
            onPreviewSurvey={() => setActiveTab('respondent')}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {activeTab === 'respondent' && (
          <SurveyRespondent
            key={`${activeSurvey.id}-${activeSurvey.updatedAt}`}
            survey={activeSurvey}
            onSubmitResponse={handleSubmitResponse}
            onViewResponses={() => setActiveTab('responses')}
            onEditInBuilder={() => setActiveTab('builder')}
          />
        )}

        {activeTab === 'responses' && (
          <SurveyResponsesView
            key={activeSurvey.id}
            survey={activeSurvey}
            responses={activeResponses}
            onTakeSurvey={() => setActiveTab('respondent')}
            onClearResponses={handleClearResponses}
            onAddSampleResponses={handleAddSampleResponses}
          />
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="app-footer">
        <p>Survey Form Generator with Skip Logic & Excel (.xlsx) Export &bull; React</p>
      </footer>
    </div>
  );
}

export default App;
