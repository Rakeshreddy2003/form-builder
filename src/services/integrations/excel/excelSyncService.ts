import type { FormDefinition } from '../../../types/form.types.ts';
import type { FormResponse } from '../../../types/response.types.ts';
import type { SpreadsheetAdapter } from '../../../types/excel.types.ts';
import { mapResponseToSpreadsheetRow } from './excelMapper.ts';
import { defaultExcelAdapter } from './excelAdapter.ts';
import { ResponseService, defaultResponseService } from '../../response/responseService.ts';

export interface SyncResult {
  success: boolean;
  responseId: string;
  attemptCount: number;
  error?: string;
}

export class ExcelSyncService {
  private adapter: SpreadsheetAdapter;
  private responseService: ResponseService;

  constructor(
    adapter: SpreadsheetAdapter = defaultExcelAdapter,
    responseService: ResponseService = defaultResponseService
  ) {
    this.adapter = adapter;
    this.responseService = responseService;
  }

  /**
   * Synchronizes a persisted form response to the spreadsheet.
   * Enforces strict idempotency: Checks if row with 'Response ID' already exists.
   * If exists, updates it in-place. If not, appends.
   * Never produces duplicate rows on retries.
   */
  async syncResponse(form: FormDefinition, response: FormResponse): Promise<SyncResult> {
    const attemptCount = (response.sync?.attemptCount || 0) + 1;
    const now = new Date().toISOString();

    try {
      // 1. Map to spreadsheet columns
      const row = mapResponseToSpreadsheetRow(form, response);

      // 2. Idempotent check
      const existingRow = await this.adapter.findRow('Response ID', response.responseId);
      if (existingRow) {
        // Update existing row
        await this.adapter.updateRow('Response ID', response.responseId, row);
      } else {
        // Append new row
        await this.adapter.appendRow(row);
      }

      // 3. Mark response as SYNCED
      await this.responseService.updateResponseStatus(response.responseId, 'SYNCED', {
        status: 'SYNCED',
        lastAttemptAt: now,
        attemptCount,
      });

      return {
        success: true,
        responseId: response.responseId,
        attemptCount,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync failure';

      // 4. Mark response as SYNC_FAILED without losing user answers
      await this.responseService.updateResponseStatus(response.responseId, 'SYNC_FAILED', {
        status: 'FAILED',
        lastAttemptAt: now,
        attemptCount,
        error: errorMessage,
      });

      return {
        success: false,
        responseId: response.responseId,
        attemptCount,
        error: errorMessage,
      };
    }
  }

  /**
   * Retries synchronization for a previously failed response.
   */
  async retrySync(form: FormDefinition, responseId: string): Promise<SyncResult> {
    const response = await this.responseService.getResponse(responseId);
    if (!response) {
      return {
        success: false,
        responseId,
        attemptCount: 0,
        error: `Response with ID "${responseId}" not found.`,
      };
    }

    return this.syncResponse(form, response);
  }
}

export const defaultExcelSyncService = new ExcelSyncService();
