import * as XLSX from 'xlsx';
import type { Survey, SurveyResponse } from '../types/survey.ts';

/**
 * Exports survey responses to an Excel (.xlsx) file.
 * Formats question labels as column headers, respondent IDs, and ensures skipped
 * questions have completely blank cells rather than fabricated answers.
 */
export function exportResponsesToExcel(survey: Survey, responses: SurveyResponse[]): void {
  if (!responses || responses.length === 0) {
    alert('No responses available to export.');
    return;
  }

  // Construct structured rows
  const rows = responses.map((resp) => {
    const rowObj: Record<string, any> = {
      Respondent: resp.id,
      'Submitted At': new Date(resp.submittedAt).toLocaleString(),
    };

    // Populate each question column
    survey.questions.forEach((q) => {
      const val = resp.answers[q.id];
      if (val === undefined || val === null || val === '') {
        // Blank cell for skipped or unanswered questions
        rowObj[q.label] = '';
      } else if (Array.isArray(val)) {
        rowObj[q.label] = val.join(', ');
      } else {
        rowObj[q.label] = val;
      }
    });

    return rowObj;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths based on header length and contents
  const colWidths = [
    { wch: 14 }, // Respondent ID
    { wch: 22 }, // Submitted At
    ...survey.questions.map((q) => ({
      wch: Math.min(50, Math.max(q.label.length + 2, 16)),
    })),
  ];
  worksheet['!cols'] = colWidths;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  const safeSheetName = (survey.title || 'Responses').slice(0, 31).replace(/[\\/?*[\]]/g, '');
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName || 'Responses');

  // Trigger file download
  const cleanTitle = (survey.title || 'survey')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/(^_+|_+$)/g, '');
  const fileName = `${cleanTitle || 'survey'}_responses.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
