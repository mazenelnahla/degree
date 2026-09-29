import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { ALL_COURSES, PREREQUISITE_LINKS, normalizeCode, getCourseRequires, getRegistrationLimit } from './courseMapping.js';
import { cleanArabicText } from './pdfParser.js';

const SPREADSHEETML_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const PACKAGE_RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OFFICE_RELS_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

function parseXml(xmlStr) {
  return new DOMParser().parseFromString(xmlStr, 'application/xml');
}

function serializeXml(doc) {
  return new XMLSerializer().serializeToString(doc);
}

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

function getAiLevelLabel(student) {
  const lastLevel = student.levelGpas?.at(-1)?.level;
  const level = Number.isInteger(lastLevel)
    ? lastLevel + 1
    : Math.max(1, student.aiLevel ?? student.allSemesterTables?.length ?? 1);
  const suffix = level % 100 >= 11 && level % 100 <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[level % 10] || 'th');
  return `${level}${suffix} Level`;
}

function setCellInlineStr(doc, cellEl, text) {
  cellEl.setAttribute('t', 'inlineStr');
  // Remove existing children (e.g. <f>, <v>)
  while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);
  const isEl = doc.createElementNS(SPREADSHEETML_NS, 'is');
  const tEl = doc.createElementNS(SPREADSHEETML_NS, 't');
  tEl.textContent = text !== undefined && text !== null ? String(text) : '';
  isEl.appendChild(tEl);
  cellEl.appendChild(isEl);
}

function setCellValue(doc, cellEl, val, type = null) {
  if (type) {
    cellEl.setAttribute('t', type);
  } else {
    cellEl.removeAttribute('t');
  }
  while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);
  const vEl = doc.createElementNS(SPREADSHEETML_NS, 'v');
  vEl.textContent = val !== undefined && val !== null ? String(val) : '';
  cellEl.appendChild(vEl);
}

function clearCell(cellEl) {
  cellEl.removeAttribute('t');
  while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);
}

/**
 * Determine a student's current registration target level & semester
 */
function getStudentTargetLevelAndTerm(student) {
  const lastLevel = student.levelGpas?.at(-1)?.level;
  const targetLevel = Number.isInteger(lastLevel)
    ? lastLevel + 1
    : Math.max(1, student.aiLevel ?? student.allSemesterTables?.length ?? 1);

  // Term: check last regular semester or default to Fall (1st Term)
  let termLabel = '1st Term';
  let termSeason = 'Fall';
  const lastRegular = student.regularSemesters?.at(-1);
  if (lastRegular) {
    const semName = (lastRegular.semesterName || '').toLowerCase();
    // If student just finished Fall, next registration is typically Spring (2nd Term)
    if (semName.includes('fall')) {
      termLabel = '2nd Term';
      termSeason = 'Spring';
    } else {
      termLabel = '1st Term';
      termSeason = 'Fall';
    }
  }

  // Academic Year: default to last recorded or upcoming
  let academicYear = student.regularSemesters?.at(-1)?.academicYear || student.allSemesterTables?.at(-1)?.academicYear;
  if (!academicYear) {
    const currentYear = new Date().getFullYear();
    academicYear = `${currentYear}-${currentYear + 1}`;
  }

  return { targetLevel, termLabel, termSeason, academicYear };
}

function offsetCellRef(ref, offset) {
  if (!offset) return ref;
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return ref;
  return `${m[1]}${parseInt(m[2], 10) + offset}`;
}

export { offsetCellRef, setCellInlineStr, setCellValue, clearCell };

/**
 * Populate a single reg form worksheet document for a student
 * Accepts an optional rowOffset for single-sheet stacked layouts
 */
export function populateRegistrationSheet(sheetDoc, student, prerequisiteLinks = PREREQUISITE_LINKS, rowOffset = 0) {
  const { targetLevel, termLabel, termSeason, academicYear } = getStudentTargetLevelAndTerm(student);

  // Helper map for course code -> ALL_COURSES item
  const courseLookup = new Map();
  for (const c of ALL_COURSES) {
    courseLookup.set(normalizeCode(c.code), c);
    if (c.aliases) {
      for (const a of c.aliases) {
        courseLookup.set(normalizeCode(a), c);
      }
    }
  }

  // Group student's selected courses into:
  // 1) targetSemesterCourses: courses that match current level target
  // 2) otherCourses: failed or past/other-level courses taken now
  const selectedList = student.selectedCourseCodes || [];
  const targetSemesterCourses = [];
  const otherCourses = [];

  for (const code of selectedList) {
    const norm = normalizeCode(code);
    const course = courseLookup.get(norm) || { code, name: code, ch: 3, level: -1 };
    
    // Check if course belongs to student's current level
    if (course.level === targetLevel) {
      targetSemesterCourses.push(course);
    } else {
      otherCourses.push(course);
    }
  }

  // Total registered credit hours
  const allRegisteredCourses = [...targetSemesterCourses, ...otherCourses];
  const totalCh = allRegisteredCourses.reduce((sum, c) => sum + (c.ch || 0), 0);

  // Find cells map for easy lookups
  const cellsMap = new Map();
  const allCells = Array.from(sheetDoc.getElementsByTagName('c'));
  for (const c of allCells) {
    cellsMap.set(c.getAttribute('r'), c);
  }

  const getTargetCell = (baseRef) => {
    return cellsMap.get(offsetCellRef(baseRef, rowOffset));
  };

  const getOrCreateTargetCell = (baseRef, s = null) => {
    const targetRef = offsetCellRef(baseRef, rowOffset);
    let c = cellsMap.get(targetRef);
    if (!c) {
      const match = targetRef.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const rowNum = match[2];
        const rows = sheetDoc.getElementsByTagName('row');
        let rowEl = null;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].getAttribute('r') === rowNum) {
            rowEl = rows[i];
            break;
          }
        }
        if (rowEl) {
          c = sheetDoc.createElementNS(SPREADSHEETML_NS, 'c');
          c.setAttribute('r', targetRef);
          if (s) c.setAttribute('s', String(s));
          rowEl.appendChild(c);
          cellsMap.set(targetRef, c);
        }
      }
    }
    return c;
  };

  // 1. Header Cells
  // C5: Program Level / Term heading
  const c5Cell = getTargetCell('C5');
  if (c5Cell) {
    setCellInlineStr(sheetDoc, c5Cell, `${getAiLevelLabel(student)} (${termLabel} ${academicYear})`);
  }

  // D8: Student Name (Merged D8:F8)
  const d8Cell = getTargetCell('D8');
  if (d8Cell) {
    setCellInlineStr(sheetDoc, d8Cell, cleanArabicText(student.studentName));
  }

  // B8: Academic Year & Term
  const b8Cell = getTargetCell('B8');
  if (b8Cell) {
    setCellInlineStr(sheetDoc, b8Cell, `${termLabel}\n${academicYear}`);
  }

  // B9: Student ID
  const b9Cell = getTargetCell('B9');
  if (b9Cell) {
    setCellInlineStr(sheetDoc, b9Cell, student.studentId || '');
  }

  // D9: Registration Date (optional / current date)
  const d9Cell = getTargetCell('D9');
  if (d9Cell) {
    const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    setCellInlineStr(sheetDoc, d9Cell, today);
  }

  // B10: Semester Season (Fall / Spring)
  const b10Cell = getTargetCell('B10');
  if (b10Cell) {
    setCellInlineStr(sheetDoc, b10Cell, termSeason);
  }

  // D10: CGPA
  const d10Cell = getTargetCell('D10');
  if (d10Cell) {
    if (student.cgpa !== null && student.cgpa !== undefined) {
      setCellValue(sheetDoc, d10Cell, student.cgpa.toFixed(2));
    } else {
      clearCell(d10Cell);
    }
  }

  // F10: Semester GPA
  const f10Cell = getTargetCell('F10');
  if (f10Cell) {
    const semGpa = student.latestSemesterGpa !== null && student.latestSemesterGpa !== undefined
      ? student.latestSemesterGpa
      : (student.regularSemesters?.at(-1)?.gpa ?? null);
    if (semGpa !== null && semGpa !== undefined) {
      setCellValue(sheetDoc, f10Cell, semGpa.toFixed(2));
    } else {
      clearCell(f10Cell);
    }
  }

  // B11: Warnings / Allowed Registration Limit (Merged B11:E11)
  const b11Cell = getTargetCell('B11');
  if (b11Cell) {
    const regLimit = getRegistrationLimit(student);
    if (regLimit.tier === 'strict_warning') {
      setCellInlineStr(sheetDoc, b11Cell, `Warning (Sem GPA < 1.7): Max 4 Subjects Allowed`);
    } else if (regLimit.tier === 'academic_warning') {
      setCellInlineStr(sheetDoc, b11Cell, `Warning (CGPA < 2.0): Max 5 Subjects Allowed`);
    } else {
      setCellInlineStr(sheetDoc, b11Cell, `Good Standing: Max ${regLimit.maxCourses} Subjects Allowed`);
    }
  }

  // G14: Level Courses heading
  const g14Cell = getTargetCell('G14');
  if (g14Cell) {
    setCellInlineStr(sheetDoc, g14Cell, `${getAiLevelLabel(student)} Courses`);
  }

  // 2. Populate Target Semester Courses (Rows 15-16, extensible to more if needed)
  const levelRows = [15, 16,17,18,19,20];
  levelRows.forEach((r, idx) => {
    const course = targetSemesterCourses[idx];
    const bCell = getTargetCell(`B${r}`);
    const cCell = getTargetCell(`C${r}`);
    const eCell = getTargetCell(`E${r}`);
    const fCell = getTargetCell(`F${r}`);

    if (course) {
      if (bCell) setCellValue(sheetDoc, bCell, course.ch);
      if (cCell) setCellInlineStr(sheetDoc, cCell, `${course.code}: ${course.name}`);

      // Prerequisite for this course
      const reqs = getCourseRequires(course.code, prerequisiteLinks);
      if (reqs.length > 0) {
        const reqCourse = courseLookup.get(normalizeCode(reqs[0]));
        const reqStr = reqCourse ? `${reqCourse.code}: ${reqCourse.name}` : reqs.join(', ');
        if (fCell) setCellInlineStr(sheetDoc, fCell, reqStr);

        // Check if student passed prerequisite
        const prereqRecord = student.courseMap[normalizeCode(reqs[0])];
        const isPassed = prereqRecord && prereqRecord.isPassed && prereqRecord.points > 0;
        if (eCell) {
          if (isPassed) {
            setCellValue(sheetDoc, eCell, '1', 'b'); // boolean true
          } else {
            clearCell(eCell);
          }
        }
      } else {
        if (fCell) clearCell(fCell);
        if (eCell) clearCell(eCell);
      }
    } else {
      if (bCell) clearCell(bCell);
      if (cCell) clearCell(cCell);
      if (eCell) clearCell(eCell);
      if (fCell) clearCell(fCell);
    }
  });

  // 3. Populate Other Courses (Failed / Previous terms, Rows 23-26)
  const otherRows = [23, 24,25,26];
  otherRows.forEach((r, idx) => {
    const course = otherCourses[idx];
    const bCell = getTargetCell(`B${r}`);
    const cCell = getTargetCell(`C${r}`);
    const eCell = getTargetCell(`E${r}`);
    const fCell = getOrCreateTargetCell(`F${r}`, 34);

    if (course) {
      if (bCell) setCellValue(sheetDoc, bCell, course.ch);
      if (cCell) setCellInlineStr(sheetDoc, cCell, `${course.code}: ${course.name}`);

      // Prerequisite for other course
      const reqs = getCourseRequires(course.code, prerequisiteLinks);
      if (reqs.length > 0) {
        const reqCourse = courseLookup.get(normalizeCode(reqs[0]));
        const reqStr = reqCourse ? `${reqCourse.code}: ${reqCourse.name}` : reqs.join(', ');
        if (fCell) setCellInlineStr(sheetDoc, fCell, reqStr);

        const prereqRecord = student.courseMap[normalizeCode(reqs[0])];
        const isPassed = prereqRecord && prereqRecord.isPassed && prereqRecord.points > 0;
        if (eCell) {
          if (isPassed) {
            setCellValue(sheetDoc, eCell, '1', 'b');
          } else {
            clearCell(eCell);
          }
        }
      } else {
        if (fCell) clearCell(fCell);
        if (eCell) clearCell(eCell);
      }
    } else {
      if (bCell) clearCell(bCell);
      if (cCell) clearCell(cCell);
      if (eCell) clearCell(eCell);
      if (fCell) clearCell(fCell);
    }
  });

  // 4. Total Credit Hours Registered (Cell B27)
  const b24Cell = getTargetCell('B27');
  if (b24Cell) {
    setCellValue(sheetDoc, b24Cell, totalCh);
  }
}

/**
 * Generate Registration Form Excel Workbook based on public/reg.xlsx template
 * Creates a separate tab per student with all their registered courses and details.
 */
export async function generateRegistrationWorkbook(regTemplateBuffer, students, options = {}) {
  const { prerequisiteLinks = PREREQUISITE_LINKS } = options;
  const zip = await JSZip.loadAsync(regTemplateBuffer);

  // Remove externalLink and calcChain to ensure Excel doesn't display broken link warnings
  zip.remove('xl/calcChain.xml');
  zip.remove('xl/externalLinks/externalLink1.xml');
  zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

  // Read template files
  const templateSheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  const templateRelsXml = zip.file('xl/worksheets/_rels/sheet1.xml.rels')
    ? await zip.file('xl/worksheets/_rels/sheet1.xml.rels').async('text')
    : null;

  // Clean workbook relationships (remove externalLink and calcChain)
  const wbRelsStr = await zip.file('xl/_rels/workbook.xml.rels').async('text');
  const wbRelsDoc = parseXml(wbRelsStr);
  const relsEl = wbRelsDoc.documentElement;
  Array.from(relsEl.getElementsByTagName('Relationship')).forEach((rel) => {
    const type = rel.getAttribute('Type') || '';
    if (type.includes('externalLink') || type.includes('calcChain') || type.includes('worksheet')) {
      relsEl.removeChild(rel);
    }
  });

  // Clean [Content_Types].xml (remove externalLink, calcChain, and worksheet overrides)
  const typesXmlStr = await zip.file('[Content_Types].xml').async('text');
  const typesDoc = parseXml(typesXmlStr);
  const typesEl = typesDoc.documentElement;
  Array.from(typesEl.getElementsByTagName('Override')).forEach((override) => {
    const partName = override.getAttribute('PartName') || '';
    if (partName.includes('externalLink') || partName.includes('calcChain') || partName.startsWith('/xl/worksheets/sheet')) {
      typesEl.removeChild(override);
    }
  });

  // Prepare workbook.xml
  const workbookXmlStr = await zip.file('xl/workbook.xml').async('text');
  const workbookDoc = parseXml(workbookXmlStr);
  
  // Remove externalReferences tag if present
  const extRefs = workbookDoc.getElementsByTagName('externalReferences')[0];
  if (extRefs) extRefs.parentNode.removeChild(extRefs);

  // Remove calcPr or reset calcId
  const calcPr = workbookDoc.getElementsByTagName('calcPr')[0];
  if (calcPr) calcPr.setAttribute('fullCalcOnLoad', '1');

  const sheetsEl = workbookDoc.getElementsByTagName('sheets')[0];
  while (sheetsEl.firstChild) sheetsEl.removeChild(sheetsEl.firstChild);

  const existingSheetNames = new Set();

  // Populate each student as a sheet tab
  students.forEach((student, sIdx) => {
    const sheetNum = sIdx + 1;
    const rawSheetName = student.studentName || student.studentId || `Student ${sheetNum}`;
    const sheetName = sanitizeSheetName(rawSheetName, existingSheetNames);

    const sheetDoc = parseXml(templateSheetXml);
    populateRegistrationSheet(sheetDoc, student, prerequisiteLinks, 0);

    const sheetPath = `xl/worksheets/sheet${sheetNum}.xml`;
    zip.file(sheetPath, serializeXml(sheetDoc));

    if (templateRelsXml) {
      zip.file(`xl/worksheets/_rels/sheet${sheetNum}.xml.rels`, templateRelsXml);
    }

    // Add sheet to workbook.xml
    const sheetTag = workbookDoc.createElementNS(SPREADSHEETML_NS, 'sheet');
    sheetTag.setAttribute('name', sheetName);
    sheetTag.setAttribute('sheetId', String(sheetNum));
    sheetTag.setAttributeNS(OFFICE_RELS_NS, 'r:id', `rIdSheet${sheetNum}`);
    sheetsEl.appendChild(sheetTag);

    // Add relationship in workbook.xml.rels
    const newRel = wbRelsDoc.createElementNS(PACKAGE_RELS_NS, 'Relationship');
    newRel.setAttribute('Id', `rIdSheet${sheetNum}`);
    newRel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet');
    newRel.setAttribute('Target', `worksheets/sheet${sheetNum}.xml`);
    relsEl.appendChild(newRel);

    // Add Override in [Content_Types].xml
    const newOverride = typesDoc.createElementNS('http://schemas.openxmlformats.org/package/2006/content-types', 'Override');
    newOverride.setAttribute('PartName', `/xl/worksheets/sheet${sheetNum}.xml`);
    newOverride.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');
    typesEl.appendChild(newOverride);
  });

  zip.file('xl/workbook.xml', serializeXml(workbookDoc));
  zip.file('xl/_rels/workbook.xml.rels', serializeXml(wbRelsDoc));
  zip.file('[Content_Types].xml', serializeXml(typesDoc));

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * Generate Registration Form Excel Workbook with ALL students in ONE single continuous worksheet
 * Stacks each student's official registration form vertically with 2 gap rows in between.
 */
export async function generateSingleSheetRegistrationWorkbook(regTemplateBuffer, students, options = {}) {
  const { prerequisiteLinks = PREREQUISITE_LINKS } = options;
  const zip = await JSZip.loadAsync(regTemplateBuffer);

  // Remove externalLink and calcChain to ensure Excel doesn't display broken link warnings
  zip.remove('xl/calcChain.xml');
  zip.remove('xl/externalLinks/externalLink1.xml');
  zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

  const templateSheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  const templateDrawingXml = zip.file('xl/drawings/drawing1.xml')
    ? await zip.file('xl/drawings/drawing1.xml').async('text')
    : null;

  const sheetDoc = parseXml(templateSheetXml);
  const drawingDoc = templateDrawingXml ? parseXml(templateDrawingXml) : null;

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
  let wsDrEl = null;
  let templateAnchors = [];
  if (drawingDoc) {
    wsDrEl = drawingDoc.getElementsByTagName('xdr:wsDr')[0] || drawingDoc.documentElement;
    templateAnchors = Array.from(drawingDoc.getElementsByTagName('xdr:oneCellAnchor'));
    while (wsDrEl.firstChild) wsDrEl.removeChild(wsDrEl.firstChild);
  }

  // Height per student registration block:
  // 30 template rows + 2 blank separator rows = 32 rows per student
  const ROW_BLOCK_SIZE = 34;

  // Stacking block for each student
  students.forEach((student, sIdx) => {
    const offset = sIdx * ROW_BLOCK_SIZE;

    // 1. Append rows for this student
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
      });

      sheetDataEl.appendChild(clonedRow);
    });

    // 2. Populate student details and registered courses into their rows
    populateRegistrationSheet(sheetDoc, student, prerequisiteLinks, offset);

    // 3. Append merged cells for this student
    if (mergeCellsEl) {
      templateMerges.forEach((m) => {
        const ref = m.getAttribute('ref');
        const [start, end] = ref.split(':');
        const newRef = `${offsetCellRef(start, offset)}:${offsetCellRef(end, offset)}`;
        const newM = sheetDoc.createElementNS(SPREADSHEETML_NS, 'mergeCell');
        newM.setAttribute('ref', newRef);
        mergeCellsEl.appendChild(newM);
      });
    }

    // 4. Append drawing anchors (logos) for this student
    if (wsDrEl && templateAnchors.length > 0) {
      templateAnchors.forEach((anchor) => {
        const clonedAnchor = anchor.cloneNode(true);
        const fromRowEl = clonedAnchor.getElementsByTagName('xdr:from')[0]?.getElementsByTagName('xdr:row')[0];
        if (fromRowEl) {
          fromRowEl.textContent = String(parseInt(fromRowEl.textContent, 10) + offset);
        }
        wsDrEl.appendChild(clonedAnchor);
      });
    }
  });

  // Update mergeCells count attribute
  if (mergeCellsEl) {
    mergeCellsEl.setAttribute('count', String(templateMerges.length * students.length));
  }

  // Update dimension
  const dimensionEl = sheetDoc.getElementsByTagName('dimension')[0];
  if (dimensionEl) {
    dimensionEl.setAttribute('ref', `A1:G${students.length * ROW_BLOCK_SIZE}`);
  }

  // Update workbook.xml with sheet name
  const workbookXmlStr = await zip.file('xl/workbook.xml').async('text');
  const workbookDoc = parseXml(workbookXmlStr);
  const extRefs = workbookDoc.getElementsByTagName('externalReferences')[0];
  if (extRefs) extRefs.parentNode.removeChild(extRefs);

  const calcPr = workbookDoc.getElementsByTagName('calcPr')[0];
  if (calcPr) calcPr.setAttribute('fullCalcOnLoad', '1');

  const sheetsEl = workbookDoc.getElementsByTagName('sheets')[0];
  while (sheetsEl.firstChild) sheetsEl.removeChild(sheetsEl.firstChild);
  const singleSheetTag = workbookDoc.createElementNS(SPREADSHEETML_NS, 'sheet');
  singleSheetTag.setAttribute('name', 'All Registration Forms');
  singleSheetTag.setAttribute('sheetId', '1');
  singleSheetTag.setAttributeNS(OFFICE_RELS_NS, 'r:id', 'rId1');
  sheetsEl.appendChild(singleSheetTag);

  // Write sheet and drawing xmls
  zip.file('xl/worksheets/sheet1.xml', serializeXml(sheetDoc));
  if (drawingDoc) {
    zip.file('xl/drawings/drawing1.xml', serializeXml(drawingDoc));
  }
  zip.file('xl/workbook.xml', serializeXml(workbookDoc));

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

