import {
  generatePreservedExcelWorkbook,
  generateSingleSheetCombinedWorkbook,
  generateCombinedTreeAndRegistrationWorkbook
} from './excelPreserver.js';
import { generateRegistrationWorkbook, generateSingleSheetRegistrationWorkbook } from './regFormGenerator.js';

export async function generateCrossedExcelWorkbook(templateBuffer, studentTranscripts, options = {}) {
  return generatePreservedExcelWorkbook(templateBuffer, studentTranscripts, options);
}

export {
  generatePreservedExcelWorkbook,
  generateSingleSheetCombinedWorkbook,
  generateCombinedTreeAndRegistrationWorkbook,
  generateRegistrationWorkbook,
  generateSingleSheetRegistrationWorkbook
};

