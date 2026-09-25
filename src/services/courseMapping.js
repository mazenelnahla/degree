// Course definition and Excel grid coordinates for Book2.xlsx
// Each course corresponds to a Code cell (e.g. C7), Credit cell (D7), and Title cell (C8:D9 merged)

export const DEGREE_STRUCTURE = [
  {
    level: 0,
    title: 'LEVEL 0',
    semesters: [
      {
        semester: 1,
        title: 'Fall Semester',
        gpaCell: 'W7',
        chCell: 'X7',
        courses: [
          { code: 'BSC 011', name: 'Mathematics I', ch: 3, codeCell: 'C7', chCell: 'D7', titleCell: 'C8', mergeRange: 'C8:D9' },
          { code: 'BSC 031', name: 'Physics I', ch: 3, codeCell: 'F7', chCell: 'G7', titleCell: 'F8', mergeRange: 'F8:G9' },
          { code: 'BSC 021', name: 'Mechanics I', ch: 3, codeCell: 'I7', chCell: 'J7', titleCell: 'I8', mergeRange: 'I8:J9' },
          { code: 'BSC 041', name: 'Chemical Engineering', ch: 3, codeCell: 'L7', chCell: 'M7', titleCell: 'L8', mergeRange: 'L8:M9' },
          { code: 'PRD 031', name: 'Engineering Drawing and Projection', ch: 3, codeCell: 'O7', chCell: 'P7', titleCell: 'O8', mergeRange: 'O8:P9' },
          { code: 'GUR 0C1', name: 'University Requirement (1)', ch: 1, codeCell: 'R7', chCell: 'S7', titleCell: 'R8', mergeRange: 'R8:S9', aliases: ['GUR0C1'] },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'W11',
        chCell: 'X11',
        courses: [
          { code: 'BSC 012', name: 'Mathematics II', ch: 3, codeCell: 'C11', chCell: 'D11', titleCell: 'C12', mergeRange: 'C12:D13' },
          { code: 'BSC 032', name: 'Physics II', ch: 3, codeCell: 'F11', chCell: 'G11', titleCell: 'F12', mergeRange: 'F12:G13' },
          { code: 'BSC 022', name: 'Mechanics II', ch: 3, codeCell: 'I11', chCell: 'J11', titleCell: 'I12', mergeRange: 'I12:J13' },
          { code: 'PRD 041', name: 'Production Technology', ch: 3, codeCell: 'L11', chCell: 'M11', titleCell: 'L12', mergeRange: 'L12:M13' },
          { code: 'CCE 031', name: 'Introduction to Computer Science', ch: 3, codeCell: 'O11', chCell: 'P11', titleCell: 'O12', mergeRange: 'O12:P13' },
          { code: 'GUR 0C2', name: 'University Requirement (2)', ch: 2, codeCell: 'R11', chCell: 'S11', titleCell: 'R12', mergeRange: 'R12:S13', aliases: ['GUR0C2'] },
        ]
      }
    ]
  },
  {
    level: 1,
    title: 'LEVEL 1',
    semesters: [
      {
        semester: 1,
        title: 'Fall Semester',
        gpaCell: 'W16',
        chCell: 'X16',
        courses: [
          { code: 'EPM 113', name: 'Electromagnetic Fields', ch: 3, codeCell: 'C16', chCell: 'D16', titleCell: 'C17', mergeRange: 'C17:D18' },
          { code: 'EPM 116', name: 'Electrical Circuits & Measurements 1', ch: 3, codeCell: 'F16', chCell: 'G16', titleCell: 'F17', mergeRange: 'F17:G18' },
          { code: 'CCE 141', name: 'Logic Design 1', ch: 3, codeCell: 'I16', chCell: 'J16', titleCell: 'I17', mergeRange: 'I17:J18' },
          { code: 'CCE 111', name: 'Computer Programming 1', ch: 3, codeCell: 'L16', chCell: 'M16', titleCell: 'L17', mergeRange: 'L17:M18' },
          { code: 'BSC 111', name: 'Mathematics III', ch: 3, codeCell: 'O16', chCell: 'P16', titleCell: 'O17', mergeRange: 'O17:P18' },
          { code: 'GUR 1C1', name: 'University Requirement (3)', ch: 2, codeCell: 'R16', chCell: 'S16', titleCell: 'R17', mergeRange: 'R17:S18', aliases: ['GUR1C1'] },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'W20',
        chCell: 'X20',
        courses: [
          { code: 'BSC 112', name: 'Statistics & Numerical Analysis', ch: 3, codeCell: 'C20', chCell: 'D20', titleCell: 'C21', mergeRange: 'C21:D22' },
          { code: 'EPM 117', name: 'Electrical Circuits & Measurements 2', ch: 3, codeCell: 'F20', chCell: 'G20', titleCell: 'F21', mergeRange: 'F21:G22' },
          { code: 'CCE 142', name: 'Logic Design 2', ch: 3, codeCell: 'I20', chCell: 'J20', titleCell: 'I21', mergeRange: 'I21:J22' },
          { code: 'CCE 112', name: 'Computer Programming 2', ch: 3, codeCell: 'L20', chCell: 'M20', titleCell: 'L21', mergeRange: 'L21:M22' },
          { code: 'CCE 131', name: 'Mathematics for Machine Learning', ch: 3, codeCell: 'O20', chCell: 'P20', titleCell: 'O21', mergeRange: 'O21:P22' },
          { code: 'GUR 1C2', name: 'University Requirement (4)', ch: 2, codeCell: 'R20', chCell: 'S20', titleCell: 'R21', mergeRange: 'R21:S22', aliases: ['GUR1C2'] },
        ]
      }
    ]
  },
  {
    level: 2,
    title: 'LEVEL 2',
    semesters: [
      {
        semester: 1,
        title: 'Fall Semester',
        gpaCell: 'W25',
        chCell: 'X25',
        courses: [
          { code: 'EPM 213', name: 'Electronics & Digital Circuits', ch: 3, codeCell: 'C25', chCell: 'D25', titleCell: 'C26', mergeRange: 'C26:D27' },
          { code: 'CCE 221', name: 'Control Systems Engineering 1', ch: 3, codeCell: 'F25', chCell: 'G25', titleCell: 'F26', mergeRange: 'F26:G27' },
          { code: 'CCE 231', name: 'Machine Learning 1', ch: 3, codeCell: 'I25', chCell: 'J25', titleCell: 'I26', mergeRange: 'I26:J27' },
          { code: 'CCE 211', name: 'Data Structures & Algorithms', ch: 3, codeCell: 'L25', chCell: 'M25', titleCell: 'L26', mergeRange: 'L26:M27' },
          { code: 'GUR 2C1', name: 'University Requirement (5)', ch: 2, codeCell: 'O25', chCell: 'P25', titleCell: 'O26', mergeRange: 'O26:P27', aliases: ['GUR2C1'] },
          { code: 'GUR 2E1', name: 'Elective University (1)', ch: 2, codeCell: 'R25', chCell: 'S25', titleCell: 'R26', mergeRange: 'R26:S27', aliases: ['GUR2E1'] },
          { code: 'GFR 2XX', name: 'Summer Training (1)', ch: 1, codeCell: 'U25', chCell: 'V25', titleCell: 'U26', mergeRange: 'U26:V27' },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'W30',
        chCell: 'X30',
        courses: [
          { code: 'CCE 241', name: 'Computer Architecture & Organization', ch: 3, codeCell: 'C29', chCell: 'D29', titleCell: 'C30', mergeRange: 'C30:D31' },
          { code: 'CCE 222', name: 'Control Systems Engineering 2', ch: 3, codeCell: 'F29', chCell: 'G29', titleCell: 'F30', mergeRange: 'F30:G31' },
          { code: 'CCE 232', name: 'Machine Learning 2', ch: 3, codeCell: 'I29', chCell: 'J29', titleCell: 'I30', mergeRange: 'I30:J31' },
          { code: 'CCE 242', name: 'Digital Signal Processing', ch: 3, codeCell: 'L29', chCell: 'M29', titleCell: 'L30', mergeRange: 'L30:M31' },
          { code: 'CCE 212', name: 'Database Systems', ch: 3, codeCell: 'O29', chCell: 'P29', titleCell: 'O30', mergeRange: 'O30:P31' },
          { code: 'GUR 2E2', name: 'Elective University (2)', ch: 2, codeCell: 'R29', chCell: 'S29', titleCell: 'R30', mergeRange: 'R30:S31', aliases: ['GUR2E2'] },
        ]
      }
    ]
  },
  {
    level: 3,
    title: 'LEVEL 3',
    semesters: [
      {
        semester: 1,
        title: 'Fall Semester',
        gpaCell: 'W34',
        chCell: 'X34',
        courses: [
          { code: 'CCE 311', name: 'Operating Systems', ch: 3, codeCell: 'C34', chCell: 'D34', titleCell: 'C35', mergeRange: 'C35:D36' },
          { code: 'CCE 321', name: 'Embedded Systems', ch: 3, codeCell: 'F34', chCell: 'G34', titleCell: 'F35', mergeRange: 'F35:G36' },
          { code: 'CCE 351', name: 'Computer Networks', ch: 2, codeCell: 'I34', chCell: 'J34', titleCell: 'I35', mergeRange: 'I35:J36' },
          { code: 'CCE 312', name: 'Parallel Processing', ch: 3, codeCell: 'L34', chCell: 'M34', titleCell: 'L35', mergeRange: 'L35:M36' },
          { code: 'EPM 3EX', name: 'Elective Course (1)', ch: 2, codeCell: 'O34', chCell: 'P34', titleCell: 'O35', mergeRange: 'O35:P36' },
          { code: 'GFR 3E1', name: 'Elective Faculty (1)', ch: 2, codeCell: 'R34', chCell: 'S34', titleCell: 'R35', mergeRange: 'R35:S36' },
          { code: 'GFR 3XX', name: 'Summer Training (2)', ch: 1, codeCell: 'U34', chCell: 'V34', titleCell: 'U35', mergeRange: 'U35:V36' },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'W38',
        chCell: 'X38',
        courses: [
          { code: 'CCE 352', name: 'Wireless Networks', ch: 3, codeCell: 'C38', chCell: 'D38', titleCell: 'C39', mergeRange: 'C39:D40' },
          { code: 'CCE 331', name: 'Deep Learning', ch: 3, codeCell: 'F38', chCell: 'G38', titleCell: 'F39', mergeRange: 'F39:G40' },
          { code: 'CCE 332', name: 'Image Processing & Computer Vision', ch: 3, codeCell: 'I38', chCell: 'J38', titleCell: 'I39', mergeRange: 'I39:J40' },
          { code: 'CCE 333', name: 'GPU Architecture & Programming', ch: 3, codeCell: 'L38', chCell: 'M38', titleCell: 'L39', mergeRange: 'L39:M40' },
          { code: 'CCE 3EX', name: 'Elective Course (2)', ch: 2, codeCell: 'O38', chCell: 'P38', titleCell: 'O39', mergeRange: 'O39:P40' },
          { code: 'GFR 3EX', name: 'Elective Faculty (2)', ch: 2, codeCell: 'R38', chCell: 'S38', titleCell: 'R39', mergeRange: 'R39:S40' },
        ]
      }
    ]
  },
  {
    level: 4,
    title: 'LEVEL 4',
    semesters: [
      {
        semester: 1,
        title: 'Fall Semester',
        gpaCell: 'W43',
        chCell: 'X43',
        courses: [
          { code: 'CCE 431', name: 'Robotics Design', ch: 3, codeCell: 'C43', chCell: 'D43', titleCell: 'C44', mergeRange: 'C44:D45' },
          { code: 'CCE 432', name: 'Meta-Heuristic Algorithms', ch: 3, codeCell: 'F43', chCell: 'G43', titleCell: 'F44', mergeRange: 'F44:G45' },
          { code: 'CCE 433', name: 'Graduation Project 1', ch: 4, codeCell: 'I43', chCell: 'J43', titleCell: 'I44', mergeRange: 'I44:J45' },
          { code: 'CCE 4EX-1', name: 'Elective Course (3)', ch: 3, codeCell: 'L43', chCell: 'M43', titleCell: 'L44', mergeRange: 'L44:M45', rawCode: 'CCE 4EX' },
          { code: 'CCE 4EX-2', name: 'Elective Course (4)', ch: 3, codeCell: 'O43', chCell: 'P43', titleCell: 'O44', mergeRange: 'O44:P45', rawCode: 'CCE 4EX' },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'W47',
        chCell: 'X47',
        courses: [
          { code: 'CCE 434', name: 'Modeling & Simulation', ch: 3, codeCell: 'C47', chCell: 'D47', titleCell: 'C48', mergeRange: 'C48:D49' },
          { code: 'CCE 435', name: 'Data Mining', ch: 3, codeCell: 'F47', chCell: 'G47', titleCell: 'F48', mergeRange: 'F48:G49' },
          { code: 'CCE 436', name: 'Graduation Project 2', ch: 4, codeCell: 'I47', chCell: 'J47', titleCell: 'I48', mergeRange: 'I48:J49' },
          { code: 'CCE 4EX-3', name: 'Elective Course (5)', ch: 3, codeCell: 'L47', chCell: 'M47', titleCell: 'L48', mergeRange: 'L48:M49', rawCode: 'CCE 4EX' },
          { code: 'CCE 4EX-4', name: 'Elective Course (6)', ch: 3, codeCell: 'O47', chCell: 'P47', titleCell: 'O48', mergeRange: 'O48:P49', rawCode: 'CCE 4EX' },
        ]
      }
    ]
  }
];

// Prerequisite links (arrows connecting subjects in the curriculum flow diagram)
export const PREREQUISITE_LINKS = [
  { from: 'BSC 011', to: 'BSC 012' },
  { from: 'BSC 012', to: 'BSC 111' },
  { from: 'BSC 012', to: 'BSC 112' },
  { from: 'BSC 031', to: 'BSC 032' },
  { from: 'BSC 021', to: 'BSC 022' },
  { from: 'PRD 031', to: 'PRD 041' },
  { from: 'CCE 031', to: 'CCE 111' },
  { from: 'CCE 111', to: 'CCE 112' },
  { from: 'CCE 112', to: 'CCE 211' },
  { from: 'CCE 211', to: 'CCE 212' },
  { from: 'CCE 141', to: 'CCE 142' },
  { from: 'CCE 142', to: 'CCE 241' },
  { from: 'EPM 116', to: 'EPM 117' },
  { from: 'EPM 117', to: 'EPM 213' },
  { from: 'CCE 231', to: 'CCE 232' },
  { from: 'CCE 232', to: 'CCE 331' },
  { from: 'CCE 331', to: 'CCE 332' },
  { from: 'CCE 332', to: 'CCE 333' },
  { from: 'CCE 311', to: 'CCE 312' },
  { from: 'CCE 351', to: 'CCE 352' },
  { from: 'CCE 221', to: 'CCE 222' },
  { from: 'CCE 431', to: 'CCE 432' },
  { from: 'CCE 433', to: 'CCE 436' }
];

// Helper to normalize course code (e.g., 'GUR 0C1' -> 'GUR0C1', 'BSC 011' -> 'BSC011')
export function normalizeCode(code) {
  if (!code) return '';
  return code.toUpperCase().replace(/\s+/g, '').trim();
}

// Flat list of all 60 courses with prerequisite mappings
export const ALL_COURSES = DEGREE_STRUCTURE.flatMap(lvl =>
  lvl.semesters.flatMap(sem => sem.courses.map(c => {
    const norm = normalizeCode(c.code);
    const requires = PREREQUISITE_LINKS.filter(l => normalizeCode(l.to) === norm).map(l => l.from);
    const unlocks = PREREQUISITE_LINKS.filter(l => normalizeCode(l.from) === norm).map(l => l.to);
    return { ...c, level: lvl.level, semester: sem.semester, requires, unlocks };
  }))
);

