import React, { useState, useEffect } from 'react';
import { parseTranscriptPdf } from './services/pdfParser.js';
import { generatePreservedExcelWorkbook, generateSingleSheetCombinedWorkbook } from './services/excelProcessor.js';
import StudentHeader from './components/StudentHeader.jsx';
import DegreeGrid from './components/DegreeGrid.jsx';
import UploadZone from './components/UploadZone.jsx';
import StudentTabs from './components/StudentTabs.jsx';
import ExportControls from './components/ExportControls.jsx';
import { GraduationCap, Sun, Moon, Sparkles, RefreshCw, FileText } from 'lucide-react';

export default function App() {
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [templateName, setTemplateName] = useState('template.xlsx');
  const [students, setStudents] = useState([]);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [statusMessage, setStatusMessage] = useState('');

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
        newStudents.push(parsed);
      }

      setStudents(prev => {
        // Append or replace
        const combined = [...prev];
        for (const s of newStudents) {
          const existingIdx = combined.findIndex(x => x.studentId && x.studentId === s.studentId);
          if (existingIdx >= 0) {
            combined[existingIdx] = s;
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
          hasTemplate={!!templateBuffer}
          templateName={templateName}
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
              studentsCount={students.length}
              isExporting={isExporting}
            />

            {/* Interactive Degree Curriculum Grid */}
            <DegreeGrid student={activeStudent} />
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
    </div>
  );
}
