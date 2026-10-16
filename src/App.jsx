import React, { useState, useEffect } from 'react';
import { parseTranscriptPdf, cleanArabicText } from './services/pdfParser.js';
import {
  generatePreservedExcelWorkbook,
  generateSingleSheetCombinedWorkbook,
  generateCombinedTreeAndRegistrationWorkbook,
  generateRegistrationWorkbook,
  generateSingleSheetRegistrationWorkbook
} from './services/excelProcessor.js';
import { parseStudentRosterExcel, normalizeStudentId } from './services/rosterParser.js';
import { parseExportedDegreeWorkbook } from './services/excelDegreeParser.js';
import { exportProjectBackup, parseProjectBackup } from './services/projectBackup.js';
import {
  normalizeCode,
  normalizeProgramId,
  getAllCourses,
  getDegreeStructure,
  ALL_COURSES,
  loadPrerequisiteLinks,
  savePrerequisiteLinks,
  resetPrerequisiteLinks,
  fetchFilePrerequisiteLinks,
  downloadPrerequisitesJson,
  makeDefaultPrerequisiteLinks,
  checkPrerequisitesMet,
  getRegistrationLimit,
  getCourseSeason,
  getStudentRegistrationSeason,
  isCourseEligibleForSeason
} from './services/courseMapping.js';

import StudentHeader from './components/StudentHeader.jsx';
import DegreeGrid from './components/DegreeGrid.jsx';
import UploadZone from './components/UploadZone.jsx';
import StudentTabs from './components/StudentTabs.jsx';
import ExportControls from './components/ExportControls.jsx';
import PrerequisiteEditorModal from './components/PrerequisiteEditorModal.jsx';
import AddStudentModal from './components/AddStudentModal.jsx';
import CrossSubjectsModal from './components/CrossSubjectsModal.jsx';
import { GraduationCap, Sun, Moon, Info, RefreshCw, FileText, GitFork, Save, FolderUp, UserPlus, CheckSquare, Zap, Cpu } from 'lucide-react';

export default function App() {
  const [activeProgram, setActiveProgram] = useState('AI');
  const [aiTemplateBuffer, setAiTemplateBuffer] = useState(null);
  const [eepTemplateBuffer, setEepTemplateBuffer] = useState(null);
  const [customTemplateBuffer, setCustomTemplateBuffer] = useState(null);
  const [customTemplateName, setCustomTemplateName] = useState(null);

  const [students, setStudents] = useState([]);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [statusMessage, setStatusMessage] = useState('');
  const [rosterMap, setRosterMap] = useState(new Map());
  const [rosterInfo, setRosterInfo] = useState(null);

  // Manual Add Student & Cross Subjects modal states
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCrossSubjectsModalOpen, setIsCrossSubjectsModalOpen] = useState(false);
  
  // Prerequisite links state for each program
  const [aiPrereqLinks, setAiPrereqLinks] = useState(() => loadPrerequisiteLinks('AI'));
  const [eepPrereqLinks, setEepPrereqLinks] = useState(() => loadPrerequisiteLinks('EEP'));
  const [isPrereqModalOpen, setIsPrereqModalOpen] = useState(false);
  const [initialPrereqModalCourse, setInitialPrereqModalCourse] = useState(null);

  // Handler for uploading Student ID <-> Student Name Excel roster
  const handleRosterLoaded = async (file) => {
    setIsLoading(true);
    setStatusMessage(`Parsing student ID ↔ Name roster: ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const { idToNameMap, rosterCount } = await parseStudentRosterExcel(buffer);

      setRosterMap(idToNameMap);
      setRosterInfo({ fileName: file.name, count: rosterCount });

      // Immediately re-assign names to already loaded students if they match
      let updatedCount = 0;
      setStudents(prev => {
        return prev.map(s => {
          const normId = normalizeStudentId(s.studentId);
          if (normId && idToNameMap.has(normId)) {
            const mappedName = idToNameMap.get(normId);
            if (mappedName && mappedName !== s.studentName) {
              updatedCount++;
              return { ...s, studentName: mappedName };
            }
          }
          return s;
        });
      });

      let msg = `Loaded student roster (${rosterCount} students mapped from ${file.name}).`;
      if (updatedCount > 0) {
        msg += ` Updated ${updatedCount} currently loaded student(s) with their matched names!`;
      }
      setStatusMessage(msg);
    } catch (err) {
      console.error('Failed to parse student roster Excel:', err);
      alert(`Could not parse student roster Excel: ${err.message}`);
      setStatusMessage(`Error loading roster: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load persisted prerequisites from local file on start for both programs
  useEffect(() => {
    async function loadInitialPrerequisites() {
      try {
        const [aiFileLinks, eepFileLinks] = await Promise.all([
          fetchFilePrerequisiteLinks('AI'),
          fetchFilePrerequisiteLinks('EEP')
        ]);
        if (aiFileLinks && Array.isArray(aiFileLinks) && aiFileLinks.length > 0) {
          setAiPrereqLinks(aiFileLinks);
          console.log(`Loaded ${aiFileLinks.length} AI prerequisite rules from /prerequisites.json`);
        }
        if (eepFileLinks && Array.isArray(eepFileLinks) && eepFileLinks.length > 0) {
          setEepPrereqLinks(eepFileLinks);
          console.log(`Loaded ${eepFileLinks.length} EEP prerequisite rules from /prerequisites_eep.json`);
        }
      } catch (err) {
        console.warn('Could not load initial prerequisite files:', err);
      }
    }
    loadInitialPrerequisites();
  }, []);

  // Prerequisite link handlers (program aware)
  const handleSavePrerequisites = async (newLinks, progId = activeProgram) => {
    const norm = normalizeProgramId(progId);
    const result = await savePrerequisiteLinks(newLinks, norm);
    if (norm === 'EEP') {
      setEepPrereqLinks(newLinks);
    } else {
      setAiPrereqLinks(newLinks);
    }
    if (result?.localFile) {
      setStatusMessage(`${norm} prerequisite links saved to local file & browser (${newLinks.length} connections).`);
    } else {
      setStatusMessage(`${norm} prerequisite links saved (${newLinks.length} connections).`);
    }
    return result;
  };

  const handleMakeDefaultPrerequisites = async (linksToSetDefault, progId = activeProgram) => {
    const norm = normalizeProgramId(progId);
    const result = await makeDefaultPrerequisiteLinks(linksToSetDefault, norm);
    if (norm === 'EEP') {
      setEepPrereqLinks(linksToSetDefault);
    } else {
      setAiPrereqLinks(linksToSetDefault);
    }
    setStatusMessage(`Saved ${norm} prerequisite links (${linksToSetDefault.length} connections) as permanent default!`);
    return result;
  };

  const handleResetPrerequisites = async (progId = activeProgram) => {
    const norm = normalizeProgramId(progId);
    const defaults = await resetPrerequisiteLinks(norm);
    if (norm === 'EEP') {
      setEepPrereqLinks(defaults);
    } else {
      setAiPrereqLinks(defaults);
    }
    setStatusMessage(`${norm} prerequisite links reset to default curriculum (${defaults.length} connections).`);
    return defaults;
  };

  const handleOpenPrereqModal = (courseCode = null) => {
    setInitialPrereqModalCourse(courseCode);
    setIsPrereqModalOpen(true);
  };

  // Set initial theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load both default templates on start
  useEffect(() => {
    async function loadDefaultTemplates() {
      try {
        const [resAi, resEep] = await Promise.all([
          fetch(`/template.xlsx?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/EPP Template.xlsx?t=${Date.now()}`, { cache: 'no-store' })
        ]);
        if (resAi.ok) {
          const buf = await resAi.arrayBuffer();
          setAiTemplateBuffer(buf);
          console.log('Loaded default AI template from /template.xlsx');
        }
        if (resEep.ok) {
          const buf = await resEep.arrayBuffer();
          setEepTemplateBuffer(buf);
          console.log('Loaded default EEP template from /EPP Template.xlsx');
        }
      } catch (err) {
        console.warn('Could not load default templates:', err);
      }
    }
    loadDefaultTemplates();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handlePdfsLoaded = async (files, targetProg = activeProgram) => {
    setIsLoading(true);
    const progLabel = normalizeProgramId(targetProg) === 'EEP' ? 'EEP' : 'AI';
    setStatusMessage(`Processing ${files.length} PDF transcript file(s) for ${progLabel} track...`);
    try {
      const newStudents = [];
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const parsed = await parseTranscriptPdf(buffer, file.name, targetProg);

        let finalName = parsed.studentName;
        const normId = normalizeStudentId(parsed.studentId);
        if (normId && rosterMap.has(normId)) {
          finalName = rosterMap.get(normId);
        }

        newStudents.push({
          ...parsed,
          program: parsed.program || targetProg,
          studentName: finalName,
          selectedCourseCodes: []
        });
      }

      setStudents(prev => {
        // Append or replace
        const combined = [...prev];
        for (const s of newStudents) {
          const existingIdx = combined.findIndex(x => x.studentId && x.studentId === s.studentId);
          if (existingIdx >= 0) {
            combined[existingIdx] = {
              ...s,
              selectedCourseCodes: combined[existingIdx].selectedCourseCodes || []
            };
          } else {
            combined.push(s);
          }
        }
        return combined;
      });

      setStatusMessage(`Successfully processed ${files.length} transcript(s) for ${progLabel} track.`);
    } catch (err) {
      console.error('Failed to parse PDFs:', err);
      setStatusMessage(`Error processing PDFs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateLoaded = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      setCustomTemplateBuffer(buffer);
      setCustomTemplateName(file.name);
      setStatusMessage(`Custom template loaded: ${file.name}`);
    } catch (err) {
      console.error('Failed to load custom template:', err);
      setStatusMessage(`Error loading template: ${err.message}`);
    }
  };

  // Handler for loading an exported degree sheet (.xlsx) with registered subjects
  const handleExportedDegreeWorkbookLoaded = async (fileOrBuffer, fileName = 'Degree_Sheets.xlsx', targetProg = activeProgram) => {
    setIsLoading(true);
    setStatusMessage(`Restoring students & registered subjects from ${fileName}...`);
    try {
      const buffer = fileOrBuffer instanceof ArrayBuffer
        ? fileOrBuffer
        : (fileOrBuffer.arrayBuffer ? await fileOrBuffer.arrayBuffer() : fileOrBuffer);

      const parsedStudents = await parseExportedDegreeWorkbook(buffer, targetProg);

      if (!parsedStudents || parsedStudents.length === 0) {
        throw new Error('No student degree sheets or courses detected in this Excel file.');
      }

      // Check against rosterMap if available to update full names / IDs
      const mappedStudents = parsedStudents.map(s => {
        let finalName = s.studentName;
        const normId = normalizeStudentId(s.studentId);
        if (normId && rosterMap.has(normId)) {
          finalName = rosterMap.get(normId);
        }
        return {
          ...s,
          studentName: finalName
        };
      });

      setStudents(mappedStudents);
      setActiveStudentIndex(0);
      const totalRegistered = mappedStudents.reduce((acc, s) => acc + (s.selectedCourseCodes?.length || 0), 0);
      setStatusMessage(`Loaded ${mappedStudents.length} student(s) from "${fileName}" with ${totalRegistered} registered course selections restored!`);
    } catch (err) {
      console.error('Failed to parse exported degree workbook:', err);
      alert(`Could not load degree sheet: ${err.message}`);
      setStatusMessage(`Error loading degree sheet: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick helper to load the 53 students single-sheet workbook directly from public folder
  const handleLoadSampleDegreeSheet = async () => {
    setIsLoading(true);
    setStatusMessage('Loading Degree_Sheets_All_53_Students_Single_Sheet.xlsx with registered subjects...');
    try {
      const res = await fetch(`/Degree_Sheets_All_53_Students_Single_Sheet.xlsx?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Could not fetch Degree_Sheets_All_53_Students_Single_Sheet.xlsx from public folder.');
      }
      const buffer = await res.arrayBuffer();
      await handleExportedDegreeWorkbookLoaded(buffer, 'Degree_Sheets_All_53_Students_Single_Sheet.xlsx');
    } catch (err) {
      console.error('Failed to load Degree_Sheets_All_53_Students_Single_Sheet.xlsx:', err);
      alert(`Failed to load file: ${err.message}`);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to export entire project backup as a .degree.json file
  const handleSaveProjectBackup = () => {
    if (!students || students.length === 0) {
      alert('No students loaded to backup.');
      return;
    }
    try {
      const activeStudentProg = normalizeProgramId(activeStudent?.program || activeProgram);
      const activePrereq = activeStudentProg === 'EEP' ? eepPrereqLinks : aiPrereqLinks;
      const currentTmplName = customTemplateName || (activeStudentProg === 'EEP' ? 'EPP Template.xlsx' : 'template.xlsx');
      const filename = exportProjectBackup({
        students,
        prerequisiteLinks: activePrereq,
        aiPrereqLinks,
        eepPrereqLinks,
        activeProgram,
        rosterInfo,
        rosterMap,
        templateName: currentTmplName
      });
      setStatusMessage(`Project backup downloaded successfully: ${filename}`);
    } catch (err) {
      console.error('Failed to export project backup:', err);
      alert(`Could not export backup: ${err.message}`);
    }
  };

  // Handler to restore full project state from .degree.json file
  const handleBackupLoaded = async (file) => {
    setIsLoading(true);
    setStatusMessage(`Restoring project from backup: ${file.name}...`);
    try {
      const restored = await parseProjectBackup(file);
      if (restored.students && restored.students.length > 0) {
        setStudents(restored.students);
        setActiveStudentIndex(0);
        if (restored.students[0]?.program) {
          setActiveProgram(normalizeProgramId(restored.students[0].program));
        }
      }
      if (restored.aiPrereqLinks && Array.isArray(restored.aiPrereqLinks)) {
        setAiPrereqLinks(restored.aiPrereqLinks);
      }
      if (restored.eepPrereqLinks && Array.isArray(restored.eepPrereqLinks)) {
        setEepPrereqLinks(restored.eepPrereqLinks);
      }
      if (restored.prerequisiteLinks && Array.isArray(restored.prerequisiteLinks)) {
        if (restored.activeProgram === 'EEP') {
          setEepPrereqLinks(restored.prerequisiteLinks);
        } else {
          setAiPrereqLinks(restored.prerequisiteLinks);
        }
      }
      if (restored.templateName) {
        setCustomTemplateName(restored.templateName);
      }
      if (restored.rosterInfo) {
        setRosterInfo(restored.rosterInfo);
      }
      if (restored.rosterMap instanceof Map) {
        setRosterMap(restored.rosterMap);
      }
      const totalReg = (restored.students || []).reduce((acc, s) => acc + (s.selectedCourseCodes?.length || 0), 0);
      setStatusMessage(`Successfully restored project from "${file.name}"! Loaded ${restored.students.length} student(s) with ${totalReg} course selections.`);
    } catch (err) {
      console.error('Failed to restore project backup:', err);
      alert(`Could not restore project backup: ${err.message}`);
      setStatusMessage(`Error restoring backup: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new student manually (with Name, ID, optional level, CGPA, and crossed subjects)
  const handleAddStudent = (manualData) => {
    const {
      studentName,
      studentId,
      aiLevel = 1,
      cgpa = 3.0,
      admissionYear = '2024',
      program = activeProgram,
      crossedCourseCodes = []
    } = manualData;

    const studentProg = normalizeProgramId(program || activeProgram);
    const progCourses = getAllCourses(studentProg);

    let finalName = studentName;
    const normId = normalizeStudentId(studentId);
    if (normId && rosterMap.has(normId)) {
      finalName = rosterMap.get(normId);
    }

    const courseMap = {};
    const crossedSet = new Set(crossedCourseCodes.map(normalizeCode));

    progCourses.forEach(course => {
      const norm = normalizeCode(course.code);
      const isCrossed = crossedSet.has(norm) || (course.aliases && course.aliases.some(a => crossedSet.has(normalizeCode(a))));
      if (isCrossed) {
        courseMap[norm] = {
          code: course.code,
          normCode: norm,
          name: course.name,
          credit: course.ch || 3,
          points: 3.0,
          grade: 'P',
          isPassed: true
        };
      }
    });

    const passedCount = Object.keys(courseMap).length;
    const achievedHours = progCourses
      .filter(c => courseMap[normalizeCode(c.code)]?.isPassed)
      .reduce((sum, c) => sum + (c.ch || 3), 0);

    const newStudent = {
      studentName: finalName,
      studentId: studentId,
      cgpa: cgpa !== null && cgpa !== undefined && !isNaN(cgpa) ? parseFloat(cgpa) : 3.0,
      admissionYear: admissionYear || '2024',
      registeredHours: 0,
      achievedHours: achievedHours || (passedCount * 3),
      program: studentProg,
      rawCourses: [],
      courseMap,
      passedCount,
      failedCount: 0,
      totalAttempted: passedCount,
      allSemesterTables: [],
      tableCount: aiLevel,
      aiLevel,
      regularSemesters: [],
      summerSemesters: [],
      levelGpas: [],
      latestSemesterGpa: null,
      selectedCourseCodes: [],
      unlockGpaLimit: false
    };

    setStudents(prev => {
      const combined = [...prev];
      const existingIdx = combined.findIndex(s => s.studentId && normalizeStudentId(s.studentId) === normId);
      if (existingIdx >= 0) {
        const existing = combined[existingIdx];
        const mergedCourseMap = { ...existing.courseMap, ...courseMap };
        const updatedPassed = Object.values(mergedCourseMap).filter(c => c.isPassed && (c.points === undefined || c.points > 0)).length;
        const updatedAchieved = Object.values(mergedCourseMap).filter(c => c.isPassed && (c.points === undefined || c.points > 0)).reduce((sum, c) => sum + (c.credit || 3), 0);
        combined[existingIdx] = {
          ...existing,
          ...newStudent,
          courseMap: mergedCourseMap,
          passedCount: updatedPassed,
          achievedHours: updatedAchieved,
          selectedCourseCodes: existing.selectedCourseCodes || [],
          unlockGpaLimit: existing.unlockGpaLimit || false
        };
        setActiveStudentIndex(existingIdx);
      } else {
        combined.push(newStudent);
        setActiveStudentIndex(combined.length - 1);
      }
      return combined;
    });

    setStatusMessage(`Successfully added ${studentProg} student "${finalName}" (${studentId}) with ${passedCount} passed/crossed course(s).`);
  };

  // Toggle crossed / passed status for a single course on the active student
  const handleToggleCourseCrossed = (courseCode) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const progCourses = getAllCourses(studentProg);
    const norm = normalizeCode(courseCode);
    const courseMeta = progCourses.find(c => normalizeCode(c.code) === norm);
    const currentRecord = activeStudent.courseMap[norm];
    const isCurrentlyPassed = currentRecord && currentRecord.isPassed && (currentRecord.points === undefined || currentRecord.points > 0);

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;

        const updatedCourseMap = { ...s.courseMap };
        if (isCurrentlyPassed) {
          delete updatedCourseMap[norm];
        } else {
          updatedCourseMap[norm] = {
            code: courseMeta ? courseMeta.code : courseCode,
            normCode: norm,
            name: courseMeta ? courseMeta.name : courseCode,
            credit: courseMeta ? (courseMeta.ch || 3) : 3,
            points: 3.0,
            grade: 'P',
            isPassed: true
          };
        }

        const passedCourses = Object.values(updatedCourseMap).filter(c => c.isPassed && (c.points === undefined || c.points > 0));
        const passedCount = passedCourses.length;
        const achievedHours = passedCourses.reduce((sum, c) => sum + (c.credit || 3), 0);

        // If newly crossed course was in selectedCourseCodes (checkpointed), unselect it
        const selectedCourseCodes = (s.selectedCourseCodes || []).filter(c => normalizeCode(c) !== norm);

        return {
          ...s,
          courseMap: updatedCourseMap,
          passedCount,
          achievedHours,
          selectedCourseCodes
        };
      });
    });

    setStatusMessage(`${isCurrentlyPassed ? 'Uncrossed' : 'Crossed'} ${courseCode}.`);
  };

  // Bulk cross or uncross courses for the active student
  const handleBulkCrossCourses = (courseCodes, shouldCross = true) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent || !courseCodes || courseCodes.length === 0) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const progCourses = getAllCourses(studentProg);

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;

        const updatedCourseMap = { ...s.courseMap };
        const crossedNorms = new Set();

        courseCodes.forEach(code => {
          const norm = normalizeCode(code);
          crossedNorms.add(norm);
          const courseMeta = progCourses.find(c => normalizeCode(c.code) === norm);

          if (shouldCross) {
            updatedCourseMap[norm] = {
              code: courseMeta ? courseMeta.code : code,
              normCode: norm,
              name: courseMeta ? courseMeta.name : code,
              credit: courseMeta ? (courseMeta.ch || 3) : 3,
              points: 3.0,
              grade: 'P',
              isPassed: true
            };
          } else {
            delete updatedCourseMap[norm];
          }
        });

        const passedCourses = Object.values(updatedCourseMap).filter(c => c.isPassed && (c.points === undefined || c.points > 0));
        const passedCount = passedCourses.length;
        const achievedHours = passedCourses.reduce((sum, c) => sum + (c.credit || 3), 0);

        let selectedCourseCodes = s.selectedCourseCodes || [];
        if (shouldCross) {
          selectedCourseCodes = selectedCourseCodes.filter(c => !crossedNorms.has(normalizeCode(c)));
        }

        return {
          ...s,
          courseMap: updatedCourseMap,
          passedCount,
          achievedHours,
          selectedCourseCodes
        };
      });
    });

    setStatusMessage(`${shouldCross ? 'Crossed' : 'Uncrossed'} ${courseCodes.length} subject(s).`);
  };

  // Delete student
  const handleDeleteStudent = (indexToDelete) => {
    if (students.length === 0 || indexToDelete < 0 || indexToDelete >= students.length) return;
    const name = students[indexToDelete]?.studentName || `Student ${indexToDelete + 1}`;
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) return;

    setStudents(prev => prev.filter((_, idx) => idx !== indexToDelete));
    setActiveStudentIndex(prev => {
      if (prev >= indexToDelete) {
        return Math.max(0, prev - 1);
      }
      return prev;
    });
    setStatusMessage(`Removed student "${name}".`);
  };

  // Toggle selection for a single course for the active student (blocks if prerequisites not passed, GPA limit exceeded, or season mismatch)
  const handleToggleCourseSelection = (courseCode) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const activePrereqLinks = studentProg === 'EEP' ? eepPrereqLinks : aiPrereqLinks;

    const current = activeStudent.selectedCourseCodes || [];
    const norm = normalizeCode(courseCode);
    const exists = current.some(c => normalizeCode(c) === norm);

    if (!exists) {
      // 1. Season constraint: Check if course is eligible for student's active registration season (Fall / Spring)
      const activeSeason = getStudentRegistrationSeason(activeStudent);
      const isEligibleSeason = isCourseEligibleForSeason(courseCode, activeSeason, studentProg);
      if (!isEligibleSeason) {
        const courseSeason = getCourseSeason(courseCode, studentProg);
        setStatusMessage(`Cannot check ${courseCode}: It is a ${courseSeason} subject, but current registration season is ${activeSeason}. Only ${activeSeason} subjects can be selected.`);
        return;
      }

      // 2. Check GPA Course Registration Limits
      const regLimit = getRegistrationLimit(activeStudent);
      if (current.length >= regLimit.maxCourses) {
        setStatusMessage(`Cannot check ${courseCode}: Maximum limit reached (${regLimit.maxCourses} subjects). ${regLimit.ruleText}.`);
        return;
      }

      // 3. Verify prerequisites
      const prereqCheck = checkPrerequisitesMet(courseCode, activeStudent.courseMap, activePrereqLinks, studentProg);
      if (!prereqCheck.canTake) {
        setStatusMessage(`Cannot check ${courseCode}: You have not passed its prerequisite(s) (${prereqCheck.missingPrereqs.join(', ')}).`);
        return;
      }
    }

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const updated = exists
          ? current.filter(c => normalizeCode(c) !== norm)
          : [...current, courseCode];
        return { ...s, selectedCourseCodes: updated };
      });
    });
  };

  // Select all failed courses (0.00 points) for active student matching active season up to allowed GPA limit
  const handleSelectAllFailed = () => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const progCourses = getAllCourses(studentProg);
    const activePrereqLinks = studentProg === 'EEP' ? eepPrereqLinks : aiPrereqLinks;

    const activeSeason = getStudentRegistrationSeason(activeStudent);
    const regLimit = getRegistrationLimit(activeStudent);
    let eligibleCount = 0;
    let blockedPrereqCount = 0;
    let blockedLimitCount = 0;
    let blockedSeasonCount = 0;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const current = s.selectedCourseCodes || [];
        const combined = [...current];

        for (const course of progCourses) {
          const norm = normalizeCode(course.code);
          if (combined.some(c => normalizeCode(c) === norm)) continue;

          let record = s.courseMap[norm];
          if (!record && course.aliases) {
            for (const alias of course.aliases) {
              if (s.courseMap[normalizeCode(alias)]) {
                record = s.courseMap[normalizeCode(alias)];
                break;
              }
            }
          }
          if (record && record.points === 0.00) {
            // Season filter (allows Level 0 BSC 041, PRD 031, PRD 041, CCE 031 in either season)
            if (!isCourseEligibleForSeason(course.code, activeSeason, studentProg)) {
              blockedSeasonCount++;
              continue;
            }

            // Check GPA Limit
            if (combined.length >= regLimit.maxCourses) {
              blockedLimitCount++;
              continue;
            }

            // Check prerequisites
            const prereqCheck = checkPrerequisitesMet(course.code, s.courseMap, activePrereqLinks, studentProg);
            if (prereqCheck.canTake) {
              combined.push(course.code);
              eligibleCount++;
            } else {
              blockedPrereqCount++;
            }
          }
        }

        return { ...s, selectedCourseCodes: combined };
      });
    });

    let msg = `Selected ${eligibleCount} failed ${activeSeason} course(s) (Limit: ${regLimit.maxCourses} subjects${regLimit.isOverridden ? ' - GPA Paused' : ''}).`;
    if (blockedSeasonCount > 0) {
      msg += ` ${blockedSeasonCount} skipped (not ${activeSeason}).`;
    }
    if (blockedLimitCount > 0) {
      msg += ` ${blockedLimitCount} skipped due to GPA limit (${regLimit.maxCourses}).`;
    }
    if (blockedPrereqCount > 0) {
      msg += ` ${blockedPrereqCount} skipped because prerequisites were not passed.`;
    }
    setStatusMessage(msg);
  };

  // Select all pending / not taken courses for active student matching active season up to allowed GPA limit
  const handleSelectAllPending = () => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const progCourses = getAllCourses(studentProg);
    const activePrereqLinks = studentProg === 'EEP' ? eepPrereqLinks : aiPrereqLinks;

    const activeSeason = getStudentRegistrationSeason(activeStudent);
    const regLimit = getRegistrationLimit(activeStudent);
    let eligibleCount = 0;
    let blockedPrereqCount = 0;
    let blockedLimitCount = 0;
    let blockedSeasonCount = 0;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const current = s.selectedCourseCodes || [];
        const combined = [...current];

        for (const course of progCourses) {
          const norm = normalizeCode(course.code);
          if (combined.some(c => normalizeCode(c) === norm)) continue;

          let record = s.courseMap[norm];
          if (!record && course.aliases) {
            for (const alias of course.aliases) {
              if (s.courseMap[normalizeCode(alias)]) {
                record = s.courseMap[normalizeCode(alias)];
                break;
              }
            }
          }
          if (!record) {
            // Season filter (allows Level 0 BSC 041, PRD 031, PRD 041, CCE 031 in either season)
            if (!isCourseEligibleForSeason(course.code, activeSeason, studentProg)) {
              blockedSeasonCount++;
              continue;
            }

            // Check GPA Limit
            if (combined.length >= regLimit.maxCourses) {
              blockedLimitCount++;
              continue;
            }

            // Check prerequisites
            const prereqCheck = checkPrerequisitesMet(course.code, s.courseMap, activePrereqLinks, studentProg);
            if (prereqCheck.canTake) {
              combined.push(course.code);
              eligibleCount++;
            } else {
              blockedPrereqCount++;
            }
          }
        }

        return { ...s, selectedCourseCodes: combined };
      });
    });

    let msg = `Selected ${eligibleCount} pending ${activeSeason} course(s) (Limit: ${regLimit.maxCourses} subjects${regLimit.isOverridden ? ' - GPA Paused' : ''}).`;
    if (blockedSeasonCount > 0) {
      msg += ` ${blockedSeasonCount} skipped (not ${activeSeason}).`;
    }
    if (blockedLimitCount > 0) {
      msg += ` ${blockedLimitCount} skipped due to GPA limit (${regLimit.maxCourses}).`;
    }
    if (blockedPrereqCount > 0) {
      msg += ` ${blockedPrereqCount} skipped because prerequisites were not passed.`;
    }
    setStatusMessage(msg);
  };

  // Clear selections for active student
  const handleClearSelected = () => {
    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        return { ...s, selectedCourseCodes: [] };
      });
    });
    setStatusMessage('Cleared course checkpoint selections.');
  };

  // Select all eligible courses in a semester for the active student
  const handleSelectSemesterCourses = (courses) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent || !courses || courses.length === 0) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const activePrereqLinks = studentProg === 'EEP' ? eepPrereqLinks : aiPrereqLinks;

    const activeSeason = getStudentRegistrationSeason(activeStudent);
    const regLimit = getRegistrationLimit(activeStudent);
    let newlySelectedCount = 0;
    let blockedPrereqCount = 0;
    let blockedLimitCount = 0;
    let blockedSeasonCount = 0;
    let alreadyPassedCount = 0;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const current = s.selectedCourseCodes || [];
        const combined = [...current];

        for (const course of courses) {
          const norm = normalizeCode(course.code);
          if (combined.some(c => normalizeCode(c) === norm)) continue;

          // Check if course matches active season (or is all-season interchangeable)
          if (!isCourseEligibleForSeason(course.code, activeSeason, studentProg)) {
            blockedSeasonCount++;
            continue;
          }

          // Check if already passed with points > 0
          let record = s.courseMap[norm];
          if (!record && course.aliases) {
            for (const alias of course.aliases) {
              if (s.courseMap[normalizeCode(alias)]) {
                record = s.courseMap[normalizeCode(alias)];
                break;
              }
            }
          }

          if (record && record.isPassed && record.points > 0.00) {
            alreadyPassedCount++;
            continue;
          }

          // Check registration limit
          if (combined.length >= regLimit.maxCourses) {
            blockedLimitCount++;
            continue;
          }

          // Check prerequisites
          const prereqCheck = checkPrerequisitesMet(course.code, s.courseMap, activePrereqLinks, studentProg);
          if (prereqCheck.canTake) {
            combined.push(course.code);
            newlySelectedCount++;
          } else {
            blockedPrereqCount++;
          }
        }

        return { ...s, selectedCourseCodes: combined };
      });
    });

    if (blockedSeasonCount > 0 && newlySelectedCount === 0) {
      setStatusMessage(`Cannot select semester: These are not ${activeSeason} subjects. Only ${activeSeason} courses can be registered.`);
      return;
    }

    let msg = `Selected ${newlySelectedCount} course(s) in semester.`;
    if (blockedLimitCount > 0) {
      msg += ` (${blockedLimitCount} skipped due to GPA limit of ${regLimit.maxCourses} courses).`;
    }
    if (blockedPrereqCount > 0) {
      msg += ` (${blockedPrereqCount} skipped: prerequisites not met).`;
    }
    setStatusMessage(msg);
  };

  // Deselect / uncheck all courses of a semester
  const handleDeselectSemesterCourses = (courses) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent || !courses || courses.length === 0) return;

    const semesterNormCodes = new Set();
    courses.forEach(c => {
      semesterNormCodes.add(normalizeCode(c.code));
      if (c.aliases) {
        c.aliases.forEach(a => semesterNormCodes.add(normalizeCode(a)));
      }
    });

    let removedCount = 0;
    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const current = s.selectedCourseCodes || [];
        const filtered = current.filter(c => {
          const norm = normalizeCode(c);
          if (semesterNormCodes.has(norm)) {
            removedCount++;
            return false;
          }
          return true;
        });
        return { ...s, selectedCourseCodes: filtered };
      });
    });

    setStatusMessage(`Deselected ${removedCount} course(s) in semester.`);
  };

  // Update or set semester GPA for active student
  const handleUpdateSemesterGpa = (level, semester, newGpa) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const studentProg = normalizeProgramId(activeStudent.program || activeProgram);
    const isEpp = studentProg === 'EEP';
    const semGpaCellList = isEpp ? [
      { level: 0, semester: 1, gpaCell: 'Y10', chCell: 'Z10' },
      { level: 0, semester: 2, gpaCell: 'Y20', chCell: 'Z20' },
      { level: 1, semester: 1, gpaCell: 'Y30', chCell: 'Z30' },
      { level: 1, semester: 2, gpaCell: 'Y40', chCell: 'Z40' },
      { level: 2, semester: 1, gpaCell: 'Y50', chCell: 'Z50' },
      { level: 2, semester: 2, gpaCell: 'Y60', chCell: 'Z60' },
      { level: 3, semester: 1, gpaCell: 'Y70', chCell: 'Z70' },
      { level: 3, semester: 2, gpaCell: 'Y80', chCell: 'Z80' },
      { level: 4, semester: 1, gpaCell: 'Y90', chCell: 'Z90' },
      { level: 4, semester: 2, gpaCell: 'Y100', chCell: 'Z100' },
    ] : [
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

    const slot = semGpaCellList.find(s => s.level === level && s.semester === semester);
    const targetCell = slot ? slot.gpaCell : null;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;

        const currentGpas = [...(s.levelGpas || [])];
        const existingIdx = currentGpas.findIndex(lg => lg.level === level && lg.semester === semester);

        if (newGpa === null || newGpa === undefined || newGpa === '' || isNaN(newGpa)) {
          if (existingIdx >= 0) {
            currentGpas.splice(existingIdx, 1);
          }
        } else {
          const parsed = parseFloat(newGpa);
          const gpaRecord = {
            level,
            semester,
            gpa: parsed,
            gpaCell: targetCell
          };
          if (existingIdx >= 0) {
            currentGpas[existingIdx] = { ...currentGpas[existingIdx], ...gpaRecord };
          } else {
            currentGpas.push(gpaRecord);
          }
        }

        currentGpas.sort((a, b) => (a.level - b.level) || (a.semester - b.semester));
        const latestSemGpa = currentGpas.length > 0 ? currentGpas[currentGpas.length - 1].gpa : s.latestSemesterGpa;

        return {
          ...s,
          levelGpas: currentGpas,
          latestSemesterGpa: latestSemGpa
        };
      });
    });

    const semLabel = semester === 1 ? 'Fall' : 'Spring';
    setStatusMessage(`Updated Level ${level} ${semLabel} GPA (${targetCell}) to ${newGpa !== '' && newGpa !== null && !isNaN(newGpa) ? parseFloat(newGpa).toFixed(2) : 'Cleared'}.`);
  };

  // Toggle pausing GPA-based course selection limit and unlocking 6 subjects for a student
  const handleToggleUnlockGpaLimit = (targetIndex = activeStudentIndex) => {
    const targetStudent = students[targetIndex];
    if (!targetStudent) return;

    const willBeUnlocked = !targetStudent.unlockGpaLimit;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== targetIndex) return s;
        return { ...s, unlockGpaLimit: willBeUnlocked };
      });
    });

    const regLimit = getRegistrationLimit(targetStudent);
    const normalLimit = regLimit.naturalLimit || (regLimit.tier === 'strict_warning' ? 4 : regLimit.tier === 'academic_warning' ? 5 : 6);
    if (willBeUnlocked) {
      setStatusMessage(`Paused GPA limit for ${targetStudent.studentName || 'student'}. 6 subjects unlocked for registration!`);
    } else {
      setStatusMessage(`Resumed GPA-based registration limit (${normalLimit} subjects) for ${targetStudent.studentName || 'student'}.`);
    }
  };

  const handleExport = async (options, mode = 'multi') => {
    const activeStudentProg = normalizeProgramId(activeStudent?.program || activeProgram);
    const hasEep = students.some(s => normalizeProgramId(s.program) === 'EEP');
    const targetProg = (students.length > 0 && hasEep && !students.some(s => normalizeProgramId(s.program) === 'AI'))
      ? 'EEP'
      : activeStudentProg;
    const templateBufferToUse = customTemplateBuffer || (targetProg === 'EEP' ? eepTemplateBuffer : aiTemplateBuffer);

    if (!templateBufferToUse || students.length === 0) {
      alert('Please upload transcripts and ensure the Excel template is loaded.');
      return;
    }

    setIsExporting(true);
    const getSafeSingleStudentName = () => {
      const raw = cleanArabicText(students[0]?.studentName || students[0]?.studentId || 'Student');
      return raw.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
    };

    try {
      let outputBuffer;
      let fileName;
      const progTag = targetProg === 'EEP' ? 'EEP_' : '';

      if (mode === 'single') {
        outputBuffer = await generateSingleSheetCombinedWorkbook(templateBufferToUse, students, options);
        fileName = students.length === 1
          ? `${getSafeSingleStudentName()}_${progTag}Single_Sheet.xlsx`
          : `Degree_Sheets_All_${students.length}_Students_${progTag}Single_Sheet.xlsx`;
      } else {
        outputBuffer = await generatePreservedExcelWorkbook(templateBufferToUse, students, options);
        fileName = students.length === 1
          ? `${getSafeSingleStudentName()}_${progTag}Crossed_Degree.xlsx`
          : `Degree_Sheets_All_${students.length}_Students_${progTag}Multi_Tab.xlsx`;
      }
      
      // Download in browser using Blob
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage(`Successfully generated and downloaded ${fileName}`);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export official Registration Form (reg.xlsx template)
  const handleExportRegistration = async (mode = 'single') => {
    if (students.length === 0) {
      alert('Please upload transcript PDFs first.');
      return;
    }

    setIsExporting(true);
    setStatusMessage(`Generating Registration Form Excel (${mode === 'single' ? 'Single Continuous Sheet' : 'Multi-Tab'})...`);
    try {
      // Fetch public/reg.xlsx
      const res = await fetch(`/reg.xlsx?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Could not load /reg.xlsx template file. Please verify public/reg.xlsx exists.');
      }
      const regTemplateBuffer = await res.arrayBuffer();

      let outputBuffer;
      let fileName;

      const getSafeSingleStudentName = () => {
        const raw = cleanArabicText(students[0]?.studentName || students[0]?.studentId || 'Student');
        return raw.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
      };

      const combinedPrereqLinks = [...aiPrereqLinks, ...eepPrereqLinks];

      if (mode === 'single') {
        outputBuffer = await generateSingleSheetRegistrationWorkbook(regTemplateBuffer, students, {
          prerequisiteLinks: combinedPrereqLinks
        });
        fileName = students.length === 1
          ? `${getSafeSingleStudentName()}_Registration_Form_Single_Sheet.xlsx`
          : `Registration_Forms_All_${students.length}_Students_Single_Sheet.xlsx`;
      } else {
        outputBuffer = await generateRegistrationWorkbook(regTemplateBuffer, students, {
          prerequisiteLinks: combinedPrereqLinks
        });
        fileName = students.length === 1
          ? `${getSafeSingleStudentName()}_Registration_Form.xlsx`
          : `Registration_Forms_All_${students.length}_Students_Multi_Tab.xlsx`;
      }

      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`Successfully generated and downloaded registration form: ${fileName}`);
    } catch (err) {
      console.error('Registration form export failed:', err);
      alert(`Registration export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Combined Degree Tree & Registration Form on the SAME sheet for each student with page break
  const handleExportCombinedTreeAndReg = async (options = {}) => {
    const activeStudentProg = normalizeProgramId(activeStudent?.program || activeProgram);
    const hasEep = students.some(s => normalizeProgramId(s.program) === 'EEP');
    const targetProg = (students.length > 0 && hasEep && !students.some(s => normalizeProgramId(s.program) === 'AI'))
      ? 'EEP'
      : activeStudentProg;
    const templateBufferToUse = customTemplateBuffer || (targetProg === 'EEP' ? eepTemplateBuffer : aiTemplateBuffer);

    if (!templateBufferToUse || students.length === 0) {
      alert('Please upload transcript PDFs and ensure the Excel template is loaded.');
      return;
    }

    setIsExporting(true);
    setStatusMessage('Generating Combined Degree Tree & Registration sheets with page breaks...');
    try {
      // Fetch public/reg.xlsx
      const res = await fetch(`/reg.xlsx?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Could not load /reg.xlsx template file. Please verify public/reg.xlsx exists.');
      }
      const regTemplateBuffer = await res.arrayBuffer();

      const combinedPrereqLinks = [...aiPrereqLinks, ...eepPrereqLinks];

      const outputBuffer = await generateCombinedTreeAndRegistrationWorkbook(
        templateBufferToUse,
        regTemplateBuffer,
        students,
        {
          ...options,
          prerequisiteLinks: combinedPrereqLinks
        }
      );

      const getSafeSingleStudentName = () => {
        const raw = cleanArabicText(students[0]?.studentName || students[0]?.studentId || 'Student');
        return raw.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
      };

      const progTag = targetProg === 'EEP' ? 'EEP_' : '';
      const fileName = students.length === 1
        ? `${getSafeSingleStudentName()}_${progTag}Tree_And_Registration.xlsx`
        : `Degree_Tree_And_Registration_All_${students.length}_Students_${progTag}.xlsx`;

      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`Successfully generated and downloaded combined workbook: ${fileName}`);
    } catch (err) {
      console.error('Combined export failed:', err);
      alert(`Export failed: ${err.message}`);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const activeStudent = students[activeStudentIndex] || students[0];
  const activeStudentProg = normalizeProgramId(activeStudent?.program || activeProgram);
  const activePrereqLinks = activeStudentProg === 'EEP' ? eepPrereqLinks : aiPrereqLinks;
  const currentTemplateBuffer = customTemplateBuffer || (activeProgram === 'EEP' ? eepTemplateBuffer : aiTemplateBuffer);
  const currentTemplateName = customTemplateName || (activeProgram === 'EEP' ? 'EPP Template.xlsx' : 'template.xlsx');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: activeProgram === 'EEP' ? '#d97706' : '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {activeProgram === 'EEP' ? <Zap size={22} /> : <GraduationCap size={22} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Transcript Degree Crosser
              </span>

              {/* Program Selector Segmented Control */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveProgram('AI')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: activeProgram === 'AI' ? '#2563eb' : 'transparent',
                    color: activeProgram === 'AI' ? '#ffffff' : 'var(--text-muted)'
                  }}
                  title="Switch active program track to Artificial Intelligence (AI)"
                >
                  <Cpu size={14} />
                  <span>AI Track</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProgram('EEP')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: activeProgram === 'EEP' ? '#d97706' : 'transparent',
                    color: activeProgram === 'EEP' ? '#ffffff' : 'var(--text-muted)'
                  }}
                  title="Switch active program track to Energy and Electrical Power (EEP)"
                >
                  <Zap size={14} />
                  <span>EEP Program</span>
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pass &gt; 0.00 = Crossed Out • 0.00 = Active / Uncrossed • {activeProgram === 'EEP' ? 'EEP Curriculum (Level 0–4)' : 'AI Curriculum (Level 0–4)'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddStudentModalOpen(true)}
            title="Add student manually (Name & ID) and cross passed subjects without transcript"
            style={{
              fontSize: '0.85rem',
              padding: '0.5rem 0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: activeProgram === 'EEP' ? '#d97706' : '#2563eb',
              borderColor: activeProgram === 'EEP' ? '#b45309' : '#1d4ed8'
            }}
          >
            <UserPlus size={16} />
            <span>+ Add Student</span>
          </button>

          {students.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveProjectBackup}
              title="Save project backup (.degree.json) with all student selections and settings"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Save size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Save Backup</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleOpenPrereqModal()}
            title="Edit and manage prerequisite links for each subject"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <GitFork size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Edit Prerequisites</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ padding: '0.5rem', borderRadius: '8px' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main App Body - Full width container */}
      <main style={{ flex: 1, width: '100%', maxWidth: '100%', margin: 0, padding: '1.5rem 2rem', boxSizing: 'border-box' }}>
        {/* Upload Section */}
        <UploadZone
          activeProgram={activeProgram}
          onSelectProgram={setActiveProgram}
          onPdfsLoaded={handlePdfsLoaded}
          onTemplateLoaded={handleTemplateLoaded}
          onRosterLoaded={handleRosterLoaded}
          onExportedDegreeLoaded={handleExportedDegreeWorkbookLoaded}
          onBackupLoaded={handleBackupLoaded}
          onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
          hasTemplate={!!currentTemplateBuffer}
          templateName={currentTemplateName}
          rosterInfo={rosterInfo}
          isLoading={isLoading}
        />

        {/* Status Alert if any */}
        {statusMessage && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Student Switcher Tabs (when multiple students loaded) */}
        <StudentTabs
          students={students}
          activeIndex={activeStudentIndex}
          onSelectTab={(idx) => setActiveStudentIndex(idx)}
          onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
        />

        {/* Active Student Header Details */}
        {activeStudent && (
          <>
            <StudentHeader
              student={activeStudent}
              onDeleteStudent={() => handleDeleteStudent(activeStudentIndex)}
              onOpenCrossModal={() => setIsCrossSubjectsModalOpen(true)}
              onToggleUnlockGpaLimit={handleToggleUnlockGpaLimit}
            />

            {/* Export Controls Bar */}
            <ExportControls
              onExport={handleExport}
              onExportRegistration={handleExportRegistration}
              onExportCombined={handleExportCombinedTreeAndReg}
              onSaveProjectBackup={handleSaveProjectBackup}
              studentsCount={students.length}
              isExporting={isExporting}
              selectedCount={activeStudent.selectedCourseCodes?.length || 0}
            />

            {/* Interactive Degree Curriculum Grid */}
            <DegreeGrid
              student={activeStudent}
              prerequisiteLinks={activePrereqLinks}
              onOpenPrereqModal={handleOpenPrereqModal}
              onSavePrerequisites={handleSavePrerequisites}
              onResetPrerequisites={handleResetPrerequisites}
              onToggleCourseSelection={handleToggleCourseSelection}
              onToggleCourseCrossed={handleToggleCourseCrossed}
              onBulkCrossCourses={handleBulkCrossCourses}
              onSelectAllFailed={handleSelectAllFailed}
              onSelectAllPending={handleSelectAllPending}
              onClearSelected={handleClearSelected}
              onSelectSemesterCourses={handleSelectSemesterCourses}
              onDeselectSemesterCourses={handleDeselectSemesterCourses}
              onUpdateSemesterGpa={handleUpdateSemesterGpa}
              onToggleUnlockGpaLimit={handleToggleUnlockGpaLimit}
            />
          </>
        )}

        {!activeStudent && !isLoading && (
          <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--accent-primary)'
            }}>
              <FileText size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Transcripts Uploaded Yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Upload one or more student transcript PDF files using the dropzone above, or click <strong>"+ Add Student"</strong> to create a student profile and cross completed subjects manually.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddStudentModalOpen(true)}
                style={{
                  fontSize: '0.9rem',
                  padding: '0.6rem 1.4rem',
                  background: activeProgram === 'EEP' ? '#d97706' : '#2563eb',
                  borderColor: activeProgram === 'EEP' ? '#b45309' : '#1d4ed8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <UserPlus size={18} />
                <span>+ Add Student Manually</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-secondary)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        East Port Said National University • Faculty of Engineering • AI Track &amp; Energy and Electrical Power (EEP) Degree Advising
      </footer>

      {/* Prerequisite Editor Modal */}
      <PrerequisiteEditorModal
        isOpen={isPrereqModalOpen}
        onClose={() => setIsPrereqModalOpen(false)}
        initialCourseCode={initialPrereqModalCourse}
        prerequisiteLinks={activePrereqLinks}
        onSavePrerequisites={handleSavePrerequisites}
        onMakeDefault={handleMakeDefaultPrerequisites}
        onResetPrerequisites={handleResetPrerequisites}
        activeProgram={activeStudentProg}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddStudent}
        initialProgram={activeProgram}
      />

      {/* Cross Subjects Modal (Direct Access from Student Header) */}
      <CrossSubjectsModal
        isOpen={isCrossSubjectsModalOpen}
        onClose={() => setIsCrossSubjectsModalOpen(false)}
        student={activeStudent}
        onToggleCourseCrossed={handleToggleCourseCrossed}
        onBulkCrossCourses={handleBulkCrossCourses}
      />
    </div>
  );
}
