import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { ALL_COURSES, normalizeCode } from './courseMapping.js';
import { cleanArabicText } from './pdfParser.js';

const SPREADSHEETML_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const PACKAGE_RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OFFICE_RELS_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';

/**
 * Sanitizes sheet name for Excel rules (max 31 chars, no invalid characters)
 */
function sanitizeSheetName(name, existingNames) {
  let clean = cleanArabicText(name || 'Student')
    .replace(/[\\\/\?\*\[\]\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length > 30) {
    clean = clean.substring(0, 30).trim();
  }
  let finalName = clean;
  let counter = 1;
  while (existingNames.has(finalName.toLowerCase())) {
    const suffix = ` (${counter})`;
    finalName = clean.substring(0, 30 - suffix.length) + suffix;
    counter++;
  }
  existingNames.add(finalName.toLowerCase());
  return finalName;
}

function parseXml(xmlStr) {
  return new DOMParser().parseFromString(xmlStr, 'application/xml');
}

function serializeXml(doc) {
  return new XMLSerializer().serializeToString(doc);
}

function getAiLevelLabel(student) {
  const lastLevel = student.levelGpas?.at(-1)?.level;
  const level = Number.isInteger(lastLevel)
    ? lastLevel + 1
    : Math.max(1, student.aiLevel ?? student.allSemesterTables?.length ?? 1);
  const suffix = level % 100 >= 11 && level % 100 <= 13
    ? 'TH'
    : ({ 1: 'ST', 2: 'ND', 3: 'RD' }[level % 10] || 'TH');
  return `${level}${suffix} AI-LEVEL`;
}

/**
 * Helper to prepare styles.xml with Strike font, Red failed font, Red fill, and X-Cross border
 */
function prepareStyles(stylesDoc, options = {}) {
  const {
    crossColor = 'FF000000', // Solid black (darker & high-contrast)
    crossStyle = 'medium',   // Medium line style for a thicker, darker cross
    failedRedFill = 'FFFFC7CE', // Standard Excel light red fill
    failedRedText = 'FF9C0006', // Standard Excel dark red bold text
    selectedGreenFill = 'FFC6EFCE', // Distinct vibrant light green fill
    selectedGreenText = 'FF006100'  // Distinct deep bold green text
  } = options;

  const fontsEl = stylesDoc.getElementsByTagName('fonts')[0];
  const fillsEl = stylesDoc.getElementsByTagName('fills')[0];
  const bordersEl = stylesDoc.getElementsByTagName('borders')[0];
  const cellXfsEl = stylesDoc.getElementsByTagName('cellXfs')[0];

  const origFontsCount = parseInt(fontsEl.getAttribute('count') || '0', 10);
  const origFillsCount = parseInt(fillsEl.getAttribute('count') || '0', 10);
  const origBordersCount = parseInt(bordersEl.getAttribute('count') || '0', 10);

  // --- a) Strike Font (for passed courses) ---
  const strikeFontId = origFontsCount;
  const strikeFontEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'font');
  const strikeEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'strike');
  strikeEl.setAttribute('val', '1');
  strikeFontEl.appendChild(strikeEl);

  const szEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'sz');
  szEl.setAttribute('val', '10');
  strikeFontEl.appendChild(szEl);

  const colorEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'color');
  colorEl.setAttribute('rgb', 'FF000000');
  strikeFontEl.appendChild(colorEl);

  const nameEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'name');
  nameEl.setAttribute('val', 'Calibri');
  strikeFontEl.appendChild(nameEl);

  fontsEl.appendChild(strikeFontEl);

  // --- b) Failed Red Font (for 0.00 failed courses) ---
  const redFontId = origFontsCount + 1;
  const redFontEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'font');
  const bEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'b');
  redFontEl.appendChild(bEl);

  const redSzEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'sz');
  redSzEl.setAttribute('val', '11');
  redFontEl.appendChild(redSzEl);

  const redColorEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'color');
  redColorEl.setAttribute('rgb', failedRedText);
  redFontEl.appendChild(redColorEl);

  const redNameEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'name');
  redNameEl.setAttribute('val', 'Calibri');
  redFontEl.appendChild(redNameEl);

  fontsEl.appendChild(redFontEl);

  // --- b2) Selected Subject Bold Green Font (for checked registered courses) ---
  const greenFontId = origFontsCount + 2;
  const greenFontEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'font');
  const gbEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'b');
  greenFontEl.appendChild(gbEl);

  const greenSzEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'sz');
  greenSzEl.setAttribute('val', '11');
  greenFontEl.appendChild(greenSzEl);

  const greenColorEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'color');
  greenColorEl.setAttribute('rgb', selectedGreenText);
  greenFontEl.appendChild(greenColorEl);

  const greenNameEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'name');
  greenNameEl.setAttribute('val', 'Calibri');
  greenFontEl.appendChild(greenNameEl);

  fontsEl.appendChild(greenFontEl);
  fontsEl.setAttribute('count', String(origFontsCount + 3));

  // --- c) Failed Red Fill ---
  const redFillId = origFillsCount;
  const redFillEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'fill');
  const pfEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'patternFill');
  pfEl.setAttribute('patternType', 'solid');
  const fgEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'fgColor');
  fgEl.setAttribute('rgb', failedRedFill);
  pfEl.appendChild(fgEl);
  redFillEl.appendChild(pfEl);
  fillsEl.appendChild(redFillEl);

  // --- c2) Selected Green Fill (Checkpoint fill) ---
  const greenFillId = origFillsCount + 1;
  const greenFillEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'fill');
  const gpfEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'patternFill');
  gpfEl.setAttribute('patternType', 'solid');
  const gfgEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'fgColor');
  gfgEl.setAttribute('rgb', selectedGreenFill);
  gpfEl.appendChild(gfgEl);
  greenFillEl.appendChild(gpfEl);
  fillsEl.appendChild(greenFillEl);

  fillsEl.setAttribute('count', String(origFillsCount + 2));

  // --- d) Clone Borders with single diagonal "\" (diagonalDown="1") ---
  const origBorderEls = Array.from(bordersEl.getElementsByTagName('border'));
  const xBorderMap = {};

  origBorderEls.forEach((bEl, bIdx) => {
    const clonedBorder = bEl.cloneNode(true);
    // Single backslash "\" = diagonalDown only (top-left to bottom-right)
    clonedBorder.removeAttribute('diagonalUp');
    clonedBorder.setAttribute('diagonalDown', '1');

    let diagEl = clonedBorder.getElementsByTagName('diagonal')[0];
    if (!diagEl) {
      diagEl = stylesDoc.createElementNS(SPREADSHEETML_NS, 'diagonal');
      clonedBorder.appendChild(diagEl);
    }
    diagEl.setAttribute('style', crossStyle);

    while (diagEl.firstChild) diagEl.removeChild(diagEl.firstChild);
    const diagColor = stylesDoc.createElementNS(SPREADSHEETML_NS, 'color');
    diagColor.setAttribute('rgb', crossColor);
    diagEl.appendChild(diagColor);

    const newBorderId = origBordersCount + bIdx;
    xBorderMap[bIdx] = newBorderId;
    bordersEl.appendChild(clonedBorder);
  });

  bordersEl.setAttribute('count', String(origBordersCount * 2));

  // --- e) Clone cellXfs ---
  const origXfEls = Array.from(cellXfsEl.getElementsByTagName('xf'));
  const origXfCount = origXfEls.length;
  const strikeMap = {};
  const failedMap = {};
  const selectedMap = {};

  origXfEls.forEach((xf, idx) => {
    const clonedXf = xf.cloneNode(true);
    clonedXf.setAttribute('fontId', String(strikeFontId));
    clonedXf.setAttribute('applyFont', '1');

    const origBId = parseInt(xf.getAttribute('borderId') || '0', 10);
    const newBId = xBorderMap[origBId] !== undefined ? xBorderMap[origBId] : origBId;
    clonedXf.setAttribute('borderId', String(newBId));
    clonedXf.setAttribute('applyBorder', '1');

    const newIdx = origXfCount + idx;
    strikeMap[idx] = newIdx;
    cellXfsEl.appendChild(clonedXf);
  });

  origXfEls.forEach((xf, idx) => {
    const clonedXf = xf.cloneNode(true);
    clonedXf.setAttribute('fontId', String(redFontId));
    clonedXf.setAttribute('fillId', String(redFillId));
    clonedXf.setAttribute('applyFont', '1');
    clonedXf.setAttribute('applyFill', '1');

    const newIdx = origXfCount * 2 + idx;
    failedMap[idx] = newIdx;
    cellXfsEl.appendChild(clonedXf);
  });

  origXfEls.forEach((xf, idx) => {
    const clonedXf = xf.cloneNode(true);
    clonedXf.setAttribute('fontId', String(greenFontId));
    clonedXf.setAttribute('fillId', String(greenFillId));
    clonedXf.setAttribute('applyFont', '1');
    clonedXf.setAttribute('applyFill', '1');

    const newIdx = origXfCount * 3 + idx;
    selectedMap[idx] = newIdx;
    cellXfsEl.appendChild(clonedXf);
  });

  cellXfsEl.setAttribute('count', String(origXfCount * 4));
  return { strikeMap, failedMap, selectedMap };
}

/**
 * Builds cell sets for a student with given row offset:
 * returns { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap }
 */
function buildStudentCellMaps(student, offset = 0) {
  const cellsToCrossWithX = new Set();
  const cellsToFailRed = new Set();
  const cellsToSelectGreen = new Set();
  const checkpointTextMap = {};
  const gpaValuesMap = {};

  // Set of normalized course codes that the user has selected/checkpointed
  const selectedSet = new Set((student.selectedCourseCodes || []).map(normalizeCode));

  if (student.levelGpas) {
    student.levelGpas.forEach(lg => {
      if (lg.gpaCell && lg.gpa !== null && lg.gpa !== undefined) {
        const m = lg.gpaCell.match(/^([A-Z]+)(\d+)$/);
        if (m) {
          const targetRef = `${m[1]}${parseInt(m[2], 10) + offset}`;
          gpaValuesMap[targetRef] = lg.gpa.toFixed(2);
        }
      }
    });
  }
  if (student.latestSemesterGpa !== null && student.latestSemesterGpa !== undefined) {
    gpaValuesMap[`K${3 + offset}`] = student.latestSemesterGpa.toFixed(2);
  }

  for (const course of ALL_COURSES) {
    const normCode = normalizeCode(course.code);
    let studentCourse = student.courseMap[normCode];
    if (!studentCourse && course.aliases) {
      for (const alias of course.aliases) {
        if (student.courseMap[normalizeCode(alias)]) {
          studentCourse = student.courseMap[normalizeCode(alias)];
          break;
        }
      }
    }

    const allCourseRefs = [
      offsetCellRef(course.codeCell, offset),
      offsetCellRef(course.titleCell, offset)
    ];

    if (course.mergeRange) {
      const [start, end] = course.mergeRange.split(':');
      expandCellRange(start, end).forEach(ref => allCourseRefs.push(offsetCellRef(ref, offset)));
    }

    const isSelected = selectedSet.has(normCode) || (course.aliases && course.aliases.some(a => selectedSet.has(normalizeCode(a))));

    if (isSelected) {
      // Checked / selected checkpoint subject: render bold in distinct color with checkmark prefix [✓]
      allCourseRefs.forEach(ref => cellsToSelectGreen.add(ref));
      const codeCellRef = offsetCellRef(course.codeCell, offset);
      checkpointTextMap[codeCellRef] = `[✓] ${course.code}`;
    } else if (studentCourse && studentCourse.isPassed && studentCourse.points > 0.00) {
      // Passed courses remain crossed out with diagonal strike
      allCourseRefs.forEach(ref => cellsToCrossWithX.add(ref));
    } else if (studentCourse && studentCourse.points === 0.00) {
      // 0.00 failed subject that has not been selected
      allCourseRefs.forEach(ref => cellsToFailRed.add(ref));
    }
  }

  return { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap };
}

function offsetCellRef(ref, offset) {
  if (!offset) return ref;
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return ref;
  return `${m[1]}${parseInt(m[2], 10) + offset}`;
}

/**
 * OPTION 1: Multi-Sheet Generator (1 worksheet tab per student)
 */
export async function generatePreservedExcelWorkbook(templateBuffer, studentTranscripts, options = {}) {
  const zip = await JSZip.loadAsync(templateBuffer);

  const stylesXmlStr = await zip.file('xl/styles.xml').async('text');
  const stylesDoc = parseXml(stylesXmlStr);
  const { strikeMap, failedMap, selectedMap } = prepareStyles(stylesDoc, options);
  zip.file('xl/styles.xml', serializeXml(stylesDoc));

  const templateSheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  const templateRelsXml = await zip.file('xl/worksheets/_rels/sheet1.xml.rels').async('text');
  const templateDrawingXml = await zip.file('xl/drawings/drawing1.xml').async('text');

  const workbookXmlStr = await zip.file('xl/workbook.xml').async('text');
  const workbookDoc = parseXml(workbookXmlStr);
  const sheetsEl = workbookDoc.getElementsByTagName('sheets')[0];

  const wbRelsXmlStr = await zip.file('xl/_rels/workbook.xml.rels').async('text');
  const wbRelsDoc = parseXml(wbRelsXmlStr);
  const wbRelationshipsEl = wbRelsDoc.getElementsByTagName('Relationships')[0];

  const contentTypesXmlStr = await zip.file('[Content_Types].xml').async('text');
  const contentTypesDoc = parseXml(contentTypesXmlStr);
  const typesEl = contentTypesDoc.getElementsByTagName('Types')[0];

  while (sheetsEl.firstChild) sheetsEl.removeChild(sheetsEl.firstChild);
  zip.remove('xl/worksheets/sheet1.xml');
  zip.remove('xl/worksheets/_rels/sheet1.xml.rels');
  zip.remove('xl/drawings/drawing1.xml');

  Array.from(wbRelationshipsEl.getElementsByTagName('Relationship')).forEach((relationship) => {
    const type = relationship.getAttribute('Type') || '';
    if (type.endsWith('/worksheet') || type.endsWith('/drawing')) {
      wbRelationshipsEl.removeChild(relationship);
    }
  });

  Array.from(typesEl.getElementsByTagName('Override')).forEach((override) => {
    const partName = override.getAttribute('PartName') || '';
    if (partName.startsWith('/xl/worksheets/sheet') || partName.startsWith('/xl/drawings/drawing')) {
      typesEl.removeChild(override);
    }
  });

  const existingSheetNames = new Set();

  studentTranscripts.forEach((student, sIdx) => {
    const sheetNum = sIdx + 1;
    const rawSheetName = student.studentName || student.studentId || `Student ${sheetNum}`;
    const sheetName = sanitizeSheetName(rawSheetName, existingSheetNames);

    const sheetDoc = parseXml(templateSheetXml);
    const { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap } = buildStudentCellMaps(student, 0);

    const allCells = Array.from(sheetDoc.getElementsByTagName('c'));
    for (const c of allCells) {
      const r = c.getAttribute('r');
      if (r === 'F2') {
        c.setAttribute('t', 'inlineStr');
        while (c.firstChild) c.removeChild(c.firstChild);
        const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
        const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
        tEl.textContent = cleanArabicText(student.studentName);
        isEl.appendChild(tEl);
        c.appendChild(isEl);
      } else if (r === 'D1') {
        c.setAttribute('t', 'inlineStr');
        while (c.firstChild) c.removeChild(c.firstChild);
        const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
        const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
        tEl.textContent = getAiLevelLabel(student);
        isEl.appendChild(tEl);
        c.appendChild(isEl);
      } else if (r === 'P3' && student.cgpa !== null && student.cgpa !== undefined) {
        while (c.firstChild) c.removeChild(c.firstChild);
        const vEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
        vEl.textContent = student.cgpa.toFixed(2);
        c.appendChild(vEl);
      } else if (r === 'W51' && student.cgpa !== null && student.cgpa !== undefined) {
        while (c.firstChild) c.removeChild(c.firstChild);
        const fEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'f');
        fEl.textContent = '$P3';
        c.appendChild(fEl);
        const vEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
        vEl.textContent = student.cgpa.toFixed(2);
        c.appendChild(vEl);
      } else if (gpaValuesMap[r] !== undefined) {
        while (c.firstChild) c.removeChild(c.firstChild);
        const vEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
        vEl.textContent = gpaValuesMap[r];
        c.appendChild(vEl);
      } else if (checkpointTextMap[r] !== undefined) {
        // Add check point tag [✓] to the course code cell
        c.setAttribute('t', 'inlineStr');
        while (c.firstChild) c.removeChild(c.firstChild);
        const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
        const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
        tEl.textContent = checkpointTextMap[r];
        isEl.appendChild(tEl);
        c.appendChild(isEl);
      }

      const origS = parseInt(c.getAttribute('s') || '0', 10);
      if (cellsToCrossWithX.has(r)) {
        if (strikeMap[origS] !== undefined) c.setAttribute('s', String(strikeMap[origS]));
      } else if (cellsToSelectGreen.has(r)) {
        if (selectedMap[origS] !== undefined) c.setAttribute('s', String(selectedMap[origS]));
      } else if (cellsToFailRed.has(r)) {
        if (failedMap[origS] !== undefined) c.setAttribute('s', String(failedMap[origS]));
      }
    }

    let drawingTag = sheetDoc.getElementsByTagName('drawing')[0];
    if (!drawingTag) {
      drawingTag = sheetDoc.createElementNS(SPREADSHEETML_NS, 'drawing');
      drawingTag.setAttributeNS(OFFICE_RELS_NS, 'r:id', 'rId1');
      sheetDoc.documentElement.appendChild(drawingTag);
    } else {
      drawingTag.setAttributeNS(OFFICE_RELS_NS, 'r:id', 'rId1');
    }

    const sheetPath = `xl/worksheets/sheet${sheetNum}.xml`;
    const relsPath = `xl/worksheets/_rels/sheet${sheetNum}.xml.rels`;
    const drawingPath = `xl/drawings/drawing${sheetNum}.xml`;

    zip.file(sheetPath, serializeXml(sheetDoc));

    const sheetRelsDoc = parseXml(templateRelsXml);
    const relEl = sheetRelsDoc.getElementsByTagName('Relationship')[0];
    if (relEl) {
      relEl.setAttribute('Target', `../drawings/drawing${sheetNum}.xml`);
      relEl.setAttribute('Id', 'rId1');
    }
    zip.file(relsPath, serializeXml(sheetRelsDoc));
    zip.file(drawingPath, templateDrawingXml);

    const sheetEntry = workbookDoc.createElementNS(SPREADSHEETML_NS, 'sheet');
    sheetEntry.setAttribute('name', sheetName);
    sheetEntry.setAttribute('sheetId', String(sheetNum));
    sheetEntry.setAttributeNS(OFFICE_RELS_NS, 'r:id', `rIdSheet${sheetNum}`);
    sheetsEl.appendChild(sheetEntry);

    const wbRelEntry = wbRelsDoc.createElementNS(PACKAGE_RELS_NS, 'Relationship');
    wbRelEntry.setAttribute('Id', `rIdSheet${sheetNum}`);
    wbRelEntry.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet');
    wbRelEntry.setAttribute('Target', `worksheets/sheet${sheetNum}.xml`);
    wbRelationshipsEl.appendChild(wbRelEntry);

    const overrideSheet = contentTypesDoc.createElementNS('http://schemas.openxmlformats.org/package/2006/content-types', 'Override');
    overrideSheet.setAttribute('PartName', `/xl/worksheets/sheet${sheetNum}.xml`);
    overrideSheet.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');
    typesEl.appendChild(overrideSheet);

    const overrideDrawing = contentTypesDoc.createElementNS('http://schemas.openxmlformats.org/package/2006/content-types', 'Override');
    overrideDrawing.setAttribute('PartName', `/xl/drawings/drawing${sheetNum}.xml`);
    overrideDrawing.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.drawing+xml');
    typesEl.appendChild(overrideDrawing);
  });

  zip.file('xl/workbook.xml', serializeXml(workbookDoc));
  zip.file('xl/_rels/workbook.xml.rels', serializeXml(wbRelsDoc));
  zip.file('[Content_Types].xml', serializeXml(contentTypesDoc));

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * OPTION 2: Single-Sheet Combined Generator (All students stacked in ONE single worksheet)
 */
export async function generateSingleSheetCombinedWorkbook(templateBuffer, studentTranscripts, options = {}) {
  const zip = await JSZip.loadAsync(templateBuffer);

  const stylesXmlStr = await zip.file('xl/styles.xml').async('text');
  const stylesDoc = parseXml(stylesXmlStr);
  const { strikeMap, failedMap, selectedMap } = prepareStyles(stylesDoc, options);
  zip.file('xl/styles.xml', serializeXml(stylesDoc));

  const templateSheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  const templateDrawingXml = await zip.file('xl/drawings/drawing1.xml').async('text');

  const sheetDoc = parseXml(templateSheetXml);
  const drawingDoc = parseXml(templateDrawingXml);

  const sheetDataEl = sheetDoc.getElementsByTagName('sheetData')[0];
  const mergeCellsEl = sheetDoc.getElementsByTagName('mergeCells')[0];

  // Capture template original rows
  const templateRows = Array.from(sheetDataEl.getElementsByTagName('row'));
  while (sheetDataEl.firstChild) sheetDataEl.removeChild(sheetDataEl.firstChild);

  // Capture template original merges
  const templateMerges = mergeCellsEl ? Array.from(mergeCellsEl.getElementsByTagName('mergeCell')) : [];
  if (mergeCellsEl) {
    while (mergeCellsEl.firstChild) mergeCellsEl.removeChild(mergeCellsEl.firstChild);
  }

  // Capture template original drawing anchors
  const wsDrEl = drawingDoc.getElementsByTagName('xdr:wsDr')[0] || drawingDoc.documentElement;
  const templateAnchors = Array.from(drawingDoc.getElementsByTagName('xdr:twoCellAnchor'));
  while (wsDrEl.firstChild) wsDrEl.removeChild(wsDrEl.firstChild);

  // Stacking block height per student (52 rows of content + 3 blank gap rows = 55 rows per student)
  const ROW_BLOCK_SIZE = 55;

  studentTranscripts.forEach((student, sIdx) => {
    const offset = sIdx * ROW_BLOCK_SIZE;
    const { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap } = buildStudentCellMaps(student, offset);

    // 1. Append Rows for this student
    templateRows.forEach((origRow) => {
      const origRowNum = parseInt(origRow.getAttribute('r'), 10);
      const newRowNum = origRowNum + offset;

      const clonedRow = origRow.cloneNode(true);
      clonedRow.setAttribute('r', String(newRowNum));

      const cellNodes = Array.from(clonedRow.getElementsByTagName('c'));
      cellNodes.forEach((c) => {
        const oldRef = c.getAttribute('r');
        const colLetter = oldRef.replace(/[0-9]/g, '');
        const newRef = `${colLetter}${newRowNum}`;
        c.setAttribute('r', newRef);

        // Update Student Name
        if (colLetter === 'F' && origRowNum === 2) {
          c.setAttribute('t', 'inlineStr');
          while (c.firstChild) c.removeChild(c.firstChild);
          const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
          const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
          tEl.textContent = cleanArabicText(student.studentName);
          isEl.appendChild(tEl);
          c.appendChild(isEl);
        }
        // Update AI-level header in D1
        else if (colLetter === 'D' && origRowNum === 1) {
          c.setAttribute('t', 'inlineStr');
          while (c.firstChild) c.removeChild(c.firstChild);
          const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
          const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
          tEl.textContent = getAiLevelLabel(student);
          isEl.appendChild(tEl);
          c.appendChild(isEl);
        }
        // Update CGPA in top header (P3)
        else if (colLetter === 'P' && origRowNum === 3 && student.cgpa !== null && student.cgpa !== undefined) {
          while (c.firstChild) c.removeChild(c.firstChild);
          const vEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
          vEl.textContent = student.cgpa.toFixed(2);
          c.appendChild(vEl);
        }
        // Update CGPA in bottom summary box (W51)
        else if (colLetter === 'W' && origRowNum === 51 && student.cgpa !== null && student.cgpa !== undefined) {
          while (c.firstChild) c.removeChild(c.firstChild);
          const fEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'f');
          const targetPRow = 3 + offset;
          fEl.textContent = `$P$${targetPRow}`;
          c.appendChild(fEl);
          const vEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
          vEl.textContent = student.cgpa.toFixed(2);
          c.appendChild(vEl);
        }
        // Update Semester GPA
        else if (gpaValuesMap[newRef] !== undefined) {
          while (c.firstChild) c.removeChild(c.firstChild);
          const vEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
          vEl.textContent = gpaValuesMap[newRef];
          c.appendChild(vEl);
        }
        // Update checkpoint label [✓]
        else if (checkpointTextMap[newRef] !== undefined) {
          c.setAttribute('t', 'inlineStr');
          while (c.firstChild) c.removeChild(c.firstChild);
          const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
          const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
          tEl.textContent = checkpointTextMap[newRef];
          isEl.appendChild(tEl);
          c.appendChild(isEl);
        }

        const origS = parseInt(c.getAttribute('s') || '0', 10);
        if (cellsToCrossWithX.has(newRef)) {
          if (strikeMap[origS] !== undefined) c.setAttribute('s', String(strikeMap[origS]));
        } else if (cellsToSelectGreen.has(newRef)) {
          if (selectedMap[origS] !== undefined) c.setAttribute('s', String(selectedMap[origS]));
        } else if (cellsToFailRed.has(newRef)) {
          if (failedMap[origS] !== undefined) c.setAttribute('s', String(failedMap[origS]));
        }
      });

      sheetDataEl.appendChild(clonedRow);
    });

    // 2. Append Merges for this student
    if (mergeCellsEl) {
      templateMerges.forEach((m) => {
        const ref = m.getAttribute('ref');
        const [start, end] = ref.split(':');
        const newRef = `${offsetCellRef(start, offset)}:${offsetCellRef(end, offset)}`;
        const newM = sheetDoc.createElementNS(SPREADSHEETML_NS, 'mergeCell');
        newM.setAttriubte ? newM.setAttriubte('ref', newRef) : newM.setAttribute('ref', newRef);
        mergeCellsEl.appendChild(newM);
      });
    }

    // 3. Append Drawing Connectors & Arrows for this student
    templateAnchors.forEach((anchor) => {
      const clonedAnchor = anchor.cloneNode(true);
      const fromRowEl = clonedAnchor.getElementsByTagName('xdr:from')[0]?.getElementsByTagName('xdr:row')[0];
      const toRowEl = clonedAnchor.getElementsByTagName('xdr:to')[0]?.getElementsByTagName('xdr:row')[0];

      if (fromRowEl) {
        fromRowEl.textContent = String(parseInt(fromRowEl.textContent, 10) + offset);
      }
      if (toRowEl) {
        toRowEl.textContent = String(parseInt(toRowEl.textContent, 10) + offset);
      }
      wsDrEl.appendChild(clonedAnchor);
    });
  });

  if (mergeCellsEl) {
    mergeCellsEl.setAttribute('count', String(templateMerges.length * studentTranscripts.length));
  }

  // Rename single sheet to "All Students Combined" in workbook.xml
  const workbookXmlStr = await zip.file('xl/workbook.xml').async('text');
  const workbookDoc = parseXml(workbookXmlStr);
  const firstSheetEl = workbookDoc.getElementsByTagName('sheet')[0];
  if (firstSheetEl) {
    firstSheetEl.setAttribute('name', 'All Students Combined');
  }
  zip.file('xl/workbook.xml', serializeXml(workbookDoc));

  zip.file('xl/worksheets/sheet1.xml', serializeXml(sheetDoc));
  zip.file('xl/drawings/drawing1.xml', serializeXml(drawingDoc));

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

function expandCellRange(start, end) {
  const startCol = start.replace(/[0-9]/g, '');
  const startRow = parseInt(start.replace(/[A-Z]/gi, ''), 10);
  const endCol = end.replace(/[0-9]/g, '');
  const endRow = parseInt(end.replace(/[A-Z]/gi, ''), 10);

  const startColIdx = columnLetterToIndex(startCol);
  const endColIdx = columnLetterToIndex(endCol);

  const refs = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      refs.push(`${indexToColumnLetter(c)}${r}`);
    }
  }
  return refs;
}

function columnLetterToIndex(letters) {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index;
}

function indexToColumnLetter(index) {
  let temp = index;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}
