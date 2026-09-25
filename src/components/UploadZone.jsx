import React, { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function UploadZone({ onPdfsLoaded, onTemplateLoaded, hasTemplate, templateName, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const pdfInputRef = useRef(null);
  const templateInputRef = useRef(null);

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
    const xlsx = files.find(f => f.name.toLowerCase().endsWith('.xlsx'));

    if (pdfs.length > 0) {
      onPdfsLoaded(pdfs);
    }
    if (xlsx) {
      onTemplateLoaded(xlsx);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
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

        {/* Excel Template & Rules Panel */}
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
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Excel Degree Template</h4>
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: hasTemplate ? '#10b981' : 'var(--text-muted)' }}>
                  {hasTemplate ? `✓ ${templateName || 'template.xlsx'} (Active)` : 'Template Not Loaded'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  60 Courses • 55 Arrows
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Prerequisite connector arrows and drawing layer will be 100% preserved.
              </p>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>• <strong>Passed Courses:</strong> Crossed with single diagonal <code>\</code></div>
              <div>• <strong>0.00 Failed:</strong> Highlighted in red &amp; uncrossed</div>
              <div>• <strong>Semester GPAs:</strong> Placed in Column W (Summer excluded)</div>
            </div>
          </div>

          <div style={{
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Using custom curriculum sheet?
            </span>

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

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              onClick={() => templateInputRef.current?.click()}
            >
              Upload Custom .xlsx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
