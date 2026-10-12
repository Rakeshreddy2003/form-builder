import React, { useState, useEffect } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { defaultExcelAdapter } from '../../services/integrations/excel/excelAdapter.ts';
import type { SpreadsheetRow } from '../../types/excel.types.ts';

export interface ExcelSyncViewerProps {
  lastUpdated?: number;
}

export const ExcelSyncViewer: React.FC<ExcelSyncViewerProps> = ({ lastUpdated }) => {
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [simulateFailure, setSimulateFailure] = useState(defaultExcelAdapter.isSimulatingFailure());
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    let active = true;
    void defaultExcelAdapter.getAllRows().then((allRows) => {
      if (active) {
        setRows(allRows);
      }
    });
    return () => {
      active = false;
    };
  }, [lastUpdated]);

  const handleToggleFailure = () => {
    const nextState = !simulateFailure;
    defaultExcelAdapter.setSimulateFailure(nextState);
    setSimulateFailure(nextState);
  };

  const handleClear = async () => {
    await defaultExcelAdapter.clear();
    setRows([]);
  };

  const handleDownloadCsv = () => {
    const csvContent = defaultExcelAdapter.toCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `excel_sync_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section className="rk-excel-viewer-card" aria-label="Excel Integration Simulator">
      <header className="rk-viewer-header">
        <div className="rk-viewer-title-group">
          <div className="rk-excel-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h2 className="rk-viewer-title">Excel Integration Adapter</h2>
            <p className="rk-viewer-subtitle">
              Live spreadsheet synchronized via idempotent adapter layer ({rows.length} rows)
            </p>
          </div>
        </div>

        <div className="rk-viewer-controls">
          <label className="rk-toggle-wrapper" title="Simulate spreadsheet connectivity issues">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={handleToggleFailure}
              className="rk-toggle-input"
            />
            <span className="rk-toggle-label">
              {simulateFailure ? (
                <span className="rk-text-danger">
                  <LuTriangleAlert className="rk-btn-icon-inline" />
                  <span>Simulating API Outage</span>
                </span>
              ) : (
                <span>Simulate Excel API Outage</span>
              )}
            </span>
          </label>

          <button
            type="button"
            className="rk-btn-sm rk-btn-outline"
            onClick={handleDownloadCsv}
            disabled={rows.length === 0}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="rk-btn-sm rk-btn-danger"
            onClick={handleClear}
            disabled={rows.length === 0}
          >
            Clear Sheet
          </button>

          <button
            type="button"
            className="rk-btn-sm rk-btn-ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle spreadsheet visibility"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        </div>
      </header>

      {isExpanded && (
        <div className="rk-viewer-content">
          {rows.length === 0 ? (
            <div className="rk-empty-sheet">
              <p>The spreadsheet is currently empty. Complete and submit a form above to view live synchronized rows.</p>
            </div>
          ) : (
            <div className="rk-sheet-table-wrapper">
              <table className="rk-sheet-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="rk-sheet-th">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={String(row['Response ID'] || idx)} className="rk-sheet-tr">
                      {columns.map((col) => (
                        <td key={col} className="rk-sheet-td">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
