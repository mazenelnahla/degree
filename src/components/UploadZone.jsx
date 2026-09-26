import React, { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function UploadZone({
  onPdfsLoaded,
  onTemplateLoaded,
  onRosterLoaded,
  hasTemplate,
  templateName,
  rosterInfo,
  isLoading
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const pdfInputRef = useRef(null);
  const templateInputRef = useRef(null);
  const rosterInputRef = useRef(null);

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
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const xlsxFiles = files.filter(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'));

    if (pdfs.length > 0) {
      onPdfsLoaded(pdfs);
    }
    if (xlsxFiles.length > 0) {
      // If file name implies roster, or if template already loaded, route accordingly
      const rosterFile = xlsxFiles.find(f => /name|id|roster|student|أسماء|اسماء|كود|طلاب/i.test(f.name));
      if (rosterFile && onRosterLoaded) {
        onRosterLoaded(rosterFile);
      } else {
        onTemplateLoaded(xlsxFiles[0]);
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
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
                onPdfsLoaded(Array.from(e.target.files));
              }
            }}
          />

          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Upload size={24} />
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Upload Student Transcript PDFs
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 1rem' }}>
            Drag &amp; drop single or batch student PDF transcripts here. Supports multi-file selection.
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ margin: '0 auto', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
            onClick={(e) => {
              e.stopPropagation();
              pdfInputRef.current?.click();
            }}
          >
            <FileText size={16} />
            <span>Browse PDF Files</span>
          </button>
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
                  {hasTemplate ? `✓ ${templateName || 'template.xlsx'} (Active)` : 'Template Not Loaded'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  60 Courses • 55 Arrows
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                Prerequisite connector arrows and drawing layer will be 100% preserved.
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
