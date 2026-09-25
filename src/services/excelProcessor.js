import { generatePreservedExcelWorkbook, generateSingleSheetCombinedWorkbook } from './excelPreserver.js';

export async function generateCrossedExcelWorkbook(templateBuffer, studentTranscripts, options = {}) {
  return generatePreservedExcelWorkbook(templateBuffer, studentTranscripts, options);
}

export { generatePreservedExcelWorkbook, generateSingleSheetCombinedWorkbook };
