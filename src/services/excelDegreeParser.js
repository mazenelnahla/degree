import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { ALL_COURSES, normalizeCode } from './courseMapping.js';
import { cleanArabicText } from './pdfParser.js';

function parseXml(xmlStr) {
  return new DOMParser().parseFromString(xmlStr, 'application/xml');
}

function columnLetterToIndex(letters) {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index;
}

/**
 * Extracts student transcripts and their registered (checked) courses from
 * a previously exported Degree Sheet workbook (.xlsx).
 * Supports both multi-tab workbooks (1 sheet per student) and single-sheet combined workbooks.
 *
 * @param {ArrayBuffer|Uint8Array} fileBuffer
 * @returns {Promise<Array<Object>>} Array of restored student transcript objects
 */
export async function parseExportedDegreeWorkbook(fileBuffer) {
  const zip = await JSZip.loadAsync(fileBuffer);

  // 1. Read shared strings
  let sharedStrings = [];
  const sharedFile = zip.file('xl/sharedStrings.xml');
  if (sharedFile) {
    const sharedXml = await sharedFile.async('text');
    const sharedDoc = parseXml(sharedXml);
    const siElements = Array.from(sharedDoc.getElementsByTagName('si'));
    sharedStrings = siElements.map(si => {
      const tElements = Array.from(si.getElementsByTagName('t'));
      return tElements.map(t => t.textContent || '').join('');
    });
  }

  // 2. Read styles to detect red fills (failed courses) and green fills (selected courses)
  const stylesFile = zip.file('xl/styles.xml');
  let redXfIndices = new Set();
  let greenXfIndices = new Set();
  let strikeXfIndices = new Set();

  if (stylesFile) {
    const stylesXml = await stylesFile.async('text');
    const stylesDoc = parseXml(stylesXml);

    const fills = Array.from(stylesDoc.getElementsByTagName('fill'));
    const redFillIndices = new Set();
    const greenFillIndices = new Set();

    fills.forEach((fill, idx) => {
      const fgColor = fill.getElementsByTagName('fgColor')[0];
      const rgb = (fgColor?.getAttribute('rgb') || '').toUpperCase();
      if (rgb.includes('FFC7CE')) redFillIndices.add(idx);
      if (rgb.includes('C6EFCE')) greenFillIndices.add(idx);
    });

    const borders = Array.from(stylesDoc.getElementsByTagName('border'));
    const diagBorderIndices = new Set();
    borders.forEach((border, idx) => {
      const hasDiagDown = border.getAttribute('diagonalDown') === '1' || border.getAttribute('diagonalDown') === 'true';
      const diagEl = border.getElementsByTagName('diagonal')[0];
      if (hasDiagDown && diagEl) {
        diagBorderIndices.add(idx);
      }
    });

    const cellXfs = Array.from(stylesDoc.getElementsByTagName('cellXfs')[0]?.getElementsByTagName('xf') || []);
    cellXfs.forEach((xf, idx) => {
      const fillId = parseInt(xf.getAttribute('fillId') || '-1', 10);
      const borderId = parseInt(xf.getAttribute('borderId') || '-1', 10);

      if (redFillIndices.has(fillId)) redXfIndices.add(idx);
      if (greenFillIndices.has(fillId)) greenXfIndices.add(idx);
      if (diagBorderIndices.has(borderId)) strikeXfIndices.add(idx);
    });
  }

  // 3. Read workbook sheets
  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) {
    throw new Error('Invalid Excel file: xl/workbook.xml missing.');
  }
  const wbXml = await wbFile.async('text');
  const wbDoc = parseXml(wbXml);
  const sheetNodes = Array.from(wbDoc.getElementsByTagName('sheet'));

  const wbRelsFile = zip.file('xl/_rels/workbook.xml.rels');
  const wbRelsMap = new Map();
  if (wbRelsFile) {
    const wbRelsXml = await wbRelsFile.async('text');
    const wbRelsDoc = parseXml(wbRelsXml);
    Array.from(wbRelsDoc.getElementsByTagName('Relationship')).forEach(rel => {
      wbRelsMap.set(rel.getAttribute('Id'), rel.getAttribute('Target'));
    });
  }

  // Check if it's a single sheet combined format or multi-sheet
  const isSingleSheetCombined = sheetNodes.length === 1 &&
    (sheetNodes[0].getAttribute('name') || '').toLowerCase().includes('combined');

  const students = [];

  if (isSingleSheetCombined) {
    // Single sheet combined with multiple stacked students
    const rId = sheetNodes[0].getAttribute('r:id') || sheetNodes[0].getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const targetPath = wbRelsMap.get(rId) || 'worksheets/sheet1.xml';
    const cleanPath = targetPath.startsWith('/') ? targetPath.substring(1) : (targetPath.startsWith('xl/') ? targetPath : `xl/${targetPath}`);
    const sheetFile = zip.file(cleanPath);

    if (sheetFile) {
      const sheetXml = await sheetFile.async('text');
      const sheetDoc = parseXml(sheetXml);
      const cellMap = parseSheetCells(sheetDoc, sharedStrings);

      // Read drawings for checkmarks
      const drawingCheckmarks = await parseDrawingCheckmarks(zip, cleanPath);

      // Dynamically find all student blocks by looking for cells containing "Student's Name"
      const studentBaseRows = [];
      for (const [r, cellObj] of cellMap.entries()) {
        if (r.startsWith('C') && cellObj.strValue && cellObj.strValue.toLowerCase().includes("student's name")) {
          const rowNum = parseInt(r.substring(1), 10);
          if (!isNaN(rowNum)) {
            studentBaseRows.push(rowNum);
          }
        }
      }
      studentBaseRows.sort((a, b) => a - b);

      if (studentBaseRows.length > 0) {
        studentBaseRows.forEach((baseRow, studentIndex) => {
          const offset = baseRow - 2;
          const student = extractStudentFromCells(cellMap, offset, `Student ${studentIndex + 1}`, redXfIndices, greenXfIndices, strikeXfIndices, drawingCheckmarks);
          if (student) {
            students.push(student);
          }
        });
      } else {
        // Fallback: fixed ROW_BLOCK_SIZE = 55
        const ROW_BLOCK_SIZE = 55;
        let offset = 0;
        let studentIndex = 0;

        while (true) {
          const nameRef = `F${2 + offset}`;
          const nameCell = cellMap.get(nameRef);
          if (!nameCell && offset > 0) {
            let hasCells = false;
            for (let r = 1; r <= 52; r++) {
              if (cellMap.has(`C${r + offset}`) || cellMap.has(`W${r + offset}`)) {
                hasCells = true;
                break;
              }
            }
            if (!hasCells) break;
          }

          const student = extractStudentFromCells(cellMap, offset, `Student ${studentIndex + 1}`, redXfIndices, greenXfIndices, strikeXfIndices, drawingCheckmarks);
          if (student) {
            students.push(student);
            studentIndex++;
          }

          offset += ROW_BLOCK_SIZE;
          if (offset > 55 * 200) break;
        }
      }
    }
  } else {
    // Multi-tab mode: 1 worksheet per student
    for (let i = 0; i < sheetNodes.length; i++) {
      const sNode = sheetNodes[i];
      const sheetName = sNode.getAttribute('name') || `Student ${i + 1}`;
      const rId = sNode.getAttribute('r:id') || sNode.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      const targetPath = wbRelsMap.get(rId) || `worksheets/sheet${i + 1}.xml`;
      const cleanPath = targetPath.startsWith('/') ? targetPath.substring(1) : (targetPath.startsWith('xl/') ? targetPath : `xl/${targetPath}`);
      const sheetFile = zip.file(cleanPath);

      if (sheetFile) {
        const sheetXml = await sheetFile.async('text');
        const sheetDoc = parseXml(sheetXml);
        const cellMap = parseSheetCells(sheetDoc, sharedStrings);

        // Read drawings for checkmark shapes in this tab
        const drawingCheckmarks = await parseDrawingCheckmarks(zip, cleanPath);

        const student = extractStudentFromCells(cellMap, 0, sheetName, redXfIndices, greenXfIndices, strikeXfIndices, drawingCheckmarks);
        if (student) {
          students.push(student);
        }
      }
    }
  }

  return students;
}

/**
 * Parses all cell elements in a worksheet document into a Map: cellRef -> { value, strValue, s, t }
 */
function parseSheetCells(sheetDoc, sharedStrings) {
  const map = new Map();
  const cElements = Array.from(sheetDoc.getElementsByTagName('c'));

  for (const c of cElements) {
    const r = c.getAttribute('r');
    if (!r) continue;

    const s = parseInt(c.getAttribute('s') || '0', 10);
    const t = c.getAttribute('t') || '';

    let strValue = '';
    const vEl = c.getElementsByTagName('v')[0];
    const isEl = c.getElementsByTagName('is')[0];

    if (isEl) {
      const tEl = isEl.getElementsByTagName('t')[0];
      strValue = tEl ? (tEl.textContent || '') : '';
    } else if (vEl) {
      const rawV = vEl.textContent || '';
      if (t === 's') {
        const idx = parseInt(rawV, 10);
        strValue = sharedStrings[idx] !== undefined ? sharedStrings[idx] : rawV;
      } else {
        strValue = rawV;
      }
    }

    map.set(r, {
      r,
      s,
      t,
      strValue: strValue.trim()
    });
  }

  return map;
}

/**
 * Inspects drawing relationship for a worksheet and identifies any checkmark shapes.
 * Returns a Set of course codes or cell bounding coordinates that have checkmarks.
 */
async function parseDrawingCheckmarks(zip, sheetPath) {
  const checkmarkedSet = new Set();
  try {
    const parts = sheetPath.split('/');
    const sheetFileName = parts.pop();
    const relsPath = `${parts.join('/')}/_rels/${sheetFileName}.rels`;
    const relsFile = zip.file(relsPath);
    if (!relsFile) return checkmarkedSet;

    const relsXml = await relsFile.async('text');
    const relsDoc = parseXml(relsXml);
    const relNodes = Array.from(relsDoc.getElementsByTagName('Relationship'));

    let drawingTarget = null;
    for (const rel of relNodes) {
      const type = rel.getAttribute('Type') || '';
      if (type.endsWith('/drawing')) {
        drawingTarget = rel.getAttribute('Target');
        break;
      }
    }
    if (!drawingTarget) return checkmarkedSet;

    // Resolve target path relative to worksheet directory
    const drawingPath = drawingTarget.startsWith('/')
      ? drawingTarget.substring(1)
      : (drawingTarget.startsWith('../')
        ? `xl/${drawingTarget.replace('../', '')}`
        : `xl/worksheets/${drawingTarget}`);

    const drawingFile = zip.file(drawingPath);
    if (!drawingFile) return checkmarkedSet;

    const drawingXml = await drawingFile.async('text');
    const drawingDoc = parseXml(drawingXml);

    const twoCellAnchors = Array.from(drawingDoc.getElementsByTagName('xdr:twoCellAnchor'));
    for (const anchor of twoCellAnchors) {
      const cNvPr = anchor.getElementsByTagName('xdr:cNvPr')[0];
      const shapeName = cNvPr?.getAttribute('name') || '';

      const fromCol = parseInt(anchor.getElementsByTagName('xdr:from')[0]?.getElementsByTagName('xdr:col')[0]?.textContent || '-1', 10);
      const fromRow = parseInt(anchor.getElementsByTagName('xdr:from')[0]?.getElementsByTagName('xdr:row')[0]?.textContent || '-1', 10);

      if (fromCol >= 0 && fromRow >= 0) {
        checkmarkedSet.add(`pos:${fromCol}:${fromRow}`);
      }

      // Check if named CheckMark_CourseCode (stores pos-independent key as well for single student tab)
      if (shapeName.startsWith('CheckMark_')) {
        const codePart = shapeName.replace('CheckMark_', '').replace(/_/g, ' ');
        checkmarkedSet.add(`code:${normalizeCode(codePart)}`);
      }
    }
  } catch (err) {
    console.warn('Could not parse drawing checkmarks:', err);
  }
  return checkmarkedSet;
}

/**
 * Extracts a complete Student object from a cell map at a specific row offset.
 */
function extractStudentFromCells(cellMap, offset = 0, defaultSheetName = 'Student', redXfIndices, greenXfIndices, strikeXfIndices, drawingCheckmarks) {
  // Name at F(2 + offset)
  const f2Cell = cellMap.get(`F${2 + offset}`);
  let studentName = cleanArabicText(f2Cell?.strValue || defaultSheetName);

  // Student ID: Check if studentName has an ID or defaultSheetName has an ID
  let studentId = '';
  const idMatch = (defaultSheetName + ' ' + studentName).match(/\b(\d{7,10})\b/);
  if (idMatch) {
    studentId = idMatch[1];
  } else {
    studentId = defaultSheetName.replace(/[^0-9]/g, '') || `ID_${Math.floor(100000 + Math.random() * 900000)}`;
  }

  // CGPA at P(3 + offset)
  const p3Cell = cellMap.get(`P${3 + offset}`);
  const parsedCgpa = parseFloat(p3Cell?.strValue || '');
  const cgpa = !isNaN(parsedCgpa) ? parsedCgpa : 0.00;

  // Latest semester GPA at K(3 + offset)
  const k3Cell = cellMap.get(`K${3 + offset}`);
  const parsedLatestSemGpa = parseFloat(k3Cell?.strValue || '');
  const latestSemesterGpa = !isNaN(parsedLatestSemGpa) ? parsedLatestSemGpa : null;

  // AI Level at D(1 + offset)
  const d1Cell = cellMap.get(`D${1 + offset}`);
  const d1Str = (d1Cell?.strValue || '').toUpperCase();
  const levelMatch = d1Str.match(/(\d+)/);
  const aiLevel = levelMatch ? parseInt(levelMatch[1], 10) : 1;

  // GPA table records (W7, W11, W16, W20, W25, W30, W34, W38, W43, W47)
  const levelGpas = [];
  const gpaCellList = [
    { level: 0, gpaCell: 'W7' },
    { level: 0, gpaCell: 'W11' },
    { level: 1, gpaCell: 'W16' },
    { level: 1, gpaCell: 'W20' },
    { level: 2, gpaCell: 'W25' },
    { level: 2, gpaCell: 'W30' },
    { level: 3, gpaCell: 'W34' },
    { level: 3, gpaCell: 'W38' },
    { level: 4, gpaCell: 'W43' },
    { level: 4, gpaCell: 'W47' }
  ];

  gpaCellList.forEach(item => {
    const m = item.gpaCell.match(/^([A-Z]+)(\d+)$/);
    const targetRef = `${m[1]}${parseInt(m[2], 10) + offset}`;
    const cell = cellMap.get(targetRef);
    if (cell && cell.strValue) {
      const gpa = parseFloat(cell.strValue);
      if (!isNaN(gpa)) {
        levelGpas.push({
          level: item.level,
          gpa,
          gpaCell: item.gpaCell
        });
      }
    }
  });

  const courseMap = {};
  const selectedCourseCodes = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const course of ALL_COURSES) {
    const normCode = normalizeCode(course.code);
    const codeMatch = course.codeCell.match(/^([A-Z]+)(\d+)$/);
    const targetRow = parseInt(codeMatch[2], 10) + offset;
    const targetCodeRef = `${codeMatch[1]}${targetRow}`;

    const cellObj = cellMap.get(targetCodeRef);
    if (!cellObj) continue;

    const s = cellObj.s;
    const text = cellObj.strValue;

    // Check if course has checkmark prefix [✓] or is in green fill or drawing checkmarks
    const hasTextCheckmark = text.startsWith('[✓]') || text.startsWith('✓');
    const hasGreenFill = greenXfIndices.has(s);

    // Drawing checkmark matches:
    // 1) By exact position in this offset (works for single-sheet and multi-tab)
    const fromCol = columnLetterToIndex(codeMatch[1]) - 1;
    const fromRow = targetRow - 1;
    const hasPosCheck = drawingCheckmarks.has(`pos:${fromCol}:${fromRow}`);

    // 2) By code name if single student tab (offset === 0)
    const hasCodeCheck = offset === 0 && drawingCheckmarks.has(`code:${normCode}`);

    const isSelected = hasTextCheckmark || hasGreenFill || hasPosCheck || hasCodeCheck;

    // Check if passed (crossed out with diagonal down border)
    const isPassed = strikeXfIndices.has(s);

    // Check if 0.00 failed (red fill)
    const isZeroFailed = redXfIndices.has(s);

    if (isSelected) {
      selectedCourseCodes.push(course.code);
      // If selected course was previously failed, record it with points 0.00
      if (isZeroFailed) {
        courseMap[normCode] = {
          code: course.code,
          name: course.name,
          ch: course.ch,
          isPassed: false,
          points: 0.00,
          grade: 'F'
        };
        failedCount++;
      }
    } else if (isPassed) {
      courseMap[normCode] = {
        code: course.code,
        name: course.name,
        ch: course.ch,
        isPassed: true,
        points: 2.00, // passed default
        grade: 'P'
      };
      passedCount++;
    } else if (isZeroFailed) {
      courseMap[normCode] = {
        code: course.code,
        name: course.name,
        ch: course.ch,
        isPassed: false,
        points: 0.00,
        grade: 'F'
      };
      failedCount++;
    }
  }

  // If no courses were detected in this block, skip
  if (passedCount === 0 && failedCount === 0 && selectedCourseCodes.length === 0 && !cellMap.has(`F${2 + offset}`)) {
    return null;
  }

  return {
    studentName,
    studentId,
    cgpa,
    latestSemesterGpa,
    aiLevel,
    admissionYear: studentId.length >= 4 ? studentId.substring(0, 4) : null,
    registeredHours: null,
    achievedHours: passedCount * 3,
    program: 'Artificial Intelligence',
    rawCourses: Object.values(courseMap),
    courseMap,
    passedCount,
    failedCount,
    totalAttempted: Object.keys(courseMap).length,
    allSemesterTables: [],
    tableCount: aiLevel,
    regularSemesters: [],
    summerSemesters: [],
    levelGpas,
    selectedCourseCodes
  };
}
