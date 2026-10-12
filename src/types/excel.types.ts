export type SpreadsheetCellValue = string | number | boolean | null | undefined;
export type SpreadsheetRow = Record<string, SpreadsheetCellValue>;

export interface ExcelColumnMapping {
  questionId: string;
  columnHeader: string;
  formatter?: (value: unknown, answers: Record<string, unknown>) => SpreadsheetCellValue;
}

export interface SpreadsheetAdapter {
  appendRow(row: SpreadsheetRow): Promise<void>;
  updateRow(identifierKey: string, identifierValue: string, row: SpreadsheetRow): Promise<void>;
  findRow(identifierKey: string, identifierValue: string): Promise<SpreadsheetRow | null>;
  getAllRows(): Promise<SpreadsheetRow[]>;
}

