import type { FormResponse, ResponseStatus } from '../../types/response.types.ts';
import { generateUniqueId } from '../../utils/ids.ts';

const STORAGE_KEY_PREFIX = 'rk_form_responses_';

export class ResponseService {
  private inMemoryStore = new Map<string, FormResponse>();

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            const resp = JSON.parse(item) as FormResponse;
            this.inMemoryStore.set(resp.responseId, resp);
          }
        }
      }
    } catch {
      // storage unavailable or restricted
    }
  }

  private persistItem(response: FormResponse): void {
    this.inMemoryStore.set(response.responseId, response);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${response.responseId}`,
          JSON.stringify(response)
        );
      } catch {
        // storage quota exceeded or restricted
      }
    }
  }

  createResponse(formId: string, formVersion: number): FormResponse {
    const response: FormResponse = {
      responseId: generateUniqueId(),
      formId,
      formVersion,
      answers: {},
      status: 'STARTED',
      startedAt: new Date().toISOString(),
    };
    this.persistItem(response);
    return response;
  }

  async saveResponse(response: FormResponse): Promise<FormResponse> {
    const updated: FormResponse = { ...response };
    this.persistItem(updated);
    return updated;
  }

  async getResponse(responseId: string): Promise<FormResponse | null> {
    return this.inMemoryStore.get(responseId) || null;
  }

  async getResponsesByForm(formId: string): Promise<FormResponse[]> {
    return Array.from(this.inMemoryStore.values()).filter((r) => r.formId === formId);
  }

  async getAllResponses(): Promise<FormResponse[]> {
    return Array.from(this.inMemoryStore.values());
  }

  async updateResponseStatus(
    responseId: string,
    status: ResponseStatus,
    syncData?: FormResponse['sync']
  ): Promise<FormResponse> {
    const existing = await this.getResponse(responseId);
    if (!existing) {
      throw new Error(`Response with ID "${responseId}" not found.`);
    }

    const updated: FormResponse = {
      ...existing,
      status,
      completedAt: status === 'COMPLETED' ? existing.completedAt || new Date().toISOString() : existing.completedAt,
      sync: syncData ? { ...existing.sync, ...syncData } : existing.sync,
    };

    this.persistItem(updated);
    return updated;
  }
}

export const defaultResponseService = new ResponseService();

