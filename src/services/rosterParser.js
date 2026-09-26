import ExcelJS from 'exceljs';
import { cleanArabicText } from './pdfParser.js';

/**
 * Extracts plain string value from an Excel cell (handles plain values, richText, formulas, numbers)
 */
function extractCellValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.richText && Array.isArray(val.richText)) {
      return val.richText.map(r => r.text || '').join('');
    }
    if (val.text !== undefined) return String(val.text);
    if (val.result !== undefined) return String(val.result);
  }
  return String(val).trim();
}

/**
 * Normalizes student ID to pure digits/alphanumeric string without spaces
 */
export function normalizeStudentId(id) {
  if (id === null || id === undefined) return '';
  return String(id).trim().replace(/\s+/g, '');
}

/**
 * Parse an Excel file containing Student IDs and Student Names.
 * Automatically identifies columns (handles Arabic & English headers or headerless data).
 * 
 * @param {ArrayBuffer|Uint8Array} fileBuffer
 * @returns {Promise<{ idToNameMap: Map<string, string>, rosterCount: number, preview: Array<{ id: string, name: string }> }>}
 */
export async function parseStudentRosterExcel(fileBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Excel workbook has no sheets.');
  }

  let idCol = -1;
  let nameCol = -1;
  let headerRowIndex = -1;

  // Patterns for ID header
  const idPatterns = [
    /^(student\s*id|id|academic\s*id|student\s*code|code)$/i,
    /^(كود|الرقم\s*الجامعي|كود\s*الطالب|رقم\s*الطالب|رقم\s*الجلوس|الرقم\s*الأكاديمي|الرقم\s*الاكاديمي|الكود)$/i,
    /id|كود|الرقم/i
  ];

  // Patterns for Name header
  const namePatterns = [
    /^(student\s*name|name|full\s*name)$/i,
    /^(اسم\s*الطالب|الاسم|اسم|اسم\s*الطالب\s*رباعي|الاسم\s*رباعي)$/i,
    /name|اسم/i
  ];

  // 1. First pass: look for explicit header row (within first 10 rows)
  for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    let matchedId = -1;
    let matchedName = -1;

    row.eachCell((cell, colNumber) => {
      const text = extractCellValue(cell.value).toLowerCase();
      if (!text) return;

      // Check ID match
      if (matchedId === -1 && (idPatterns[0].test(text) || idPatterns[1].test(text))) {
        matchedId = colNumber;
      }
      // Check Name match
      if (matchedName === -1 && (namePatterns[0].test(text) || namePatterns[1].test(text))) {
        matchedName = colNumber;
      }
    });

    if (matchedId !== -1 && matchedName !== -1 && matchedId !== matchedName) {
      idCol = matchedId;
      nameCol = matchedName;
      headerRowIndex = r;
      break;
    }
  }

  // 2. Second pass if no exact header: check looser regex or examine data rows
  if (idCol === -1 || nameCol === -1) {
    for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
      const row = worksheet.getRow(r);
      let matchedId = -1;
      let matchedName = -1;

      row.eachCell((cell, colNumber) => {
        const text = extractCellValue(cell.value).toLowerCase();
        if (!text) return;
        if (matchedId === -1 && idPatterns[2].test(text)) matchedId = colNumber;
        if (matchedName === -1 && namePatterns[2].test(text)) matchedName = colNumber;
      });

      if (matchedId !== -1 && matchedName !== -1 && matchedId !== matchedName) {
        idCol = matchedId;
        nameCol = matchedName;
        headerRowIndex = r;
        break;
      }
    }
  }

  // 3. Fallback: Heuristic detection by inspecting row data types
  // Column with numeric IDs (e.g. 5+ digits) vs Column with Arabic/English string text
  if (idCol === -1 || nameCol === -1) {
    const colScores = new Map(); // colNumber -> { numCount, textCount }
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 25) return;
      row.eachCell((cell, colNumber) => {
        const val = extractCellValue(cell.value);
        if (!val) return;
        if (!colScores.has(colNumber)) colScores.set(colNumber, { numCount: 0, textCount: 0 });
        const entry = colScores.get(colNumber);
        if (/^\d{4,}$/.test(val)) {
          entry.numCount++;
        } else if (/[\u0600-\u06FFa-zA-Z]{3,}/.test(val)) {
          entry.textCount++;
        }
      });
    });

    let bestIdCol = -1;
    let maxNums = 0;
    let bestNameCol = -1;
    let maxTexts = 0;

    for (const [col, stats] of colScores.entries()) {
      if (stats.numCount > maxNums) {
        maxNums = stats.numCount;
        bestIdCol = col;
      }
      if (stats.textCount > maxTexts) {
        maxTexts = stats.textCount;
        bestNameCol = col;
      }
    }

    if (bestIdCol !== -1 && bestNameCol !== -1 && bestIdCol !== bestNameCol) {
      idCol = bestIdCol;
      nameCol = bestNameCol;
      headerRowIndex = 0; // Assume all rows are data or start from 1
    }
  }

  if (idCol === -1 || nameCol === -1) {
    throw new Error(
      'Could not detect Student ID and Student Name columns in the Excel file. Please ensure columns have headers like "Student ID" and "Student Name" or contain student ID numbers and names.'
    );
  }

  const idToNameMap = new Map();
  const preview = [];

  worksheet.eachRow((row, rowNumber) => {
    if (headerRowIndex !== -1 && rowNumber <= headerRowIndex) return;

    const rawId = extractCellValue(row.getCell(idCol).value);
    const rawName = extractCellValue(row.getCell(nameCol).value);

    const normId = normalizeStudentId(rawId);
    const cleanName = cleanArabicText(rawName);

    // Filter out rows that are clearly headers or empty
    if (!normId || !cleanName) return;
    if (/^(id|student|code|كود|الرقم|اسم)$/i.test(normId)) return;

    idToNameMap.set(normId, cleanName);

    if (preview.length < 5) {
      preview.push({ id: normId, name: cleanName });
    }
  });

  return {
    idToNameMap,
    rosterCount: idToNameMap.size,
    preview
  };
}
