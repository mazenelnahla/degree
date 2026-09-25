import React, { useState } from 'react';
import { Download, Sliders, FileSpreadsheet, Layers, Copy, Loader2 } from 'lucide-react';

export default function ExportControls({ onExport, studentsCount, isExporting }) {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState({
    useStrikethrough: true,
    useDiagonalCross: true,
    useHighlight: true,
    alertFailed: true
  });

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadMulti = () => {
    onExport(options, 'multi');
  };

  const handleDownloadSingle = () => {
    onExport(options, 'single');
  };

  if (studentsCount === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Export Processed Excel Workbook
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>{studentsCount}</strong> student transcript{studentsCount > 1 ? 's' : ''} loaded • Choose export format below:
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Style Settings Toggle */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowOptions(!showOptions)}
            style={{ fontSize: '0.8rem' }}
          >
            <Sliders size={16} />
            <span>Style Settings</span>
          </button>

          {/* Button 1: Download All in Single Sheet */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadSingle}
            disabled={isExporting}
            style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            title="Combine all students into one single continuous worksheet"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Layers size={18} />
            )}
            <span>Download All in Single Sheet</span>
          </button>

          {/* Button 2: Download Multi-Sheet (Separate Tab per Student) */}
          <button
            type="button"
            className="btn btn-success"
            onClick={handleDownloadMulti}
            disabled={isExporting}
            style={{ padding: '0.65rem 1.25rem' }}
            title="Create a separate sheet tab for each student"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            <span>Download Multi-Sheet (1 Tab/Student)</span>
          </button>
        </div>
      </div>

      {/* Style Options Drawer */}
      {showOptions && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={options.useStrikethrough}
              onChange={() => toggleOption('useStrikethrough')}
            />
            <span>Strikethrough font on passed courses</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={options.useDiagonalCross}
              onChange={() => toggleOption('useDiagonalCross')}
            />
            <span>Diagonal single slash (&quot;\&quot;) across passed cells</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={options.alertFailed}
              onChange={() => toggleOption('alertFailed')}
            />
            <span>Highlight 0.00 failed courses in RED</span>
          </label>

          <div style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>✓ All 55 arrow connectors preserved in both export modes</span>
          </div>
        </div>
      )}
    </div>
  );
}
