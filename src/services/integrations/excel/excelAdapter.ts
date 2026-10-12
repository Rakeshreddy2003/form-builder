import type { SpreadsheetAdapter, SpreadsheetRow } from '../../../types/excel.types.ts';

const EXCEL_STORAGE_KEY = 'rk_form_excel_sheet_rows';

export class InMemoryExcelAdapter implements SpreadsheetAdapter {
  private rows: SpreadsheetRow[] = [];
  private simulateFailure = false;

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(EXCEL_STORAGE_KEY);
      if (saved) {
        this.rows = JSON.parse(saved);
      }
    } catch {
      // storage unavailable
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(EXCEL_STORAGE_KEY, JSON.stringify(this.rows));
    } catch {
      // storage error
    }
  }

  /**
   * For testing & demoing retry and failure handling.
   */
  setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail;
  }

  isSimulatingFailure(): boolean {
    return this.simulateFailure;
  }

  async appendRow(row: SpreadsheetRow): Promise<void> {
    if (this.simulateFailure) {
      throw new Error('Simulated Excel API failure: Connection timed out.');
    }
    this.rows.push({ ...row });
    this.persist();
  }

  async updateRow(
    identifierKey: string,
    identifierValue: string,
    row: SpreadsheetRow
  ): Promise<void> {
    if (this.simulateFailure) {
      throw new Error('Simulated Excel API failure: Connection timed out.');
    }
    const index = this.rows.findIndex(
      (r) => String(r[identifierKey]) === String(identifierValue)
    );

    if (index >= 0) {
      this.rows[index] = { ...this.rows[index], ...row };
    } else {
      this.rows.push({ ...row });
    }
    this.persist();
  }

  async findRow(
    identifierKey: string,
    identifierValue: string
  ): Promise<SpreadsheetRow | null> {
    const found = this.rows.find(
      (r) => String(r[identifierKey]) === String(identifierValue)
    );
    return found ? { ...found } : null;
  }

  async getAllRows(): Promise<SpreadsheetRow[]> {
    return this.rows.map((r) => ({ ...r }));
  }

  async clear(): Promise<void> {
    this.rows = [];
    this.persist();
  }

  /**
   * Generates a downloadable CSV string representing the spreadsheet.
   */
  toCsv(): string {
    if (this.rows.length === 0) return '';
    const headers = Object.keys(this.rows[0]);
    const escapeCsv = (str: unknown) => {
      const val = String(str ?? '');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const lines: string[] = [headers.map(escapeCsv).join(',')];
    for (const row of this.rows) {
      lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
    }
    return lines.join('\n');
  }
}

export const defaultExcelAdapter = new InMemoryExcelAdapter();

