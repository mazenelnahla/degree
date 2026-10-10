import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import {
  AI_DEGREE_STRUCTURE,
  EEP_DEGREE_STRUCTURE,
  normalizeProgramId,
  getDegreeStructure,
  getAllCourses,
  checkPrerequisitesMet,
  getRegistrationLimit,
  getCourseSeason,
  isCourseEligibleForSeason
} from '../src/services/courseMapping.js';
import {
  generatePreservedExcelWorkbook,
  generateSingleSheetCombinedWorkbook,
  generateCombinedTreeAndRegistrationWorkbook
} from '../src/services/excelPreserver.js';
import {
  generateRegistrationWorkbook,
  generateSingleSheetRegistrationWorkbook
} from '../src/services/regFormGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function runTests() {
  console.log('--- 1. Testing Program Structures & Courses ---');
  const aiCourses = getAllCourses('AI');
  const eepCourses = getAllCourses('EEP');
  console.log(`AI courses: ${aiCourses.length}, Levels: ${AI_DEGREE_STRUCTURE.length}`);
  console.log(`EEP courses: ${eepCourses.length}, Levels: ${EEP_DEGREE_STRUCTURE.length}`);

  if (aiCourses.length < 50 || eepCourses.length < 50) {
    throw new Error('Course list length unexpected!');
  }
  if (EEP_DEGREE_STRUCTURE.length !== 5) {
    throw new Error(`Expected 5 levels for EEP, got ${EEP_DEGREE_STRUCTURE.length}`);
  }

  console.log('--- 2. Testing Prerequisites Files ---');
  const aiPrereqs = JSON.parse(fs.readFileSync(path.join(projectRoot, 'public/prerequisites.json'), 'utf8'));
  const eepPrereqs = JSON.parse(fs.readFileSync(path.join(projectRoot, 'public/prerequisites_eep.json'), 'utf8'));
  console.log(`AI prerequisites count: ${aiPrereqs.length}`);
  console.log(`EEP prerequisites count: ${eepPrereqs.length}`);

  if (eepPrereqs.length < 30) {
    throw new Error('EEP prerequisites extracted count seems low!');
  }

  console.log('--- 3. Testing Prerequisite & Eligibility Logic ---');
  // EPM 221 requires EPM 111
  const sampleMapEmpty = {};
  const sampleMapWithPrereq = {
    'EPM111': { code: 'EPM 111', isPassed: true, points: 3.0 },
    'MPE123': { code: 'MPE 123', isPassed: true, points: 3.0 }
  };
  const checkWithout = checkPrerequisitesMet('EPM 221', sampleMapEmpty, eepPrereqs, 'EEP');
  const checkWith = checkPrerequisitesMet('EPM 221', sampleMapWithPrereq, eepPrereqs, 'EEP');

  console.log(`EPM 221 without prereqs: canTake=${checkWithout.canTake}, missing=${checkWithout.missingPrereqs.join(',')}`);
  console.log(`EPM 221 with prereqs: canTake=${checkWith.canTake}`);

  if (checkWithout.canTake !== false || checkWith.canTake !== true) {
    throw new Error('EEP prerequisite check failed!');
  }

  console.log('--- 4. Testing Excel Workbook Generation for EEP ---');
  const loadBuffer = (relPath) => {
    const b = fs.readFileSync(path.join(projectRoot, relPath));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  };
  const eepTemplateBuffer = loadBuffer('public/EPP Template.xlsx');
  const aiTemplateBuffer = loadBuffer('public/template.xlsx');
  const regTemplateBuffer = loadBuffer('public/reg.xlsx');

  const mockEepStudent = {
    studentName: 'أحمد محمود محمد علي',
    studentId: '20240101',
    program: 'EEP',
    cgpa: 3.45,
    latestSemesterGpa: 3.20,
    aiLevel: 2,
    achievedHours: 42,
    registeredHours: 18,
    selectedCourseCodes: ['EPM 221', 'BSC 111'],
    levelGpas: [
      { level: 0, semester: 1, gpa: 3.10 }, // Year zero Fall -> Y10
      { level: 0, semester: 2, gpa: 3.20 }, // Year zero Spring -> Y20
      { level: 1, semester: 1, gpa: 3.30 }, // First year Fall -> Y30
      { level: 1, semester: 2, gpa: 3.40 }, // First year Spring -> Y40
      { level: 2, semester: 1, gpa: 3.50 }, // Second year Fall -> Y50
      { level: 2, semester: 2, gpa: 3.60 }, // Second year Spring -> Y60
      { level: 3, semester: 1, gpa: 3.70 }, // Third year Fall -> Y70
      { level: 3, semester: 2, gpa: 3.80 }, // Third year Spring -> Y80
      { level: 4, semester: 1, gpa: 3.90 }, // Fourth year Fall -> Y90
      { level: 4, semester: 2, gpa: 4.00 }  // Fourth year Spring -> Y100
    ],
    courseMap: {
      'BSC011': { code: 'BSC 011', isPassed: true, points: 3.5 },
      'EPM111': { code: 'EPM 111', isPassed: true, points: 3.0 },
      'MPE123': { code: 'MPE 123', isPassed: true, points: 3.0 },
      'MPE112': { code: 'MPE 112', isPassed: false, points: 0.0 }
    }
  };

  // Test multi-sheet preserved workbook
  const multiBuf = await generatePreservedExcelWorkbook(eepTemplateBuffer, [mockEepStudent], {
    useStrikethrough: true,
    useDiagonalCross: true,
    alertFailed: true
  });
  console.log(`Multi-sheet EEP workbook generated successfully: ${multiBuf.byteLength} bytes`);

  // Assert that Y10, Y20, Y30, Y40, Y50, Y60, Y70, Y80, Y90, Y100 contain the exact semester GPAs
  const zip = await JSZip.loadAsync(multiBuf);
  const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  const doc = new DOMParser().parseFromString(sheet1Xml, 'application/xml');
  const expectedGpas = {
    'Y10': '3.10',
    'Y20': '3.20',
    'Y30': '3.30',
    'Y40': '3.40',
    'Y50': '3.50',
    'Y60': '3.60',
    'Y70': '3.70',
    'Y80': '3.80',
    'Y90': '3.90',
    'Y100': '4.00'
  };

  for (const [cellRef, expectedVal] of Object.entries(expectedGpas)) {
    const cEl = Array.from(doc.getElementsByTagName('c')).find(el => el.getAttribute('r') === cellRef);
    const val = cEl?.getElementsByTagName('v')[0]?.textContent;
    if (val !== expectedVal) {
      throw new Error(`Cell ${cellRef} was expected to have GPA ${expectedVal}, but got '${val}'!`);
    }
  }
  console.log('✅ Verified all 10 semester GPA cells (Y10, Y20, Y30, Y40, Y50, Y60, Y70, Y80, Y90, Y100) populated correctly in EEP workbook!');

  // Test single continuous sheet
  const singleBuf = await generateSingleSheetCombinedWorkbook(loadBuffer('public/EPP Template.xlsx'), [mockEepStudent], {
    useStrikethrough: true,
    useDiagonalCross: true,
    alertFailed: true
  });
  console.log(`Single-sheet EEP workbook generated successfully: ${singleBuf.byteLength} bytes`);

  // Assert single sheet also has Y10-Y100 for student 0
  const singleZip = await JSZip.loadAsync(singleBuf);
  const singleSheetXml = await singleZip.file('xl/worksheets/sheet1.xml').async('text');
  const singleDoc = new DOMParser().parseFromString(singleSheetXml, 'application/xml');
  for (const [cellRef, expectedVal] of Object.entries(expectedGpas)) {
    const cEl = Array.from(singleDoc.getElementsByTagName('c')).find(el => el.getAttribute('r') === cellRef);
    const val = cEl?.getElementsByTagName('v')[0]?.textContent;
    if (val !== expectedVal) {
      throw new Error(`Single-sheet cell ${cellRef} was expected to have GPA ${expectedVal}, but got '${val}'!`);
    }
  }
  console.log('✅ Verified all 10 semester GPA cells (Y10-Y100) populated correctly in single-sheet workbook!');

  // Test registration form
  const regBuf = await generateRegistrationWorkbook(loadBuffer('public/reg.xlsx'), [mockEepStudent], {
    prerequisiteLinks: eepPrereqs
  });
  console.log(`Registration EEP workbook generated successfully: ${regBuf.byteLength} bytes`);

  // Test combined degree tree + registration form
  const combinedBuf = await generateCombinedTreeAndRegistrationWorkbook(
    loadBuffer('public/EPP Template.xlsx'),
    loadBuffer('public/reg.xlsx'),
    [mockEepStudent],
    {
      prerequisiteLinks: eepPrereqs,
      useStrikethrough: true,
      useDiagonalCross: true
    }
  );
  // Test AI student preserved workbook as well
  const mockAiStudent = {
    studentName: 'سارة خالد أحمد',
    studentId: '20230202',
    program: 'AI',
    cgpa: 3.80,
    latestSemesterGpa: 3.90,
    aiLevel: 1,
    achievedHours: 36,
    registeredHours: 18,
    selectedCourseCodes: ['AI 111', 'BSC 111'],
    courseMap: {
      'BSC011': { code: 'BSC 011', isPassed: true, points: 4.0 },
      'CCE031': { code: 'CCE 031', isPassed: true, points: 3.7 }
    }
  };
  const aiMultiBuf = await generatePreservedExcelWorkbook(aiTemplateBuffer, [mockAiStudent], {
    useStrikethrough: true,
    useDiagonalCross: true
  });
  console.log(`Multi-sheet AI workbook generated successfully: ${aiMultiBuf.byteLength} bytes`);

  console.log('\n✅ ALL INTEGRATION TESTS (AI + EEP) PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
