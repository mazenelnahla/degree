import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { ALL_COURSES, PREREQUISITE_LINKS, normalizeCode } from './courseMapping.js';
import { cleanArabicText } from './pdfParser.js';
import { populateRegistrationSheet } from './regFormGenerator.js';

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
  const selectedCourses = [];

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
      selectedCourses.push({ course, offset });
    } else if (studentCourse && studentCourse.isPassed && studentCourse.points > 0.00) {
      // Passed courses remain crossed out with diagonal strike
      allCourseRefs.forEach(ref => cellsToCrossWithX.add(ref));
    } else if (studentCourse && studentCourse.points === 0.00) {
      // 0.00 failed subject that has not been selected
      allCourseRefs.forEach(ref => cellsToFailRed.add(ref));
    }
  }

  return { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap, selectedCourses };
}

/**
 * Creates an OOXML DrawingML checkmark shape element that covers the subject cell bounding box.
 */
function createCheckmarkAnchor(drawingDoc, course, offset = 0, shapeId = 1000) {
  const codeMatch = course.codeCell.match(/^([A-Z]+)(\d+)$/);
  const [mStart, mEnd] = (course.mergeRange || `${course.codeCell}:${course.codeCell}`).split(':');
  const endMatch = mEnd.match(/^([A-Z]+)(\d+)$/);

  const fromCol = columnLetterToIndex(codeMatch[1]) - 1; // 0-indexed
  const fromRow = parseInt(codeMatch[2], 10) - 1 + offset; // 0-indexed
  const toCol = columnLetterToIndex(endMatch[1]); // exclusive boundary
  const toRow = parseInt(endMatch[2], 10) + offset; // exclusive boundary

  const twoCellAnchor = drawingDoc.createElementNS(DRAWING_NS, 'xdr:twoCellAnchor');

  // <xdr:from>
  const fromEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:from');
  const fromColEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:col');
  fromColEl.textContent = String(fromCol);
  const fromColOffEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:colOff');
  fromColOffEl.textContent = '60000';
  const fromRowEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:row');
  fromRowEl.textContent = String(fromRow);
  const fromRowOffEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:rowOff');
  fromRowOffEl.textContent = '40000';
  fromEl.appendChild(fromColEl);
  fromEl.appendChild(fromColOffEl);
  fromEl.appendChild(fromRowEl);
  fromEl.appendChild(fromRowOffEl);
  twoCellAnchor.appendChild(fromEl);

  // <xdr:to>
  const toEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:to');
  const toColEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:col');
  toColEl.textContent = String(toCol);
  const toColOffEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:colOff');
  toColOffEl.textContent = '-60000';
  const toRowEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:row');
  toRowEl.textContent = String(toRow);
  const toRowOffEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:rowOff');
  toRowOffEl.textContent = '-40000';
  toEl.appendChild(toColEl);
  toEl.appendChild(toColOffEl);
  toEl.appendChild(toRowEl);
  toEl.appendChild(toRowOffEl);
  twoCellAnchor.appendChild(toEl);

  // <xdr:sp>
  const spEl = drawingDoc.createElementNS(DRAWING_NS, 'xdr:sp');
  spEl.setAttribute('macro', '');
  spEl.setAttribute('textlink', '');

  // nvSpPr
  const nvSpPr = drawingDoc.createElementNS(DRAWING_NS, 'xdr:nvSpPr');
  const cNvPr = drawingDoc.createElementNS(DRAWING_NS, 'xdr:cNvPr');
  cNvPr.setAttribute('id', String(shapeId));
  cNvPr.setAttribute('name', `CheckMark_${course.code.replace(/\s+/g, '_')}`);
  const cNvSpPr = drawingDoc.createElementNS(DRAWING_NS, 'xdr:cNvSpPr');
  nvSpPr.appendChild(cNvPr);
  nvSpPr.appendChild(cNvSpPr);
  spEl.appendChild(nvSpPr);

  // spPr
  const spPr = drawingDoc.createElementNS(DRAWING_NS, 'xdr:spPr');

  // custGeom
  const custGeom = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:custGeom');
  custGeom.appendChild(drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:avLst'));
  custGeom.appendChild(drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:gdLst'));
  custGeom.appendChild(drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:ahLst'));
  custGeom.appendChild(drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:cxnLst'));

  const rectEl = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:rect');
  rectEl.setAttribute('l', '0');
  rectEl.setAttribute('t', '0');
  rectEl.setAttribute('r', '1000');
  rectEl.setAttribute('b', '1000');
  custGeom.appendChild(rectEl);

  const pathLst = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:pathLst');
  const path = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:path');
  path.setAttribute('w', '1000');
  path.setAttribute('h', '1000');
  path.setAttribute('stroke', '0');
  path.setAttribute('fill', 'norm');

  // Checkmark vector path
  const addPt = (type, x, y) => {
    const el = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', `a:${type}`);
    const pt = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:pt');
    pt.setAttribute('x', String(x));
    pt.setAttribute('y', String(y));
    el.appendChild(pt);
    path.appendChild(el);
  };

  addPt('moveTo', 120, 520);
  addPt('lnTo', 380, 820);
  addPt('lnTo', 880, 180);
  addPt('lnTo', 800, 120);
  addPt('lnTo', 370, 670);
  addPt('lnTo', 190, 460);
  path.appendChild(drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:close'));
  pathLst.appendChild(path);
  custGeom.appendChild(pathLst);
  spPr.appendChild(custGeom);

  // solidFill (emerald green #000000ff)
  const solidFill = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:solidFill');
  const srgbClr = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:srgbClr');
  srgbClr.setAttribute('val', '000000');
  solidFill.appendChild(srgbClr);
  spPr.appendChild(solidFill);

  // ln (border: dark green #047857)
  const ln = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:ln');
  ln.setAttribute('w', '25400'); // 2pt line width
  const lnFill = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:solidFill');
  const lnClr = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:srgbClr');
  lnClr.setAttribute('val', '047857');
  lnFill.appendChild(lnClr);
  ln.appendChild(lnFill);
  spPr.appendChild(ln);

  // outer shadow effect for clean depth
  const effectLst = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:effectLst');
  const outerShdw = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:outerShdw');
  outerShdw.setAttribute('blurRad', '40000');
  outerShdw.setAttribute('dist', '20000');
  outerShdw.setAttribute('dir', '5400000');
  outerShdw.setAttribute('algn', 'tl');
  const shdwClr = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:srgbClr');
  shdwClr.setAttribute('val', '000000');
  const alpha = drawingDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:alpha');
  alpha.setAttribute('val', '25000');
  shdwClr.appendChild(alpha);
  outerShdw.appendChild(shdwClr);
  effectLst.appendChild(outerShdw);
  spPr.appendChild(effectLst);

  spEl.appendChild(spPr);
  twoCellAnchor.appendChild(spEl);

  const clientData = drawingDoc.createElementNS(DRAWING_NS, 'xdr:clientData');
  twoCellAnchor.appendChild(clientData);

  return twoCellAnchor;
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
    const { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap, selectedCourses } = buildStudentCellMaps(student, 0);

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

    // Append Checkmark shapes covering each selected course cell
    const studentDrawingDoc = parseXml(templateDrawingXml);
    const studentWsDrEl = studentDrawingDoc.getElementsByTagName('xdr:wsDr')[0] || studentDrawingDoc.documentElement;
    if (selectedCourses && selectedCourses.length > 0) {
      selectedCourses.forEach((sc, scIdx) => {
        const shapeId = 1000 + scIdx;
        const checkmarkAnchor = createCheckmarkAnchor(studentDrawingDoc, sc.course, 0, shapeId);
        studentWsDrEl.appendChild(checkmarkAnchor);
      });
    }
    zip.file(drawingPath, serializeXml(studentDrawingDoc));

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
    const { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap, selectedCourses } = buildStudentCellMaps(student, offset);

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

    // 4. Append Checkmark shapes covering each selected course cell for this student
    if (selectedCourses && selectedCourses.length > 0) {
      selectedCourses.forEach((sc, scIdx) => {
        const shapeId = 5000 + (sIdx * 100) + scIdx;
        const checkmarkAnchor = createCheckmarkAnchor(drawingDoc, sc.course, offset, shapeId);
        wsDrEl.appendChild(checkmarkAnchor);
      });
    }
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

/**
 * OPTION 3: Combined Degree Tree + Registration Form on the SAME Sheet for each student
 * Top block: Degree Tree audit curriculum (rows 1-52) with all prerequisite lines & checkpoints
 * Page Break: Inserted after degree tree (row 54) so printing or viewing has Tree on Page 1
 * Bottom block: Registration Form (rows 56-88) populated with student details and registered courses
 */
export async function generateCombinedTreeAndRegistrationWorkbook(templateBuffer, regTemplateBuffer, studentTranscripts, options = {}) {
  const { prerequisiteLinks = PREREQUISITE_LINKS } = options;

  // 1. Load both template zip archives
  const zip = await JSZip.loadAsync(templateBuffer);
  const regZip = await JSZip.loadAsync(regTemplateBuffer);

  // 2. Prepare and merge styles.xml (template styles + reg.xlsx styles)
  const stylesXmlStr = await zip.file('xl/styles.xml').async('text');
  const stylesDoc = parseXml(stylesXmlStr);
  const { strikeMap, failedMap, selectedMap } = prepareStyles(stylesDoc, options);

  const regStylesXmlStr = await regZip.file('xl/styles.xml').async('text');
  const regStylesDoc = parseXml(regStylesXmlStr);

  // Merge fonts from regStylesDoc into stylesDoc
  const fontsEl = stylesDoc.getElementsByTagName('fonts')[0];
  const origFontsCount = fontsEl.getElementsByTagName('font').length;
  const regFontEls = Array.from(regStylesDoc.getElementsByTagName('font'));
  const fontMap = {};
  regFontEls.forEach((rf, i) => {
    const newF = stylesDoc.importNode(rf, true);
    fontsEl.appendChild(newF);
    fontMap[i] = origFontsCount + i;
  });
  fontsEl.setAttribute('count', String(origFontsCount + regFontEls.length));

  // Merge fills
  const fillsEl = stylesDoc.getElementsByTagName('fills')[0];
  const origFillsCount = fillsEl.getElementsByTagName('fill').length;
  const regFillEls = Array.from(regStylesDoc.getElementsByTagName('fill'));
  const fillMap = {};
  regFillEls.forEach((rf, i) => {
    const newFill = stylesDoc.importNode(rf, true);
    fillsEl.appendChild(newFill);
    fillMap[i] = origFillsCount + i;
  });
  fillsEl.setAttribute('count', String(origFillsCount + regFillEls.length));

  // Merge borders
  const bordersEl = stylesDoc.getElementsByTagName('borders')[0];
  const origBordersCount = bordersEl.getElementsByTagName('border').length;
  const regBorderEls = Array.from(regStylesDoc.getElementsByTagName('border'));
  const borderMap = {};
  regBorderEls.forEach((rb, i) => {
    const newB = stylesDoc.importNode(rb, true);
    bordersEl.appendChild(newB);
    borderMap[i] = origBordersCount + i;
  });
  bordersEl.setAttribute('count', String(origBordersCount + regBorderEls.length));

  // Merge cellXfs
  const cellXfsEl = stylesDoc.getElementsByTagName('cellXfs')[0];
  const origXfsCount = cellXfsEl.getElementsByTagName('xf').length;
  const regXfEls = Array.from(regStylesDoc.getElementsByTagName('cellXfs')[0]?.getElementsByTagName('xf') || []);
  const regXfMap = {};
  regXfEls.forEach((rXf, i) => {
    const newXf = stylesDoc.importNode(rXf, true);
    const fId = parseInt(newXf.getAttribute('fontId') || '0', 10);
    const fillId = parseInt(newXf.getAttribute('fillId') || '0', 10);
    const bId = parseInt(newXf.getAttribute('borderId') || '0', 10);

    newXf.setAttribute('fontId', String(fontMap[fId] !== undefined ? fontMap[fId] : fId));
    newXf.setAttribute('fillId', String(fillMap[fillId] !== undefined ? fillMap[fillId] : fillId));
    newXf.setAttribute('borderId', String(borderMap[bId] !== undefined ? borderMap[bId] : bId));

    cellXfsEl.appendChild(newXf);
    regXfMap[i] = origXfsCount + i;
  });
  cellXfsEl.setAttribute('count', String(origXfsCount + regXfEls.length));
  zip.file('xl/styles.xml', serializeXml(stylesDoc));

  // 3. Resolve shared strings from reg.xlsx so reg cells become inline strings
  const regSharedXmlStr = regZip.file('xl/sharedStrings.xml')
    ? await regZip.file('xl/sharedStrings.xml').async('text')
    : null;
  const regSharedStrings = [];
  if (regSharedXmlStr) {
    const regSharedDoc = parseXml(regSharedXmlStr);
    const siEls = Array.from(regSharedDoc.getElementsByTagName('si'));
    siEls.forEach(si => {
      const tEls = Array.from(si.getElementsByTagName('t'));
      regSharedStrings.push(tEls.map(t => t.textContent || '').join(''));
    });
  }

  // 4. Read reg sheet template
  const regSheetXml = await regZip.file('xl/worksheets/sheet1.xml').async('text');
  const regSheetDoc = parseXml(regSheetXml);
  const regRows = Array.from(regSheetDoc.getElementsByTagName('sheetData')[0]?.getElementsByTagName('row') || []);
  const regMergeCellsEl = regSheetDoc.getElementsByTagName('mergeCells')[0];
  const regMerges = regMergeCellsEl ? Array.from(regMergeCellsEl.getElementsByTagName('mergeCell')) : [];

  // Read template degree tree sheet & drawing
  const templateSheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  const templateDrawingXml = await zip.file('xl/drawings/drawing1.xml').async('text');
  const templateRelsXml = await zip.file('xl/worksheets/_rels/sheet1.xml.rels').async('text');

  // Workbook structures
  const workbookXmlStr = await zip.file('xl/workbook.xml').async('text');
  const workbookDoc = parseXml(workbookXmlStr);
  const sheetsEl = workbookDoc.getElementsByTagName('sheets')[0];
  while (sheetsEl.firstChild) sheetsEl.removeChild(sheetsEl.firstChild);

  const wbRelsStr = await zip.file('xl/_rels/workbook.xml.rels').async('text');
  const wbRelsDoc = parseXml(wbRelsStr);
  const wbRelationshipsEl = wbRelsDoc.documentElement;
  Array.from(wbRelationshipsEl.getElementsByTagName('Relationship')).forEach(rel => {
    const target = rel.getAttribute('Target') || '';
    if (target.includes('worksheets/sheet')) {
      wbRelationshipsEl.removeChild(rel);
    }
  });

  const contentTypesStr = await zip.file('[Content_Types].xml').async('text');
  const contentTypesDoc = parseXml(contentTypesStr);
  const typesEl = contentTypesDoc.documentElement;
  Array.from(typesEl.getElementsByTagName('Override')).forEach(ov => {
    const pn = ov.getAttribute('PartName') || '';
    if (pn.includes('/xl/worksheets/sheet') || pn.includes('/xl/drawings/drawing')) {
      typesEl.removeChild(ov);
    }
  });

  // Stacking offset for Registration Form below the Degree Tree:
  // Tree is rows 1-52; row 53-54 blank; PageBreak at 54; Registration Form starts at row 56
  const REG_ROW_OFFSET = 55;

  const existingSheetNames = new Set();

  studentTranscripts.forEach((student, index) => {
    const sheetNum = index + 1;
    const sheetName = sanitizeSheetName(student.studentName || `Student ${sheetNum}`, existingSheetNames);

    // Parse fresh copy of template degree tree sheet
    const sheetDoc = parseXml(templateSheetXml);
    const { cellsToCrossWithX, cellsToFailRed, cellsToSelectGreen, checkpointTextMap, gpaValuesMap, selectedCourses } = buildStudentCellMaps(student, 0);

    // 1) Populate Degree Tree (Rows 1-52)
    const treeCells = Array.from(sheetDoc.getElementsByTagName('c'));
    for (const c of treeCells) {
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

    // 2) Append Registration Form rows starting at REG_ROW_OFFSET (e.g. Row 56)
    const sheetDataEl = sheetDoc.getElementsByTagName('sheetData')[0];
    regRows.forEach((rRow) => {
      const origRNum = parseInt(rRow.getAttribute('r'), 10);
      const newRNum = origRNum + REG_ROW_OFFSET;

      const clonedRow = sheetDoc.createElementNS(SPREADSHEETML_NS, 'row');
      clonedRow.setAttribute('r', String(newRNum));
      if (rRow.getAttribute('ht')) clonedRow.setAttribute('ht', rRow.getAttribute('ht'));
      if (rRow.getAttribute('customHeight')) clonedRow.setAttribute('customHeight', rRow.getAttribute('customHeight'));

      const rCells = Array.from(rRow.getElementsByTagName('c'));
      rCells.forEach((rc) => {
        const oldRef = rc.getAttribute('r');
        const colLetter = oldRef.replace(/[0-9]/g, '');
        const newRef = `${colLetter}${newRNum}`;

        const newCell = sheetDoc.createElementNS(SPREADSHEETML_NS, 'c');
        newCell.setAttribute('r', newRef);

        // Map cell style to merged cellXfs
        const origS = parseInt(rc.getAttribute('s') || '0', 10);
        const mappedS = regXfMap[origS] !== undefined ? regXfMap[origS] : origS;
        newCell.setAttribute('s', String(mappedS));

        // Transfer value or convert shared string to inlineStr
        const tAttr = rc.getAttribute('t');
        const vEl = rc.getElementsByTagName('v')[0];
        if (tAttr === 's' && vEl && vEl.textContent !== undefined) {
          const strIdx = parseInt(vEl.textContent, 10);
          const strVal = regSharedStrings[strIdx] || '';
          newCell.setAttribute('t', 'inlineStr');
          const isEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'is');
          const tEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 't');
          tEl.textContent = strVal;
          isEl.appendChild(tEl);
          newCell.appendChild(isEl);
        } else if (vEl) {
          if (tAttr) newCell.setAttribute('t', tAttr);
          const newV = sheetDoc.createElementNS(SPREADSHEETML_NS, 'v');
          newV.textContent = vEl.textContent;
          newCell.appendChild(newV);
        }

        clonedRow.appendChild(newCell);
      });

      sheetDataEl.appendChild(clonedRow);
    });

    // 3) Populate student registration data and registered courses into bottom form
    populateRegistrationSheet(sheetDoc, student, prerequisiteLinks, REG_ROW_OFFSET);

    // 4) Append merge cells for registration form
    let mergeCellsEl = sheetDoc.getElementsByTagName('mergeCells')[0];
    if (!mergeCellsEl) {
      mergeCellsEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'mergeCells');
      sheetDoc.documentElement.appendChild(mergeCellsEl);
    }
    const origTreeMergesCount = mergeCellsEl.getElementsByTagName('mergeCell').length;
    regMerges.forEach((m) => {
      const ref = m.getAttribute('ref');
      const [start, end] = ref.split(':');
      const newRef = `${offsetCellRef(start, REG_ROW_OFFSET)}:${offsetCellRef(end, REG_ROW_OFFSET)}`;
      const newM = sheetDoc.createElementNS(SPREADSHEETML_NS, 'mergeCell');
      newM.setAttribute('ref', newRef);
      mergeCellsEl.appendChild(newM);
    });
    mergeCellsEl.setAttribute('count', String(origTreeMergesCount + regMerges.length));

    // 5) Insert Page Break after Degree Tree (e.g. at row 54, right before registration block)
    // OpenXML schema sequence: sheetData -> mergeCells -> pageMargins -> rowBreaks -> drawing
    const rowBreaksEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'rowBreaks');
    rowBreaksEl.setAttribute('count', '1');
    rowBreaksEl.setAttribute('manualBreakCount', '1');
    const brkEl = sheetDoc.createElementNS(SPREADSHEETML_NS, 'brk');
    brkEl.setAttribute('id', String(REG_ROW_OFFSET - 1)); // row 54
    brkEl.setAttribute('min', '0');
    brkEl.setAttribute('max', '16383');
    brkEl.setAttribute('man', '1');
    rowBreaksEl.appendChild(brkEl);

    let drawingTag = sheetDoc.getElementsByTagName('drawing')[0];
    if (drawingTag) {
      sheetDoc.documentElement.insertBefore(rowBreaksEl, drawingTag);
    } else {
      drawingTag = sheetDoc.createElementNS(SPREADSHEETML_NS, 'drawing');
      drawingTag.setAttributeNS(OFFICE_RELS_NS, 'r:id', 'rId1');
      sheetDoc.documentElement.appendChild(rowBreaksEl);
      sheetDoc.documentElement.appendChild(drawingTag);
    }

    // 6) Drawing XML: Prerequisite connector arrows + Checkmarks for tree
    const studentDrawingDoc = parseXml(templateDrawingXml);
    const studentWsDrEl = studentDrawingDoc.getElementsByTagName('xdr:wsDr')[0] || studentDrawingDoc.documentElement;
    if (selectedCourses && selectedCourses.length > 0) {
      selectedCourses.forEach((sc, scIdx) => {
        const shapeId = 1000 + scIdx;
        const checkmarkAnchor = createCheckmarkAnchor(studentDrawingDoc, sc.course, 0, shapeId);
        studentWsDrEl.appendChild(checkmarkAnchor);
      });
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
    zip.file(drawingPath, serializeXml(studentDrawingDoc));

    // Register sheet in workbook.xml
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
