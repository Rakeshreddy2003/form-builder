import type { FormResponse } from '../../types/response.types.ts';

export function serializeResponse(response: FormResponse): string {
  return JSON.stringify(response);
}

export function deserializeResponse(jsonStr: string): FormResponse {
  const parsed = JSON.parse(jsonStr) as FormResponse;
  if (!parsed.responseId || !parsed.formId || typeof parsed.formVersion !== 'number') {
    throw new Error('Invalid FormResponse envelope: missing mandatory metadata.');
  }
  return parsed;
}

