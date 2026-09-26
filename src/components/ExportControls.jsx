import React, { useState } from 'react';
import { Download, Sliders, FileSpreadsheet, Layers, Copy, Loader2, CheckSquare, Sparkles, ClipboardCheck } from 'lucide-react';

export default function ExportControls({ onExport, onExportRegistration, studentsCount, isExporting, selectedCount = 0 }) {
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

  const handleDownloadRegSingle = () => {
    if (onExportRegistration) {
      onExportRegistration('single');
    }
  };

  const handleDownloadRegMulti = () => {
    if (onExportRegistration) {
      onExportRegistration('multi');
    }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Export Processed Excel Workbook &amp; Registrations
              </h3>
              {selectedCount > 0 && (
                <span className="checkpoint-badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                  <CheckSquare size={11} />
                  <span>{selectedCount} Checkpointed Subject{selectedCount > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
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

          {/* Button 1: Download Degree Sheets in Single Sheet */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadSingle}
            disabled={isExporting}
            style={{ padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            title="Combine all student degree audit sheets into one continuous worksheet"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Layers size={18} />
            )}
            <span>Degree: Single Sheet</span>
          </button>

          {/* Button 2: Download Degree Multi-Sheet */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadMulti}
            disabled={isExporting}
            style={{ padding: '0.65rem 1.1rem' }}
            title="Create a separate sheet tab for each student's degree audit"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            <span>Degree: Multi-Sheet</span>
          </button>

          {/* Button 3: Download All Registrations in Same File (Single Sheet) */}
          <button
            type="button"
            className="btn btn-success"
            onClick={handleDownloadRegSingle}
            disabled={isExporting}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              fontWeight: 600
            }}
            title="Export all student official registration forms (reg.xlsx) stacked in the SAME single continuous sheet"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ClipboardCheck size={18} />
            )}
            <span>Export All Registrations (Same Sheet)</span>
          </button>

          {/* Button 4: Download Registrations Multi-Tab */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadRegMulti}
            disabled={isExporting}
            style={{ padding: '0.65rem 1.1rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            title="Export registration forms with a separate tab per student"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Layers size={18} />
            )}
            <span>Registrations (Multi-Tab)</span>
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

          <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>✓ Checkpointed subjects exported with sage highlight &amp; [✓] tag</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>✓ All 55 arrow connectors preserved in both export modes</span>
          </div>
        </div>
      )}
    </div>
  );
}
