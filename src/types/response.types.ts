export type ResponseStatus =
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SYNC_PENDING'
  | 'SYNCED'
  | 'SYNC_FAILED';

export interface FormResponse {
  responseId: string;
  formId: string;
  formVersion: number;
  answers: Record<string, unknown>;
  status: ResponseStatus;
  startedAt: string;
  completedAt?: string;
  sync?: {
    status: 'PENDING' | 'SYNCED' | 'FAILED';
    lastAttemptAt?: string;
    attemptCount?: number;
    error?: string;
  };
}

