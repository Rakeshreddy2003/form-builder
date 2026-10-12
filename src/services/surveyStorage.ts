import type { Survey, SurveyResponse } from '../types/survey.ts';
import {
  professionSurveyDemo,
  generalSurveyDemo,
  sampleProfessionResponses,
} from '../data/defaultSurveys.ts';

const SURVEYS_STORAGE_KEY = 'interactive_surveys_v2';
const RESPONSES_STORAGE_KEY = 'interactive_responses_v2';

export class SurveyStorageService {
  /**
   * Returns all stored surveys, initializing with demo surveys if empty.
   */
  getSurveys(): Survey[] {
    try {
      const raw = localStorage.getItem(SURVEYS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read surveys from localStorage:', e);
    }
    // Default initial surveys
    const initialSurveys = [professionSurveyDemo, generalSurveyDemo];
    this.saveSurveys(initialSurveys);
    return initialSurveys;
  }

  saveSurveys(surveys: Survey[]): void {
    try {
      localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(surveys));
    } catch (e) {
      console.error('Failed to save surveys to localStorage:', e);
    }
  }

  saveSurvey(survey: Survey): Survey {
    const all = this.getSurveys();
    const index = all.findIndex((s) => s.id === survey.id);
    const updated = {
      ...survey,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.unshift(updated);
    }
    this.saveSurveys(all);
    return updated;
  }

  deleteSurvey(surveyId: string): void {
    const all = this.getSurveys().filter((s) => s.id !== surveyId);
    this.saveSurveys(all);
    // Also remove responses for this survey
    const responses = this.getAllResponses();
    delete responses[surveyId];
    this.saveAllResponses(responses);
  }

  /**
   * Responses map: surveyId -> SurveyResponse[]
   */
  getAllResponses(): Record<string, SurveyResponse[]> {
    try {
      const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read responses from localStorage:', e);
    }
    // Seed with initial responses for profession demo
    const initial: Record<string, SurveyResponse[]> = {
      survey_profession: sampleProfessionResponses,
    };
    this.saveAllResponses(initial);
    return initial;
  }

  saveAllResponses(map: Record<string, SurveyResponse[]>): void {
    try {
      localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('Failed to save responses to localStorage:', e);
    }
  }

  getResponsesForSurvey(surveyId: string): SurveyResponse[] {
    const all = this.getAllResponses();
    return all[surveyId] || [];
  }

  addResponse(surveyId: string, answers: Record<string, any>): SurveyResponse {
    const all = this.getAllResponses();
    const existing = all[surveyId] || [];

    // Generate neat respondent ID e.g. "001", "002"
    const nextNum = existing.length + 1;
    const paddedId = String(nextNum).padStart(3, '0');

    const newResponse: SurveyResponse = {
      id: paddedId,
      surveyId,
      submittedAt: new Date().toISOString(),
      answers,
    };

    all[surveyId] = [...existing, newResponse];
    this.saveAllResponses(all);
    return newResponse;
  }

  clearResponses(surveyId: string): void {
    const all = this.getAllResponses();
    all[surveyId] = [];
    this.saveAllResponses(all);
  }

  resetAllToDefaults(): { surveys: Survey[]; active: Survey } {
    const initialSurveys = [professionSurveyDemo, generalSurveyDemo];
    this.saveSurveys(initialSurveys);
    const initialResponses = {
      survey_profession: sampleProfessionResponses,
    };
    this.saveAllResponses(initialResponses);
    return { surveys: initialSurveys, active: professionSurveyDemo };
  }
}

export const surveyStorage = new SurveyStorageService();
