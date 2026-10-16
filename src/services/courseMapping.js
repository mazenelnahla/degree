// Course definitions, degree structures, and Excel grid coordinates for both
// Artificial Intelligence (AI) and Energy & Electrical Power (EEP) Programs.

// ==========================================
// 1. AI PROGRAM DEGREE STRUCTURE & PREREQS
// ==========================================
export const AI_DEGREE_STRUCTURE = [
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
          { code: 'EPM 3EX', name: 'Elective Course (1)', ch: 2, codeCell: 'O34', chCell: 'P34', titleCell: 'O35', mergeRange: 'O35:P36', aliases: ['EPM3EX'] },
          { code: 'GFR 3E1', name: 'Elective Faculty (1)', ch: 2, codeCell: 'R34', chCell: 'S34', titleCell: 'R35', mergeRange: 'R35:S36', aliases: ['GFR3E1'] },
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
          { code: 'CCE 3EX', name: 'Elective Course (2)', ch: 2, codeCell: 'O38', chCell: 'P38', titleCell: 'O39', mergeRange: 'O39:P40', aliases: ['CCE3EX'] },
          { code: 'GFR 3EX', name: 'Elective Faculty (2)', ch: 2, codeCell: 'R38', chCell: 'S38', titleCell: 'R39', mergeRange: 'R39:S40', aliases: ['GFR3EX'] },
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
          { code: 'CCE 4EX-1', name: 'Elective Course (3)', ch: 3, codeCell: 'L43', chCell: 'M43', titleCell: 'L44', mergeRange: 'L44:M45', rawCode: 'CCE 4EX', aliases: ['CCE4EX', 'CCE 4EX-1'] },
          { code: 'CCE 4EX-2', name: 'Elective Course (4)', ch: 3, codeCell: 'O43', chCell: 'P43', titleCell: 'O44', mergeRange: 'O44:P45', rawCode: 'CCE 4EX', aliases: ['CCE4EX', 'CCE 4EX-2'] },
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
          { code: 'CCE 4EX-3', name: 'Elective Course (5)', ch: 3, codeCell: 'L47', chCell: 'M47', titleCell: 'L48', mergeRange: 'L48:M49', rawCode: 'CCE 4EX', aliases: ['CCE4EX', 'CCE 4EX-3'] },
          { code: 'CCE 4EX-4', name: 'Elective Course (6)', ch: 3, codeCell: 'O47', chCell: 'P47', titleCell: 'O48', mergeRange: 'O48:P49', rawCode: 'CCE 4EX', aliases: ['CCE4EX', 'CCE 4EX-4'] },
        ]
      }
    ]
  }
];

export const AI_PREREQUISITE_LINKS = [
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

// ==========================================
// 2. EEP PROGRAM DEGREE STRUCTURE & PREREQS
// ==========================================
export const EEP_DEGREE_STRUCTURE = [
  {
    level: 0,
    title: 'LEVEL 0',
    semesters: [
      {
        semester: 1,
        title: 'Fall Semester',
        gpaCell: 'Y10',
        chCell: 'Z10',
        courses: [
          { code: 'BSC 011', name: 'Mathematics I', ch: 3, codeCell: 'D10', chCell: 'E10', titleCell: 'D11', mergeRange: 'D11:E11' },
          { code: 'BSC 031', name: 'Physics I', ch: 3, codeCell: 'G10', chCell: 'H10', titleCell: 'G11', mergeRange: 'G11:H11' },
          { code: 'BSC 021', name: 'Mechanics I', ch: 3, codeCell: 'J10', chCell: 'K10', titleCell: 'J11', mergeRange: 'J11:K11' },
          { code: 'BSC 041', name: 'Chemical Engineering', ch: 3, codeCell: 'M10', chCell: 'N10', titleCell: 'M11', mergeRange: 'M11:N11' },
          { code: 'PRD 031', name: 'Engineering Drawing and Projection', ch: 3, codeCell: 'P10', chCell: 'Q10', titleCell: 'P11', mergeRange: 'P11:Q11' },
          { code: 'GUR 0C1', name: 'University Requirement (1)', ch: 1, codeCell: 'S10', chCell: 'T10', titleCell: 'S11', mergeRange: 'S11:T11', aliases: ['GUR0C1'] },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'Y20',
        chCell: 'Z20',
        courses: [
          { code: 'BSC 012', name: 'Mathematics II', ch: 3, codeCell: 'D20', chCell: 'E20', titleCell: 'D21', mergeRange: 'D21:E21' },
          { code: 'BSC 032', name: 'Physics II', ch: 3, codeCell: 'G20', chCell: 'H20', titleCell: 'G21', mergeRange: 'G21:H21' },
          { code: 'BSC 022', name: 'Mechanics II', ch: 3, codeCell: 'J20', chCell: 'K20', titleCell: 'J21', mergeRange: 'J21:K21' },
          { code: 'PRD 041', name: 'Production Technology', ch: 3, codeCell: 'M20', chCell: 'N20', titleCell: 'M21', mergeRange: 'M21:N21' },
          { code: 'CCE 031', name: 'Introduction to Computer Science', ch: 3, codeCell: 'P20', chCell: 'Q20', titleCell: 'P21', mergeRange: 'P21:Q21' },
          { code: 'GUR 0C2', name: 'University Requirement (2)', ch: 2, codeCell: 'S20', chCell: 'T20', titleCell: 'S21', mergeRange: 'S21:T21', aliases: ['GUR0C2'] },
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
        gpaCell: 'Y30',
        chCell: 'Z30',
        courses: [
          { code: 'MPE 122', name: 'Thermodynamics', ch: 3, codeCell: 'D30', chCell: 'E30', titleCell: 'D31', mergeRange: 'D31:E31' },
          { code: 'MPE 112', name: 'Fluid Mechanics', ch: 3, codeCell: 'G30', chCell: 'H30', titleCell: 'G31', mergeRange: 'G31:H31' },
          { code: 'EPM 111', name: 'Electrical Circuits', ch: 3, codeCell: 'J30', chCell: 'K30', titleCell: 'J31', mergeRange: 'J31:K31' },
          { code: 'CCE 121', name: 'Logic Circuits', ch: 3, codeCell: 'M30', chCell: 'N30', titleCell: 'M31', mergeRange: 'M31:N31' },
          { code: 'BSC 111', name: 'Mathematics III', ch: 3, codeCell: 'P30', chCell: 'Q30', titleCell: 'P31', mergeRange: 'P31:Q31' },
          { code: 'GUR 1C1', name: 'University Requirement (3)', ch: 2, codeCell: 'S30', chCell: 'T30', titleCell: 'S31', mergeRange: 'S31:T31', aliases: ['GUR1C1'] },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'Y40',
        chCell: 'Z40',
        courses: [
          { code: 'BSC 112', name: 'Statistics & Numerical Analysis', ch: 3, codeCell: 'D40', chCell: 'E40', titleCell: 'D41', mergeRange: 'D41:E41' },
          { code: 'MPE 131', name: 'Energy Resources', ch: 3, codeCell: 'G40', chCell: 'H40', titleCell: 'G41', mergeRange: 'G41:H41' },
          { code: 'MPE 123', name: 'Heat Transfer', ch: 3, codeCell: 'J40', chCell: 'K40', titleCell: 'J41', mergeRange: 'J41:K41' },
          { code: 'EPM 112', name: 'Fundamentals of Electromagnetic Fields', ch: 3, codeCell: 'M40', chCell: 'N40', titleCell: 'M41', mergeRange: 'M41:N41' },
          { code: 'PRD 133', name: 'Machine Design', ch: 3, codeCell: 'P40', chCell: 'Q40', titleCell: 'P41', mergeRange: 'P41:Q41' },
          { code: 'GUR 1C2', name: 'University Requirement (4)', ch: 2, codeCell: 'S40', chCell: 'T40', titleCell: 'S41', mergeRange: 'S41:T41', aliases: ['GUR1C2'] },
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
        gpaCell: 'Y50',
        chCell: 'Z50',
        courses: [
          { code: 'MPE 231', name: 'Renewable Energy Systems', ch: 3, codeCell: 'D50', chCell: 'E50', titleCell: 'D51', mergeRange: 'D51:E51' },
          { code: 'MPE 241', name: 'Combustion', ch: 3, codeCell: 'G50', chCell: 'H50', titleCell: 'G51', mergeRange: 'G51:H51' },
          { code: 'EPM 221', name: 'Electrical Machines (1)', ch: 3, codeCell: 'J50', chCell: 'K50', titleCell: 'J51', mergeRange: 'J51:K51' },
          { code: 'EPM 241', name: 'Industrial Electronics', ch: 3, codeCell: 'M50', chCell: 'N50', titleCell: 'M51', mergeRange: 'M51:N51' },
          { code: 'GUR 2C1', name: 'University Requirement (5)', ch: 2, codeCell: 'P50', chCell: 'Q50', titleCell: 'P51', mergeRange: 'P51:Q51', aliases: ['GUR2C1'] },
          { code: 'GUR 2E1', name: 'Elective University (1)', ch: 2, codeCell: 'S50', chCell: 'T50', titleCell: 'S51', mergeRange: 'S51:T51', aliases: ['GUR2E1'] },
          { code: 'GFR 2XX', name: 'Summer Training (1)', ch: 1, codeCell: 'V50', chCell: 'W50', titleCell: 'V51', mergeRange: 'V51:W51' },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'Y60',
        chCell: 'Z60',
        courses: [
          { code: 'MPE 232', name: 'Energy Storage Systems', ch: 3, codeCell: 'D60', chCell: 'E60', titleCell: 'D61', mergeRange: 'D61:E61' },
          { code: 'EPM 231', name: 'Electrical Power Engineering (1)', ch: 3, codeCell: 'G60', chCell: 'H60', titleCell: 'G61', mergeRange: 'G61:H61' },
          { code: 'EPM 222', name: 'Electrical Machines (2)', ch: 3, codeCell: 'J60', chCell: 'K60', titleCell: 'J61', mergeRange: 'J61:K61' },
          { code: 'MPE 251', name: 'Automatic Control Systems', ch: 3, codeCell: 'M60', chCell: 'N60', titleCell: 'M61', mergeRange: 'M61:N61' },
          { code: 'MPE 252', name: 'Measurement and instrumentation', ch: 2, codeCell: 'P60', chCell: 'Q60', titleCell: 'P61', mergeRange: 'P61:Q61' },
          { code: 'GUR 2E2', name: 'Elective University (2)', ch: 2, codeCell: 'S60', chCell: 'T60', titleCell: 'S61', mergeRange: 'S61:T61', aliases: ['GUR2E2'] },
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
        gpaCell: 'Y70',
        chCell: 'Z70',
        courses: [
          { code: 'MPE 341', name: 'Internal Combustion Engines', ch: 3, codeCell: 'D70', chCell: 'E70', titleCell: 'D71', mergeRange: 'D71:E71' },
          { code: 'MPE 311', name: 'Incompressible Flow Machines', ch: 3, codeCell: 'G70', chCell: 'H70', titleCell: 'G71', mergeRange: 'G71:H71' },
          { code: 'EPM 341', name: 'Power Electronics (1)', ch: 3, codeCell: 'J70', chCell: 'K70', titleCell: 'J71', mergeRange: 'J71:K71' },
          { code: 'EPM 331', name: 'Electrical Power Engineering (2)', ch: 3, codeCell: 'M70', chCell: 'N70', titleCell: 'M71', mergeRange: 'M71:N71' },
          { code: 'MPE 3EX', name: 'Elective Course (1)', ch: 2, codeCell: 'P70', chCell: 'Q70', titleCell: 'P71', mergeRange: 'P71:Q71', aliases: ['MPE3EX'] },
          { code: 'GFR 3EX', name: 'Elective Faculty (1)', ch: 2, codeCell: 'S70', chCell: 'T70', titleCell: 'S71', mergeRange: 'S71:T71', aliases: ['GFR3EX'] },
          { code: 'GFR 3XX', name: 'Summer Training (2)', ch: 1, codeCell: 'V70', chCell: 'W70', titleCell: 'V71', mergeRange: 'V71:W71' },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'Y80',
        chCell: 'Z80',
        courses: [
          { code: 'MPE 351', name: 'Thermal Process Engineering', ch: 3, codeCell: 'D80', chCell: 'E80', titleCell: 'D81', mergeRange: 'D81:E81' },
          { code: 'MPE 312', name: 'Compressible Flow Machines', ch: 3, codeCell: 'G80', chCell: 'H80', titleCell: 'G81', mergeRange: 'G81:H81' },
          { code: 'EPM 342', name: 'Power Electronics (2)', ch: 3, codeCell: 'J80', chCell: 'K80', titleCell: 'J81', mergeRange: 'J81:K81' },
          { code: 'EPM 351', name: 'Power System Protection', ch: 3, codeCell: 'M80', chCell: 'N80', titleCell: 'M81', mergeRange: 'M81:N81' },
          { code: 'EPM 3EX', name: 'Elective Course (2)', ch: 3, codeCell: 'P80', chCell: 'Q80', titleCell: 'P81', mergeRange: 'P81:Q81', aliases: ['EPM3EX'] },
          { code: 'CCE 3EX', name: 'Elective Faculty (2)', ch: 2, codeCell: 'S80', chCell: 'T80', titleCell: 'S81', mergeRange: 'S81:T81', aliases: ['CCE3EX'] },
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
        gpaCell: 'Y90',
        chCell: 'Z90',
        courses: [
          { code: 'MPE 411', name: 'Graduation Project 1', ch: 3, codeCell: 'D90', chCell: 'E90', titleCell: 'D91', mergeRange: 'D91:E91' },
          { code: 'EPM 411', name: 'Photovoltaic Systems', ch: 2, codeCell: 'G90', chCell: 'H90', titleCell: 'G91', mergeRange: 'G91:H91' },
          { code: 'EPM 412', name: 'Electrical Distribution Systems Installations', ch: 3, codeCell: 'J90', chCell: 'K90', titleCell: 'J91', mergeRange: 'J91:K91' },
          { code: 'MPE 451', name: 'Economics of Energy', ch: 2, codeCell: 'M90', chCell: 'N90', titleCell: 'M91', mergeRange: 'M91:N91' },
          { code: 'MPE 4EX-3', name: 'Elective Course (3)', ch: 3, codeCell: 'P90', chCell: 'Q90', titleCell: 'P91', mergeRange: 'P91:Q91', rawCode: 'MPE 4EX', aliases: ['MPE4EX', 'MPE 4EX-3'] },
          { code: 'MPE 4EX-4', name: 'Elective Course (4)', ch: 3, codeCell: 'S90', chCell: 'T90', titleCell: 'S91', mergeRange: 'S91:T91', rawCode: 'MPE 411', aliases: ['MPE411', 'MPE 4EX', 'MPE 4EX-4'] },
        ]
      },
      {
        semester: 2,
        title: 'Spring Semester',
        gpaCell: 'Y100',
        chCell: 'Z100',
        courses: [
          { code: 'MPE 452', name: 'Thermal Power Plants', ch: 3, codeCell: 'D100', chCell: 'E100', titleCell: 'D101', mergeRange: 'D101:E101' },
          { code: 'EPM 431', name: 'Grid Integration of Renewable Energy', ch: 2, codeCell: 'G100', chCell: 'H100', titleCell: 'G101', mergeRange: 'G101:H101' },
          { code: 'MPE 412', name: 'Graduation Project 2', ch: 3, codeCell: 'J100', chCell: 'K100', titleCell: 'J101', mergeRange: 'J101:K101' },
          { code: 'EPM 4EX-5', name: 'Elective Course (5)', ch: 3, codeCell: 'M100', chCell: 'N100', titleCell: 'M101', mergeRange: 'M101:N101', rawCode: 'EPM 431', aliases: ['EPM431', 'EPM 4EX', 'EPM 4EX-5'] },
          { code: 'EPM 4EX-6', name: 'Elective Course (6)', ch: 3, codeCell: 'P100', chCell: 'Q100', titleCell: 'P101', mergeRange: 'P101:Q101', rawCode: 'EPM 431', aliases: ['EPM431', 'EPM 4EX', 'EPM 4EX-6'] },
        ]
      }
    ]
  }
];

export const EPP_PREREQUISITE_LINKS = [
  { from: 'BSC 011', to: 'BSC 012' },
  { from: 'BSC 031', to: 'BSC 032' },
  { from: 'BSC 021', to: 'BSC 022' },
  { from: 'BSC 012', to: 'BSC 111' },
  { from: 'BSC 012', to: 'MPE 122' },
  { from: 'BSC 022', to: 'EPM 111' },
  { from: 'BSC 022', to: 'MPE 112' },
  { from: 'BSC 111', to: 'PRD 133' },
  { from: 'BSC 111', to: 'EPM 241' },
  { from: 'BSC 112', to: 'MPE 231' },
  { from: 'EPM 111', to: 'MPE 123' },
  { from: 'EPM 111', to: 'EPM 221' },
  { from: 'MPE 123', to: 'EPM 221' },
  { from: 'MPE 122', to: 'MPE 241' },
  { from: 'MPE 112', to: 'MPE 311' },
  { from: 'MPE 112', to: 'EPM 331' },
  { from: 'MPE 231', to: 'MPE 232' },
  { from: 'MPE 232', to: 'EPM 231' },
  { from: 'MPE 232', to: 'MPE 341' },
  { from: 'EPM 221', to: 'EPM 222' },
  { from: 'EPM 222', to: 'EPM 341' },
  { from: 'EPM 241', to: 'MPE 251' },
  { from: 'EPM 231', to: 'MPE 451' },
  { from: 'EPM 331', to: 'EPM 351' },
  { from: 'EPM 341', to: 'EPM 342' },
  { from: 'EPM 341', to: 'MPE 351' },
  { from: 'MPE 341', to: 'MPE 351' },
  { from: 'MPE 311', to: 'MPE 312' },
  { from: 'MPE 312', to: 'EPM 411' },
  { from: 'EPM 342', to: 'EPM 412' },
  { from: 'MPE 411', to: 'MPE 452' },
  { from: 'EPM 411', to: 'EPM 431' },
  { from: 'EPM 412', to: 'MPE 412' }
];

// Helper to normalize course code (e.g. 'GUR 0C1' -> 'GUR0C1', 'BSC 011' -> 'BSC011')
export function normalizeCode(code) {
  if (!code) return '';
  return code.toUpperCase().replace(/\s+/g, '').trim();
}

// Flat list generator with requires / unlocks computed
function createFlatCourseList(structure, prereqLinks) {
  return structure.flatMap(lvl =>
    lvl.semesters.flatMap(sem => sem.courses.map(c => {
      const norm = normalizeCode(c.code);
      const requires = prereqLinks.filter(l => normalizeCode(l.to) === norm).map(l => l.from);
      const unlocks = prereqLinks.filter(l => normalizeCode(l.from) === norm).map(l => l.to);
      return { ...c, level: lvl.level, semester: sem.semester, requires, unlocks };
    }))
  );
}

export const AI_ALL_COURSES = createFlatCourseList(AI_DEGREE_STRUCTURE, AI_PREREQUISITE_LINKS);
export const EPP_ALL_COURSES = createFlatCourseList(EEP_DEGREE_STRUCTURE, EPP_PREREQUISITE_LINKS);
export const EEP_ALL_COURSES = EPP_ALL_COURSES;
export const EEP_PREREQUISITE_LINKS = EPP_PREREQUISITE_LINKS;
export const EPP_DEGREE_STRUCTURE = EEP_DEGREE_STRUCTURE;

// Backwards-compatible default exports (points to AI)
export const DEGREE_STRUCTURE = AI_DEGREE_STRUCTURE;
export const PREREQUISITE_LINKS = AI_PREREQUISITE_LINKS;
export const ALL_COURSES = AI_ALL_COURSES;

export const PREREQUISITE_STORAGE_KEY = 'degree_custom_prerequisite_links';
export const EEP_PREREQUISITE_STORAGE_KEY = 'degree_custom_prerequisite_links_eep';

// ==========================================
// 3. PROGRAM METADATA CONFIGS
// ==========================================
export const PROGRAMS = {
  AI: {
    id: 'AI',
    name: 'Artificial Intelligence',
    shortCode: 'AI',
    fullName: 'Artificial Intelligence & Machine Learning Engineering Program',
    templatePath: '/template.xlsx',
    templateFileName: 'template.xlsx',
    levelLabelPrefix: 'AI-LEVEL',
    treeTitle: 'Course Tree - Artificial Intelligence Engineering Program',
    structure: AI_DEGREE_STRUCTURE,
    defaultPrerequisites: AI_PREREQUISITE_LINKS,
    courses: AI_ALL_COURSES,
    storageKey: PREREQUISITE_STORAGE_KEY,
    fileEndpoint: '/prerequisites.json',
    allSeasonCourses: new Set(['BSC041', 'PRD031', 'PRD041', 'CCE031']),
    rowBlockSize: 55,
    headerCells: {
      nameCell: 'F2',
      levelCell: 'D1',
      cgpaTopCell: 'P3',
      cgpaBottomCell: 'W51',
      semesterCell: 'G3',
      semesterGpaCell: 'K3',
      warningsCell: 'N4',
      academicYearCell: 'Q2'
    }
  },
  EEP: {
    id: 'EEP',
    name: 'Energy and Electrical Power',
    shortCode: 'EEP',
    fullName: 'Energy and Electrical Power Engineering Program',
    templatePath: '/EPP Template.xlsx',
    templateFileName: 'EPP Template.xlsx',
    levelLabelPrefix: 'EEP-LEVEL',
    treeTitle: 'Course Tree - Energy and Electrical Power Engineering Program',
    structure: EPP_DEGREE_STRUCTURE,
    defaultPrerequisites: EPP_PREREQUISITE_LINKS,
    courses: EPP_ALL_COURSES,
    storageKey: EEP_PREREQUISITE_STORAGE_KEY,
    fileEndpoint: '/prerequisites_eep.json',
    allSeasonCourses: new Set(['BSC041', 'PRD031', 'PRD041', 'CCE031']),
    rowBlockSize: 120,
    headerCells: {
      nameCell: 'G5',
      levelCell: 'D4',
      cgpaTopCell: 'Q6',
      cgpaBottomCell: 'Y111',
      semesterCell: 'G6',
      semesterGpaCell: 'L6',
      warningsCell: 'N7',
      academicYearCell: 'Q5'
    }
  }
};

/**
 * Normalizes any program string / ID into 'AI' or 'EEP'
 */
export function normalizeProgramId(input) {
  if (!input) return 'AI';
  const str = String(input).toLowerCase().trim();
  if (
    str.includes('eep') ||
    str.includes('epp') ||
    str.includes('energy') ||
    str.includes('power') ||
    str.includes('كهرباء') ||
    str.includes('طاقة') ||
    str.includes('قوى')
  ) {
    return 'EEP';
  }
  return 'AI';
}

/**
 * Get program config by ID or name
 */
export function getProgram(programId) {
  const norm = normalizeProgramId(programId);
  return PROGRAMS[norm] || PROGRAMS.AI;
}

/**
 * Get degree structure for a specific program
 */
export function getDegreeStructure(programId = 'AI') {
  return getProgram(programId).structure;
}

/**
 * Get flat courses list for a specific program
 */
export function getAllCourses(programId = 'AI') {
  return getProgram(programId).courses;
}

/**
 * Fast lookup map helper
 */
const PROGRAM_LOOKUP_MAPS = {
  AI: new Map(),
  EEP: new Map()
};

for (const [pId, pData] of Object.entries(PROGRAMS)) {
  const map = PROGRAM_LOOKUP_MAPS[pId];
  for (const c of pData.courses) {
    map.set(normalizeCode(c.code), c);
    if (c.aliases) {
      for (const a of c.aliases) {
        map.set(normalizeCode(a), c);
      }
    }
  }
}

export function findCourseInProgram(code, programId = 'AI') {
  const norm = normalizeCode(code);
  const pNorm = normalizeProgramId(programId);
  const map = PROGRAM_LOOKUP_MAPS[pNorm] || PROGRAM_LOOKUP_MAPS.AI;
  return map.get(norm) || null;
}

// ==========================================
// 4. PREREQUISITE MANAGEMENT FUNCTIONS
// ==========================================

export function loadPrerequisiteLinks(programId = 'AI') {
  const prog = getProgram(programId);
  try {
    const saved = localStorage.getItem(prog.storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`Failed to load ${prog.id} prerequisite links from localStorage:`, err);
  }
  return [...prog.defaultPrerequisites];
}

export async function fetchFilePrerequisiteLinks(programId = 'AI') {
  const prog = getProgram(programId);
  try {
    const res = await fetch(`${prog.fileEndpoint}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const links = await res.json();
      if (Array.isArray(links) && links.length > 0) {
        try {
          localStorage.setItem(prog.storageKey, JSON.stringify(links));
        } catch (_) {}
        return links;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch ${prog.fileEndpoint}:`, err);
  }
  return null;
}

export async function savePrerequisiteLinks(links, programId = 'AI') {
  const prog = getProgram(programId);
  try {
    localStorage.setItem(prog.storageKey, JSON.stringify(links));
  } catch (err) {
    console.error(`Failed to save ${prog.id} prerequisite links to localStorage:`, err);
  }

  try {
    const res = await fetch('/api/save-prerequisites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: prog.id, links })
    });
    if (res.ok) {
      return { success: true, localFile: true };
    }
  } catch (err) {
    console.warn('Dev server file write endpoint unavailable, saved to browser localStorage:', err);
  }

  return { success: true, localFile: false };
}

export function downloadPrerequisitesJson(links, programId = 'AI') {
  const prog = getProgram(programId);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(links, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', `${prog.id.toLowerCase()}_degree_prerequisites.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

export async function makeDefaultPrerequisiteLinks(links, programId = 'AI') {
  const prog = getProgram(programId);
  try {
    localStorage.setItem(prog.storageKey, JSON.stringify(links));
  } catch (err) {
    console.error('Failed to update localStorage:', err);
  }

  try {
    const res = await fetch('/api/set-default-prerequisites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: prog.id, links })
    });
    if (res.ok) {
      return { success: true, localFile: true };
    }
  } catch (err) {
    console.warn('Could not post to /api/set-default-prerequisites:', err);
  }
  return { success: true, localFile: false };
}

export async function resetPrerequisiteLinks(programId = 'AI') {
  const prog = getProgram(programId);
  try {
    localStorage.removeItem(prog.storageKey);
  } catch (err) {
    console.error(`Failed to reset ${prog.id} prerequisite links in localStorage:`, err);
  }

  try {
    await fetch('/api/save-prerequisites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: prog.id, links: prog.defaultPrerequisites })
    });
  } catch (_) {}

  return [...prog.defaultPrerequisites];
}

export function getCourseRequires(code, links = AI_PREREQUISITE_LINKS) {
  const norm = normalizeCode(code);
  return links.filter(l => normalizeCode(l.to) === norm).map(l => l.from);
}

export function getCourseUnlocks(code, links = AI_PREREQUISITE_LINKS) {
  const norm = normalizeCode(code);
  return links.filter(l => normalizeCode(l.from) === norm).map(l => l.to);
}

// Level 0 dual-season courses (shared across programs)
export const LEVEL_0_ALL_SEASON_COURSES = new Set([
  'BSC041',
  'PRD031',
  'PRD041',
  'CCE031'
]);

export function isAllSeasonCourse(courseCode) {
  return LEVEL_0_ALL_SEASON_COURSES.has(normalizeCode(courseCode));
}

export function getCourseSeason(courseCode, programId = 'AI') {
  const norm = normalizeCode(courseCode);
  if (LEVEL_0_ALL_SEASON_COURSES.has(norm)) {
    return 'Both';
  }
  const course = findCourseInProgram(norm, programId);
  if (!course) return null;
  return course.semester === 1 ? 'Fall' : course.semester === 2 ? 'Spring' : null;
}

export function isCourseEligibleForSeason(courseCode, activeSeason, programId = 'AI') {
  if (!activeSeason) return true;
  const courseSeason = getCourseSeason(courseCode, programId);
  if (!courseSeason || courseSeason === 'Both') return true;
  return courseSeason.toLowerCase() === activeSeason.toLowerCase();
}

export function getStudentRegistrationSeason(student) {
  if (!student) return 'Fall';
  const progId = student.program || 'AI';

  const selected = student.selectedCourseCodes || [];
  if (selected.length > 0) {
    for (const code of selected) {
      const s = getCourseSeason(code, progId);
      if (s && s !== 'Both') return s;
    }
  }

  const lastRegular = student.regularSemesters?.at(-1);
  if (lastRegular) {
    const semName = (lastRegular.semesterName || '').toLowerCase();
    if (semName.includes('fall')) {
      return 'Spring';
    }
    return 'Fall';
  }

  return 'Fall';
}

export function checkPrerequisitesMet(courseCode, studentCourseMap = {}, links = null, programId = 'AI') {
  const prog = getProgram(programId);
  const activeLinks = links || prog.defaultPrerequisites;
  const norm = normalizeCode(courseCode);
  const requires = activeLinks
    .filter(l => normalizeCode(l.to) === norm)
    .map(l => l.from);

  if (!requires || requires.length === 0) {
    return { canTake: true, missingPrereqs: [] };
  }

  const missingPrereqs = [];
  const coursesList = prog.courses;

  for (const reqCode of requires) {
    const reqNorm = normalizeCode(reqCode);
    let record = studentCourseMap[reqNorm];

    if (!record) {
      const matchCourse = coursesList.find(c => normalizeCode(c.code) === reqNorm);
      if (matchCourse && matchCourse.aliases) {
        for (const alias of matchCourse.aliases) {
          if (studentCourseMap[normalizeCode(alias)]) {
            record = studentCourseMap[normalizeCode(alias)];
            break;
          }
        }
      }
    }

    const isPassed = record && record.isPassed && (record.points === undefined || record.points > 0.00);
    if (!isPassed) {
      missingPrereqs.push(reqCode);
    }
  }

  return {
    canTake: missingPrereqs.length === 0,
    missingPrereqs
  };
}

export function getRegistrationLimit(student) {
  if (!student) {
    return {
      maxCourses: 6,
      ruleText: 'Standard registration (up to 6 subjects allowed)',
      semesterGpa: null,
      cgpa: null,
      tier: 'standard',
      isOverridden: false,
      naturalLimit: 6
    };
  }

  const cgpa = student.cgpa !== null && student.cgpa !== undefined ? Number(student.cgpa) : null;
  const semGpa = student.latestSemesterGpa !== null && student.latestSemesterGpa !== undefined
    ? Number(student.latestSemesterGpa)
    : (student.regularSemesters?.at(-1)?.gpa !== undefined && student.regularSemesters?.at(-1)?.gpa !== null
        ? Number(student.regularSemesters.at(-1).gpa)
        : null);

  let naturalLimit = 6;
  let naturalRuleText = '';
  let naturalTier = 'good_standing';

  if (semGpa !== null && semGpa < 1.7) {
    naturalLimit = 4;
    naturalRuleText = `Semester GPA (${semGpa.toFixed(2)} < 1.70) limits registration to 4 subjects`;
    naturalTier = 'strict_warning';
  } else if (cgpa !== null && cgpa < 2.0) {
    naturalLimit = 5;
    naturalRuleText = semGpa !== null
      ? `Semester GPA (${semGpa.toFixed(2)} ≥ 1.70) & CGPA (${cgpa.toFixed(2)} < 2.00) limits registration to 5 subjects`
      : `CGPA (${cgpa.toFixed(2)} < 2.00) limits registration to 5 subjects`;
    naturalTier = 'academic_warning';
  } else {
    naturalLimit = 6;
    naturalRuleText = semGpa !== null
      ? `Semester GPA (${semGpa.toFixed(2)} ≥ 1.70) & CGPA (${cgpa !== null ? cgpa.toFixed(2) : '≥ 2.00'}) allows registering 6 subjects`
      : `Good standing allows registering up to 6 subjects`;
    naturalTier = 'good_standing';
  }

  // If GPA restriction is paused for this individual student, unlock 6 subjects
  if (student.unlockGpaLimit) {
    return {
      maxCourses: 6,
      ruleText: `GPA restriction paused (6 subjects unlocked for registration. Natural GPA limit was ${naturalLimit} subjects).`,
      semesterGpa: semGpa,
      cgpa,
      tier: 'overridden',
      isOverridden: true,
      naturalLimit,
      naturalRuleText,
      naturalTier
    };
  }

  return {
    maxCourses: naturalLimit,
    ruleText: naturalRuleText,
    semesterGpa: semGpa,
    cgpa,
    tier: naturalTier,
    isOverridden: false,
    naturalLimit,
    naturalRuleText,
    naturalTier
  };
}

export function autoAssignEligibleCourses(student, prerequisiteLinks = null, programId = null) {
  if (!student) {
    return { assignedCodes: [], limit: 6, failedAssigned: 0, pendingAssigned: 0, skippedPrereq: 0 };
  }

  const progId = programId || student.program || 'AI';
  const prog = getProgram(progId);
  const links = prerequisiteLinks || prog.defaultPrerequisites;
  const regLimit = getRegistrationLimit(student);
  const maxCourses = regLimit.maxCourses;
  const courseMap = student.courseMap || {};
  const coursesList = prog.courses;

  const assigned = [];
  const assignedNorms = new Set();
  let skippedPrereq = 0;
  let failedAssigned = 0;
  let pendingAssigned = 0;

  const candidateFailed = [];
  const candidatePending = [];

  for (const course of coursesList) {
    const norm = normalizeCode(course.code);
    let record = courseMap[norm];
    if (!record && course.aliases) {
      for (const a of course.aliases) {
        if (courseMap[normalizeCode(a)]) {
          record = courseMap[normalizeCode(a)];
          break;
        }
      }
    }

    if (record && record.isPassed && (record.points === undefined || record.points > 0.00)) {
      continue;
    }

    if (record && record.points === 0.00) {
      candidateFailed.push(course);
    } else if (!record) {
      candidatePending.push(course);
    }
  }

  // Priority 1: Failed courses with satisfied prerequisites
  for (const course of candidateFailed) {
    if (assigned.length >= maxCourses) break;
    const prereqCheck = checkPrerequisitesMet(course.code, courseMap, links, progId);
    if (prereqCheck.canTake) {
      assigned.push(course.code);
      assignedNorms.add(normalizeCode(course.code));
      failedAssigned++;
    } else {
      skippedPrereq++;
    }
  }

  // Priority 2: Pending curriculum courses with satisfied prerequisites
  for (const course of candidatePending) {
    if (assigned.length >= maxCourses) break;
    const norm = normalizeCode(course.code);
    if (assignedNorms.has(norm)) continue;

    const prereqCheck = checkPrerequisitesMet(course.code, courseMap, links, progId);
    if (prereqCheck.canTake) {
      assigned.push(course.code);
      assignedNorms.add(norm);
      pendingAssigned++;
    } else {
      skippedPrereq++;
    }
  }

  return {
    assignedCodes: assigned,
    limit: maxCourses,
    failedAssigned,
    pendingAssigned,
    skippedPrereq,
    ruleText: regLimit.ruleText
  };
}
