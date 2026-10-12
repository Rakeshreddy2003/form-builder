import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mapResponseToSpreadsheetRow } from '../services/integrations/excel/excelMapper.ts';
import { InMemoryExcelAdapter } from '../services/integrations/excel/excelAdapter.ts';
import { ExcelSyncService } from '../services/integrations/excel/excelSyncService.ts';
import { ResponseService } from '../services/response/responseService.ts';

import type { FormDefinition } from '../types/form.types.ts';
import type { FormResponse } from '../types/response.types.ts';

describe('Excel Mapper', () => {
  const form: FormDefinition = {
    id: 'customer-onboarding',
    version: 1,
    title: 'Customer Onboarding',
    status: 'PUBLISHED',
    excelMapping: {
      customer_type: 'Customer Type',
      company_name: 'Company Name',
      services: 'Subscribed Services',
      is_partner: 'Official Partner',
    },
    questions: [
      { id: 'customer_type', type: 'singleSelect', label: 'Customer Type' },
      { id: 'company_name', type: 'text', label: 'Company Name' },
      { id: 'services', type: 'multiSelect', label: 'Subscribed Services' },
      { id: 'is_partner', type: 'boolean', label: 'Official Partner' },
    ],
  };

  const response: FormResponse = {
    responseId: 'resp_test_123',
    formId: 'customer-onboarding',
    formVersion: 1,
    status: 'COMPLETED',
    startedAt: '2026-10-11T10:00:00.000Z',
    completedAt: '2026-10-11T10:05:00.000Z',
    answers: {
      customer_type: 'business',
      company_name: 'Antigravity Labs',
      services: ['Cloud', 'AI Engine', 'Enterprise SLA'],
      is_partner: true,
    },
  };

  it('maps form answers into spreadsheet row with column formatting', () => {
    const row = mapResponseToSpreadsheetRow(form, response);

    assert.equal(row['Response ID'], 'resp_test_123');
    assert.equal(row['Form ID'], 'customer-onboarding');
    assert.equal(row['Form Version'], 1);
    assert.equal(row['Status'], 'COMPLETED');
    assert.equal(row['Customer Type'], 'business');
    assert.equal(row['Company Name'], 'Antigravity Labs');
    assert.equal(row['Subscribed Services'], 'Cloud, AI Engine, Enterprise SLA');
    assert.equal(row['Official Partner'], 'Yes');
  });
});

describe('Excel Synchronization & Idempotency', () => {
  const form: FormDefinition = {
    id: 'test-sync',
    version: 1,
    title: 'Sync Test',
    status: 'PUBLISHED',
    questions: [{ id: 'q1', type: 'text', label: 'Field 1' }],
  };

  it('synchronizes response idempotently without duplicate rows on retry', async () => {
    const adapter = new InMemoryExcelAdapter();
    const responseService = new ResponseService();
    const syncService = new ExcelSyncService(adapter, responseService);

    const response = responseService.createResponse('test-sync', 1);
    response.answers = { q1: 'Initial Answer' };
    response.status = 'COMPLETED';
    await responseService.saveResponse(response);

    // First sync attempt
    const result1 = await syncService.syncResponse(form, response);
    assert.equal(result1.success, true);
    assert.equal(result1.attemptCount, 1);

    const rowsAfterFirst = await adapter.getAllRows();
    assert.equal(rowsAfterFirst.length, 1);
    assert.equal(rowsAfterFirst[0]['Field 1'], 'Initial Answer');

    // Repeated sync attempt with same responseId (simulate retry or duplicate event)
    response.answers = { q1: 'Updated Answer' };
    const result2 = await syncService.syncResponse(form, response);
    assert.equal(result2.success, true);

    const rowsAfterSecond = await adapter.getAllRows();
    // MUST NOT create duplicate row! Row count must remain 1!
    assert.equal(rowsAfterSecond.length, 1);
    assert.equal(rowsAfterSecond[0]['Field 1'], 'Updated Answer');
  });

  it('safely handles Excel failure without losing user responses', async () => {
    const adapter = new InMemoryExcelAdapter();
    const responseService = new ResponseService();
    const syncService = new ExcelSyncService(adapter, responseService);

    const response = responseService.createResponse('test-sync', 1);
    response.answers = { q1: 'Crucial User Data' };
    response.status = 'COMPLETED';
    await responseService.saveResponse(response);

    // Simulate Excel outage
    adapter.setSimulateFailure(true);

    const failureResult = await syncService.syncResponse(form, response);
    assert.equal(failureResult.success, false);
    assert.match(failureResult.error || '', /Simulated Excel API failure/);

    // Response in database still exists and is not lost
    const storedResponse = await responseService.getResponse(response.responseId);
    assert.ok(storedResponse);
    assert.equal(storedResponse?.status, 'SYNC_FAILED');
    assert.equal(storedResponse?.answers.q1, 'Crucial User Data');

    // Restore Excel service and retry
    adapter.setSimulateFailure(false);
    const retryResult = await syncService.retrySync(form, response.responseId);
    assert.equal(retryResult.success, true);

    const rows = await adapter.getAllRows();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]['Field 1'], 'Crucial User Data');

    const syncedResponse = await responseService.getResponse(response.responseId);
    assert.equal(syncedResponse?.status, 'SYNCED');
  });
});

