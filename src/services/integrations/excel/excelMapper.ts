import type { FormDefinition } from '../../../types/form.types.ts';
import type { FormResponse } from '../../../types/response.types.ts';
import type { SpreadsheetRow, SpreadsheetCellValue } from '../../../types/excel.types.ts';

function formatCellValue(value: unknown): SpreadsheetCellValue {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).join(', ');
  }
  return String(value);
}

/**
 * Pure mapper that transforms a FormResponse into a flat SpreadsheetRow.
 * Completely isolates Excel column conventions from the form engine.
 */
export function mapResponseToSpreadsheetRow(
  form: FormDefinition,
  response: FormResponse
): SpreadsheetRow {
  const row: SpreadsheetRow = {
    'Response ID': response.responseId,
    'Form ID': response.formId,
    'Form Version': response.formVersion,
    'Submitted At': response.completedAt || response.startedAt,
    Status: response.status,
  };

  const mapping = form.excelMapping || {};

  for (const question of form.questions) {
    // Determine column header name from explicit mapping or fallback to question label
    const header = mapping[question.id] || question.label;
    const rawValue = response.answers[question.id];
    row[header] = formatCellValue(rawValue);
  }

  return row;
}

