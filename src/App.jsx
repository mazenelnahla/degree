import React, { useState, useEffect } from 'react';
import { parseTranscriptPdf } from './services/pdfParser.js';
import {
  generatePreservedExcelWorkbook,
  generateSingleSheetCombinedWorkbook,
  generateRegistrationWorkbook,
  generateSingleSheetRegistrationWorkbook
} from './services/excelProcessor.js';
import { parseStudentRosterExcel, normalizeStudentId } from './services/rosterParser.js';
import { normalizeCode, ALL_COURSES, loadPrerequisiteLinks, savePrerequisiteLinks, resetPrerequisiteLinks, fetchFilePrerequisiteLinks, downloadPrerequisitesJson, makeDefaultPrerequisiteLinks, checkPrerequisitesMet, getRegistrationLimit } from './services/courseMapping.js';

import StudentHeader from './components/StudentHeader.jsx';
import DegreeGrid from './components/DegreeGrid.jsx';
import UploadZone from './components/UploadZone.jsx';
import StudentTabs from './components/StudentTabs.jsx';
import ExportControls from './components/ExportControls.jsx';
import PrerequisiteEditorModal from './components/PrerequisiteEditorModal.jsx';
import { GraduationCap, Sun, Moon, Sparkles, RefreshCw, FileText, GitFork } from 'lucide-react';

export default function App() {
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [templateName, setTemplateName] = useState('template.xlsx');
  const [students, setStudents] = useState([]);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [statusMessage, setStatusMessage] = useState('');
  const [rosterMap, setRosterMap] = useState(new Map());
  const [rosterInfo, setRosterInfo] = useState(null);
  
  // Prerequisite links state (persisted in localStorage + public/prerequisites.json local file)
  const [prerequisiteLinks, setPrerequisiteLinks] = useState(() => loadPrerequisiteLinks());
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

  // Load persisted prerequisites from local file on start (syncs across browsers)
  useEffect(() => {
    async function loadInitialPrerequisites() {
      const fileLinks = await fetchFilePrerequisiteLinks();
      if (fileLinks && Array.isArray(fileLinks) && fileLinks.length > 0) {
        setPrerequisiteLinks(fileLinks);
        console.log(`Loaded ${fileLinks.length} prerequisite rules from local file /prerequisites.json`);
      }
    }
    loadInitialPrerequisites();
  }, []);

  // Prerequisite link handlers
  const handleSavePrerequisites = async (newLinks) => {
    const result = await savePrerequisiteLinks(newLinks);
    setPrerequisiteLinks(newLinks);
    if (result?.localFile) {
      setStatusMessage(`Prerequisite links saved to local file & browser (${newLinks.length} connections).`);
    } else {
      setStatusMessage(`Prerequisite links saved (${newLinks.length} connections).`);
    }
  };

  const handleMakeDefaultPrerequisites = async (linksToSetDefault) => {
    const result = await makeDefaultPrerequisiteLinks(linksToSetDefault);
    setPrerequisiteLinks(linksToSetDefault);
    setStatusMessage(`Saved current prerequisite links (${linksToSetDefault.length} connections) as the permanent default!`);
    return result;
  };

  const handleResetPrerequisites = async () => {
    const defaults = await resetPrerequisiteLinks();
    setPrerequisiteLinks(defaults);
    setStatusMessage(`Prerequisite links reset to default curriculum (${defaults.length} connections).`);
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

  // Load default template on start
  useEffect(() => {
    async function loadDefaultTemplate() {
      try {
        // Cache-bust with timestamp and no-store to ensure the latest edited file is loaded
        const res = await fetch(`/template.xlsx?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          setTemplateBuffer(buffer);
          console.log('Loaded default template from /template.xlsx');
        }
      } catch (err) {
        console.warn('Could not load default template from /template.xlsx:', err);
      }
    }
    loadDefaultTemplate();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handlePdfsLoaded = async (files) => {
    setIsLoading(true);
    setStatusMessage(`Processing ${files.length} PDF transcript file(s)...`);
    try {
      const newStudents = [];
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const parsed = await parseTranscriptPdf(buffer, file.name);

        let finalName = parsed.studentName;
        const normId = normalizeStudentId(parsed.studentId);
        if (normId && rosterMap.has(normId)) {
          finalName = rosterMap.get(normId);
        }

        newStudents.push({
          ...parsed,
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

      setStatusMessage(`Successfully processed ${files.length} transcript(s).`);
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
      setTemplateBuffer(buffer);
      setTemplateName(file.name);
      setStatusMessage(`Custom template loaded: ${file.name}`);
    } catch (err) {
      console.error('Failed to load custom template:', err);
      setStatusMessage(`Error loading template: ${err.message}`);
    }
  };

  // Toggle selection for a single course for the active student (blocks if prerequisites not passed or GPA limit exceeded)
  const handleToggleCourseSelection = (courseCode) => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const current = activeStudent.selectedCourseCodes || [];
    const norm = normalizeCode(courseCode);
    const exists = current.some(c => normalizeCode(c) === norm);

    if (!exists) {
      // 1. Check GPA Course Registration Limits
      const regLimit = getRegistrationLimit(activeStudent);
      if (current.length >= regLimit.maxCourses) {
        setStatusMessage(`Cannot check ${courseCode}: Maximum limit reached (${regLimit.maxCourses} subjects). ${regLimit.ruleText}.`);
        return;
      }

      // 2. Verify prerequisites
      const prereqCheck = checkPrerequisitesMet(courseCode, activeStudent.courseMap, prerequisiteLinks);
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

  // Select all failed courses (0.00 points) for active student up to allowed GPA limit
  const handleSelectAllFailed = () => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const regLimit = getRegistrationLimit(activeStudent);
    let eligibleCount = 0;
    let blockedPrereqCount = 0;
    let blockedLimitCount = 0;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const current = s.selectedCourseCodes || [];
        const combined = [...current];

        for (const course of ALL_COURSES) {
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
            // Check GPA Limit
            if (combined.length >= regLimit.maxCourses) {
              blockedLimitCount++;
              continue;
            }

            // Check prerequisites
            const prereqCheck = checkPrerequisitesMet(course.code, s.courseMap, prerequisiteLinks);
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

    let msg = `Selected ${eligibleCount} failed course(s) (Limit: ${regLimit.maxCourses} subjects).`;
    if (blockedLimitCount > 0) {
      msg += ` ${blockedLimitCount} skipped due to GPA subject limit (${regLimit.maxCourses}).`;
    }
    if (blockedPrereqCount > 0) {
      msg += ` ${blockedPrereqCount} skipped because prerequisites were not passed.`;
    }
    setStatusMessage(msg);
  };

  // Select all pending / not taken courses for active student up to allowed GPA limit
  const handleSelectAllPending = () => {
    const activeStudent = students[activeStudentIndex];
    if (!activeStudent) return;

    const regLimit = getRegistrationLimit(activeStudent);
    let eligibleCount = 0;
    let blockedPrereqCount = 0;
    let blockedLimitCount = 0;

    setStudents(prev => {
      return prev.map((s, idx) => {
        if (idx !== activeStudentIndex) return s;
        const current = s.selectedCourseCodes || [];
        const combined = [...current];

        for (const course of ALL_COURSES) {
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
            // Check GPA Limit
            if (combined.length >= regLimit.maxCourses) {
              blockedLimitCount++;
              continue;
            }

            // Check prerequisites
            const prereqCheck = checkPrerequisitesMet(course.code, s.courseMap, prerequisiteLinks);
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

    let msg = `Selected ${eligibleCount} pending course(s) (Limit: ${regLimit.maxCourses} subjects).`;
    if (blockedLimitCount > 0) {
      msg += ` ${blockedLimitCount} skipped due to GPA subject limit (${regLimit.maxCourses}).`;
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

  const handleExport = async (options, mode = 'multi') => {
    if (!templateBuffer || students.length === 0) {
      alert('Please upload transcripts and ensure the Excel template is loaded.');
      return;
    }

    setIsExporting(true);
    try {
      let outputBuffer;
      let fileName;

      if (mode === 'single') {
        outputBuffer = await generateSingleSheetCombinedWorkbook(templateBuffer, students, options);
        fileName = students.length === 1
          ? `${students[0].studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Single_Sheet.xlsx`
          : `Degree_Sheets_All_${students.length}_Students_Single_Sheet.xlsx`;
      } else {
        outputBuffer = await generatePreservedExcelWorkbook(templateBuffer, students, options);
        fileName = students.length === 1
          ? `${students[0].studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Crossed_Degree.xlsx`
          : `Degree_Sheets_All_${students.length}_Students_Multi_Tab.xlsx`;
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

      if (mode === 'single') {
        outputBuffer = await generateSingleSheetRegistrationWorkbook(regTemplateBuffer, students, {
          prerequisiteLinks
        });
        fileName = students.length === 1
          ? `${students[0].studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Registration_Form_Single_Sheet.xlsx`
          : `Registration_Forms_All_${students.length}_Students_Single_Sheet.xlsx`;
      } else {
        outputBuffer = await generateRegistrationWorkbook(regTemplateBuffer, students, {
          prerequisiteLinks
        });
        fileName = students.length === 1
          ? `${students[0].studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Registration_Form.xlsx`
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

  const activeStudent = students[activeStudentIndex] || students[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
          }}>
            <GraduationCap size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Transcript Degree Crosser
              </span>
              <span className="brand-badge">
                AI Curriculum
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pass &gt; 0.00 = Crossed Out • 0.00 = Active / Uncrossed
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleOpenPrereqModal()}
            title="Edit and manage prerequisite links for each subject"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <GitFork size={16} style={{ color: '#818cf8' }} />
            <span>Edit Prerequisites</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ padding: '0.5rem', borderRadius: '10px' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main App Body */}
      <main style={{ flex: 1, maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
        {/* Upload Section */}
        <UploadZone
          onPdfsLoaded={handlePdfsLoaded}
          onTemplateLoaded={handleTemplateLoaded}
          onRosterLoaded={handleRosterLoaded}
          hasTemplate={!!templateBuffer}
          templateName={templateName}
          rosterInfo={rosterInfo}
          isLoading={isLoading}
        />

        {/* Status Alert if any */}
        {statusMessage && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            fontSize: '0.85rem',
            color: '#818cf8',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Student Switcher Tabs (when multiple students loaded) */}
        <StudentTabs
          students={students}
          activeIndex={activeStudentIndex}
          onSelectTab={(idx) => setActiveStudentIndex(idx)}
        />

        {/* Active Student Header Details */}
        {activeStudent && (
          <>
            <StudentHeader student={activeStudent} />

            {/* Export Controls Bar */}
            <ExportControls
              onExport={handleExport}
              onExportRegistration={handleExportRegistration}
              studentsCount={students.length}
              isExporting={isExporting}
              selectedCount={activeStudent.selectedCourseCodes?.length || 0}
            />

            {/* Interactive Degree Curriculum Grid */}
            <DegreeGrid
              student={activeStudent}
              prerequisiteLinks={prerequisiteLinks}
              onOpenPrereqModal={handleOpenPrereqModal}
              onSavePrerequisites={handleSavePrerequisites}
              onResetPrerequisites={handleResetPrerequisites}
              onToggleCourseSelection={handleToggleCourseSelection}
              onSelectAllFailed={handleSelectAllFailed}
              onSelectAllPending={handleSelectAllPending}
              onClearSelected={handleClearSelected}
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
              Upload one or more student transcript PDF files using the dropzone above to cross out passed subjects, alert on 0.00 failed courses, and export the processed Excel degree sheet.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-card)'
      }}>
        East Port Said National University • Faculty of Engineering • Artificial Intelligence Degree Advising
      </footer>

      {/* Prerequisite Editor Modal */}
      <PrerequisiteEditorModal
        isOpen={isPrereqModalOpen}
        onClose={() => setIsPrereqModalOpen(false)}
        initialCourseCode={initialPrereqModalCourse}
        prerequisiteLinks={prerequisiteLinks}
        onSavePrerequisites={handleSavePrerequisites}
        onMakeDefault={handleMakeDefaultPrerequisites}
        onResetPrerequisites={handleResetPrerequisites}
      />
    </div>
  );
}
