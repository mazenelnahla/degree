import React, { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, Sparkles, Check, AlertCircle, FolderUp, UserPlus } from 'lucide-react';

export default function UploadZone({
  activeProgram = 'AI',
  onSelectProgram,
  onPdfsLoaded,
  onTemplateLoaded,
  onRosterLoaded,
  onExportedDegreeLoaded,
  onBackupLoaded,
  onOpenAddStudent,
  hasTemplate,
  templateName,
  rosterInfo,
  isLoading
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const pdfInputRef = useRef(null);
  const templateInputRef = useRef(null);
  const rosterInputRef = useRef(null);
  const degreeSheetInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const jsonFiles = files.filter(f => f.name.toLowerCase().endsWith('.json'));
    if (jsonFiles.length > 0 && onBackupLoaded) {
      onBackupLoaded(jsonFiles[0]);
      return;
    }

    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const xlsxFiles = files.filter(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'));

    if (pdfs.length > 0) {
      onPdfsLoaded(pdfs, activeProgram);
    }
    if (xlsxFiles.length > 0) {
      // If file name implies exported degree sheet with registered subjects
      const degreeSheetFile = xlsxFiles.find(f => /degree.*sheet|combined|registered|all.*student/i.test(f.name));
      if (degreeSheetFile && onExportedDegreeLoaded) {
        onExportedDegreeLoaded(degreeSheetFile, degreeSheetFile.name, activeProgram);
        return;
      }

      // If file name implies roster, route accordingly
      const rosterFile = xlsxFiles.find(f => /name|id|roster|student|أسماء|اسماء|كود|طلاب/i.test(f.name));
      if (rosterFile && onRosterLoaded) {
        onRosterLoaded(rosterFile);
      } else {
        onTemplateLoaded(xlsxFiles[0], activeProgram);
      }
    }
  };

  const isEep = activeProgram === 'EEP';

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      {/* Program / Curriculum Selection Control */}
      <div style={{
        marginBottom: '1.35rem',
        padding: '1.1rem 1.35rem',
        borderRadius: '16px',
        background: isEep
          ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(249, 115, 22, 0.04))'
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.04))',
        border: isEep ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: isEep ? '#eab308' : '#818cf8' }}>
              Step 1: Select Target Program Before Adding or Reading
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              background: isEep ? 'rgba(234, 179, 8, 0.2)' : 'rgba(99, 102, 241, 0.2)',
              color: isEep ? '#fde047' : '#c7d2fe'
            }}>
              Active: {isEep ? '⚡ EEP Program' : '🤖 AI Track'}
            </span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Choose whether to process transcripts and add students for <strong>Artificial Intelligence (AI)</strong> or <strong>Energy &amp; Electrical Power (EEP)</strong>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* AI Track Toggle Button */}
          <button
            type="button"
            onClick={() => onSelectProgram && onSelectProgram('AI')}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: activeProgram === 'AI' ? 700 : 500,
              background: activeProgram === 'AI'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.28), rgba(6, 182, 212, 0.28))'
                : 'var(--bg-card)',
              border: activeProgram === 'AI' ? '2px solid #6366f1' : '1px solid var(--border-color)',
              color: activeProgram === 'AI' ? '#e0e7ff' : 'var(--text-secondary)',
              boxShadow: activeProgram === 'AI' ? '0 0 16px rgba(99, 102, 241, 0.35)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ lineHeight: 1.2 }}>AI Track</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400 }}>60 Courses • 55 Arrows</div>
            </div>
            {activeProgram === 'AI' && <Check size={16} style={{ color: '#10b981', marginLeft: '0.2rem' }} />}
          </button>

          {/* EEP Program Toggle Button */}
          <button
            type="button"
            onClick={() => onSelectProgram && onSelectProgram('EEP')}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: activeProgram === 'EEP' ? 700 : 500,
              background: activeProgram === 'EEP'
                ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.28), rgba(249, 115, 22, 0.28))'
                : 'var(--bg-card)',
              border: activeProgram === 'EEP' ? '2px solid #eab308' : '1px solid var(--border-color)',
              color: activeProgram === 'EEP' ? '#fef08a' : 'var(--text-secondary)',
              boxShadow: activeProgram === 'EEP' ? '0 0 16px rgba(234, 179, 8, 0.35)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ lineHeight: 1.2 }}>EEP Program</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400 }}>61 Courses • 33 Arrows</div>
            </div>
            {activeProgram === 'EEP' && <Check size={16} style={{ color: '#10b981', marginLeft: '0.2rem' }} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Main PDF Dropzone */}
        <div
          className={`dropzone ${isDragOver ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => pdfInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <input
            type="file"
            ref={pdfInputRef}
            multiple
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) {
                onPdfsLoaded(Array.from(e.target.files), activeProgram);
              }
            }}
          />

          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: isEep ? 'rgba(234, 179, 8, 0.15)' : 'rgba(99, 102, 241, 0.12)',
            color: isEep ? '#eab308' : '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Upload size={24} />
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Upload {isEep ? 'EEP' : 'AI'} Student Transcript PDFs
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 1rem' }}>
            Drag &amp; drop single or batch student PDF transcripts here. Reads subjects according to the selected <strong>{isEep ? 'EEP' : 'AI'}</strong> curriculum.
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
              onClick={(e) => {
                e.stopPropagation();
                pdfInputRef.current?.click();
              }}
            >
              <FileText size={16} />
              <span>Browse PDF Files</span>
            </button>

            {onOpenAddStudent && (
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.5rem 1.25rem',
                  background: isEep
                    ? 'linear-gradient(135deg, #eab308, #f97316)'
                    : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isEep ? '#1c1917' : '#fff',
                  fontWeight: 700
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddStudent();
                }}
                title={`Add student manually to ${isEep ? 'EEP' : 'AI'} program and cross subjects without a transcript`}
              >
                <UserPlus size={16} />
                <span>+ Add {isEep ? 'EEP' : 'AI'} Student Manually</span>
              </button>
            )}
          </div>
        </div>

        {/* Excel Template & Student ID-Name Roster Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.015)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FileSpreadsheet size={20} style={{ color: hasTemplate ? '#10b981' : '#94a3b8' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Excel Degree Template &amp; Roster</h4>
            </div>

            {/* Template Status Box */}
            <div style={{
              padding: '0.65rem 0.9rem',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: hasTemplate ? '#10b981' : 'var(--text-muted)' }}>
                  {hasTemplate ? `✓ ${templateName || (isEep ? 'EPP Template.xlsx' : 'template.xlsx')} (Active)` : 'Template Not Loaded'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {isEep ? '61 Courses • 33 Arrows' : '60 Courses • 55 Arrows'}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                {isEep ? 'Energy & Electrical Power' : 'Artificial Intelligence'} prerequisite arrows and drawing layer 100% preserved.
              </p>
            </div>

            {/* ID-Name Roster Status Box */}
            <div style={{
              padding: '0.65rem 0.9rem',
              borderRadius: '10px',
              background: rosterInfo ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-card)',
              border: rosterInfo ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: rosterInfo ? '#10b981' : 'var(--text-secondary)' }}>
                  {rosterInfo ? `✓ ID Roster: ${rosterInfo.fileName} (${rosterInfo.count} mapped)` : 'Student ID ↔ Name Roster (Optional)'}
                </span>
                {rosterInfo && (
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                    Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                {rosterInfo
                  ? `Names automatically assigned by student ID on upload and export.`
                  : `Upload an Excel file with Student ID & Name to auto-assign each student's name by ID.`}
              </p>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>• <strong>Passed Courses:</strong> Crossed with single diagonal <code>\</code></div>
              <div>• <strong>0.00 Failed:</strong> Highlighted in red &amp; uncrossed</div>
              <div>• <strong>Auto Name Link:</strong> Matches student ID to full name from Excel list</div>
            </div>
          </div>

          <div style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Hidden Inputs */}
            <input
              type="file"
              ref={templateInputRef}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onTemplateLoaded(e.target.files[0]);
                }
              }}
            />

            <input
              type="file"
              ref={rosterInputRef}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0] && onRosterLoaded) {
                  onRosterLoaded(e.target.files[0]);
                }
              }}
            />

            {/* Degree Sheet Input */}
            <input
              type="file"
              ref={degreeSheetInputRef}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0] && onExportedDegreeLoaded) {
                  onExportedDegreeLoaded(e.target.files[0], e.target.files[0].name);
                }
              }}
            />

            {/* Project Backup JSON Input */}
            <input
              type="file"
              ref={backupInputRef}
              accept=".json,.degree.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0] && onBackupLoaded) {
                  onBackupLoaded(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />

            {/* Restore Project Backup Button */}
            {onBackupLoaded && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                onClick={() => backupInputRef.current?.click()}
                title="Restore all students, selected courses, prerequisites and state from a .degree.json backup file"
              >
                <FolderUp size={14} style={{ color: '#818cf8' }} />
                <span>Restore Project (.json)</span>
              </button>
            )}

            {/* Upload Any Degree Sheet (.xlsx) Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => degreeSheetInputRef.current?.click()}
              title="Load an exported Degree Sheet Excel file (.xlsx) with registered subjects"
            >
              <FileSpreadsheet size={14} style={{ color: '#06b6d4' }} />
              <span>Load Degree Excel</span>
            </button>

            {/* Roster Upload Button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.85rem',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => rosterInputRef.current?.click()}
              title="Upload an Excel file containing Student IDs and Names to auto-assign student names"
            >
              <FileSpreadsheet size={14} />
              <span>{rosterInfo ? 'Update ID ↔ Name Excel' : 'Upload ID ↔ Name Excel'}</span>
            </button>

            {/* Custom Template Upload Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
              onClick={() => templateInputRef.current?.click()}
              title="Upload custom degree curriculum template .xlsx"
            >
              Custom Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
