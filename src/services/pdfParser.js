import * as pdfjsLib from 'pdfjs-dist';
import { normalizeCode } from './courseMapping.js';

// Configure PDF.js worker for Vite browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

/**
 * Extract text and structured student transcript data from a PDF ArrayBuffer or Uint8Array
 * @param {ArrayBuffer|Uint8Array} pdfData
 * @param {string} fileName
 * @returns {Promise<Object>}
 */
export async function parseTranscriptPdf(pdfData, fileName = 'Transcript.pdf') {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  let fullText = '';
  const pagesText = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    let pageStr = '';
    let lastItem = null;

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str) continue;

      if (!lastItem) {
        pageStr += item.str;
      } else {
        const sameLine = Math.abs(item.transform[5] - lastItem.transform[5]) <= 3;
        if (!sameLine) {
          pageStr += '\n' + item.str;
        } else {
          // Same line: check if horizontal space is actually present between items
          const prevEndsWithSpace = lastItem.str.endsWith(' ');
          const currStartsWithSpace = item.str.startsWith(' ');

          if (prevEndsWithSpace || currStartsWithSpace) {
            pageStr += item.str;
          } else {
            // Check horizontal gap between items
            const isRtl = item.dir === 'rtl' || lastItem.dir === 'rtl';
            let gap = 0;
            if (isRtl) {
              gap = lastItem.transform[4] - (item.transform[4] + (item.width || 0));
            } else {
              gap = item.transform[4] - (lastItem.transform[4] + (lastItem.width || 0));
            }

            const fontSize = Math.max(Math.abs(item.transform[0] || 0), Math.abs(item.transform[3] || 0), 10);
            const spaceThreshold = fontSize * 0.22; // ~2.2px for 10pt font

            if (gap > spaceThreshold) {
              pageStr += ' ' + item.str;
            } else {
              // Adjacent characters or connected Arabic letters - do not inject false spaces
              pageStr += item.str;
            }
          }
        }
      }
      lastItem = item;
    }
    pagesText.push(pageStr);
    fullText += '\n' + pageStr;
  }

  return parseTranscriptText(fullText, fileName);
}

/**
 * Normalizes Arabic text:
 * 1. Converts Unicode Presentation Forms-A and Forms-B (U+FB50-U+FDFF, U+FE70-U+FEFF)
 *    to clean, standard Arabic letters (U+0600-U+06FF) using NFKC.
 * 2. Strips zero-width and invisible control characters that cause font detachment.
 * 3. Joins letters separated by accidental spaces within names/words.
 */
export function cleanArabicText(text) {
  if (!text) return '';

  // 1. Unicode Compatibility Decomposition & Composition (fixes Presentation Forms)
  let s = text.normalize('NFKC');

  // 2. Remove invisible formatting and zero-width characters (ZWNJ, ZWJ, ZWSP, LRM, RLM, BOM)
  s = s.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');

  // 3. Fix words where letters were accidentally separated by spaces:
  // e.g.: "م ح م د   ع ل ي   أ ح م د" or "ع ب د  ا ل ل ه"
  if (/\s{2,}/.test(s)) {
    const blocks = s.split(/\s{2,}/);
    s = blocks.map(block => {
      const tokens = block.trim().split(/\s+/);
      if (tokens.length > 1 && tokens.every(t => /^[\u0600-\u06FF]$/.test(t))) {
        return tokens.join('');
      }
      return block;
    }).join(' ');
  } else {
    // If all tokens are isolated single Arabic characters, join them
    const tokens = s.trim().split(/\s+/);
    if (tokens.length >= 2 && tokens.every(t => /^[\u0600-\u06FF]$/.test(t))) {
      s = tokens.join('');
    }
  }

  // 4. Normalize multiple whitespace into single space
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Parses raw text extracted from the university transcript PDF
 */
export function parseTranscriptText(text, fileName = '') {
  // Extract Student Info (supports both English and Arabic labels)
  const nameMatch = text.match(/(?:Student\s+Name|اسم\s+الطالب)\s*:\s*([^\n\r]+)/i);
  const idMatch = text.match(/(?:Student\s+ID|الرقم\s+الجامعي|كود\s+الطالب)\s*:\s*([0-9]+)/i);
  const cgpaMatch = text.match(/(?:Cumulative\s+GPA|المعدل\s+التراكمي)\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const admissionMatch = text.match(/(?:Admission\s+year|سنة\s+الالتحاق)\s*:\s*([0-9]{4}-[0-9]{4})/i);
  const regHoursMatch = text.match(/(?:(?:Total\s+)?Registered\s+Credit\s+Hours|الساعات\s+المسجلة)\s*:\s*([0-9]+)/i);
  const achHoursMatch = text.match(/(?:(?:Total\s+)?Achieved\s+Credit\s+Hours|الساعات\s+المجتازة)\s*:\s*([0-9]+)/i);
  const programMatch = text.match(/(?:Program|البرنامج)\s*:\s*([^\n\r]+)/i);

  // Fallback student name from fileName if not found in text
  let studentName = nameMatch ? nameMatch[1].trim() : '';
  if (!studentName && fileName) {
    studentName = fileName.replace(/\.pdf$/i, '').replace(/-\s*[0-9]+.*$/, '').trim();
  }
  if (!studentName) studentName = 'Student Transcript';

  studentName = cleanArabicText(studentName);

  const studentId = idMatch ? idMatch[1].trim() : '';
  const cgpa = cgpaMatch ? parseFloat(cgpaMatch[1]) : null;
  const admissionYear = admissionMatch ? admissionMatch[1].trim() : '';
  const registeredHours = regHoursMatch ? parseInt(regHoursMatch[1], 10) : null;
  const achievedHours = achHoursMatch ? parseInt(achHoursMatch[1], 10) : null;
  const program = programMatch ? programMatch[1].trim() : 'Artificial Intelligence';

  // Extract all courses
  // Course line patterns: Course Code, Course Name, Credit, Points, Grade
  // e.g.: BSC 011 Mathematics I 3.00 0 F.law
  // e.g.: GUR0C1 Principles of Law and Human Rights 1.00 1.00 D
  const courseRegex = /([A-Z]{3,4}\s*[0-9][0-9A-Z]{2})\s+(.+?)\s+([0-9]+\.[0-9]{2})\s+([0-9]+(?:\.[0-9]{1,2})?)\s+([A-Za-z]+[\w\.-]*)/g;

  const rawCourses = [];
  let match;
  while ((match = courseRegex.exec(text)) !== null) {
    const rawCode = match[1].replace(/\s+/g, ' ').trim();
    const name = match[2].trim();
    const credit = parseFloat(match[3]);
    const points = parseFloat(match[4]);
    const grade = match[5].trim();

    // Skip if it's the header row or invalid
    if (rawCode.includes('Course') || name.includes('Course')) continue;

    rawCourses.push({
      rawCode,
      normCode: normalizeCode(rawCode),
      name,
      credit,
      points,
      grade
    });
  }

  // Aggregate course records by normalized code
  // If taken multiple times, best points and passing status wins!
  const courseMap = {};
  for (const c of rawCourses) {
    const key = c.normCode;
    if (!courseMap[key]) {
      courseMap[key] = {
        code: c.rawCode,
        normCode: key,
        name: c.name,
        credit: c.credit,
        points: c.points,
        grade: c.grade,
        isPassed: c.points > 0.00,
        attempts: [c]
      };
    } else {
      courseMap[key].attempts.push(c);
      // Keep best points attempt
      if (c.points > courseMap[key].points) {
        courseMap[key].points = c.points;
        courseMap[key].grade = c.grade;
        courseMap[key].isPassed = c.points > 0.00;
      }
      if (c.points > 0) {
        courseMap[key].isPassed = true;
      }
    }
  }

  const passedCount = Object.values(courseMap).filter(c => c.isPassed).length;
  const failedCount = Object.values(courseMap).filter(c => !c.isPassed).length;

  // Extract Semester Tables and GPAs from Academic Year blocks
  // Academic Year: YYYY-YYYY
  // Semester: Fall  Semester: Spring  Semester: Summer
  // Ach. C.Hrs: ... C.Hrs: ... GPA: ...
  const yearRegex = /Academic\s+Year:\s*([0-9]{4}-[0-9]{4})/g;
  const yearIndices = [];
  let ym;
  while ((ym = yearRegex.exec(text)) !== null) {
    yearIndices.push({ year: ym[1], index: ym.index });
  }

  const allSemesterTables = [];
  for (let i = 0; i < yearIndices.length; i++) {
    const current = yearIndices[i];
    const nextIndex = (i + 1 < yearIndices.length) ? yearIndices[i + 1].index : text.indexOf('Registered Credit Hours');
    const blockText = text.substring(current.index, nextIndex > 0 ? nextIndex : text.length);

    // Extract semester names
    const semTitles = [];
    const semRegex = /Semester:\s*([A-Za-z]+)/g;
    let sm;
    while ((sm = semRegex.exec(blockText)) !== null) {
      semTitles.push(sm[1]);
    }

    // Extract Ach. C.Hrs / C.Hrs / GPA
    const statsRegex = /Ach\.\s*C\.Hrs:\s*([0-9]+)\s+C\.Hrs:\s*([0-9]+)\s+GPA:\s*([0-9]+(?:\.[0-9]+)?)/g;
    const stats = [];
    let stm;
    while ((stm = statsRegex.exec(blockText)) !== null) {
      stats.push({
        achievedHours: parseInt(stm[1], 10),
        creditHours: parseInt(stm[2], 10),
        gpa: parseFloat(stm[3])
      });
    }

    semTitles.forEach((name, idx) => {
      if (idx < stats.length) {
        const isSummer = name.toLowerCase().includes('summer');
        allSemesterTables.push({
          academicYear: current.year,
          semesterName: name,
          isSummer,
          ...stats[idx]
        });
      }
    });
  }

  // Filter out Summer: GPA in summer is NOT considered!
  const regularSemesters = allSemesterTables.filter(s => !s.isSummer);
  const summerSemesters = allSemesterTables.filter(s => s.isSummer);

  // Map regular semesters to curriculum levels (Level 0 Fall/Spring, Level 1 Fall/Spring, etc.)
  const semesterGpaCellMap = [
    { level: 0, semester: 1, gpaCell: 'W7', chCell: 'X7' },
    { level: 0, semester: 2, gpaCell: 'W11', chCell: 'X11' },
    { level: 1, semester: 1, gpaCell: 'W16', chCell: 'X16' },
    { level: 1, semester: 2, gpaCell: 'W20', chCell: 'X20' },
    { level: 2, semester: 1, gpaCell: 'W25', chCell: 'X25' },
    { level: 2, semester: 2, gpaCell: 'W30', chCell: 'X30' },
    { level: 3, semester: 1, gpaCell: 'W34', chCell: 'X34' },
    { level: 3, semester: 2, gpaCell: 'W38', chCell: 'X38' },
    { level: 4, semester: 1, gpaCell: 'W43', chCell: 'X43' },
    { level: 4, semester: 2, gpaCell: 'W47', chCell: 'X47' },
  ];

  const levelGpas = regularSemesters.map((sem, idx) => {
    const slot = semesterGpaCellMap[idx] || { level: Math.floor(idx / 2), semester: (idx % 2) + 1, gpaCell: null };
    return {
      ...sem,
      level: slot.level,
      semester: slot.semester,
      gpaCell: slot.gpaCell
    };
  });

  // Latest regular semester GPA (for header cell K3)
  const latestRegularSem = regularSemesters.length > 0 ? regularSemesters[regularSemesters.length - 1] : null;
  const latestSemesterGpa = latestRegularSem ? latestRegularSem.gpa : null;
  const tableCount = allSemesterTables.length;
  const aiLevel = Math.max(1, tableCount);

  return {
    studentName,
    studentId,
    cgpa,
    admissionYear,
    registeredHours,
    achievedHours,
    program,
    rawCourses,
    courseMap,
    passedCount,
    failedCount,
    totalAttempted: Object.keys(courseMap).length,
    allSemesterTables,
    tableCount,
    aiLevel,
    regularSemesters,
    summerSemesters,
    levelGpas,
    latestSemesterGpa
  };
}
