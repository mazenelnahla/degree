import React, { useState } from 'react';
import { Download, Sliders, FileSpreadsheet, Layers, Copy, Loader2, CheckSquare, Sparkles, ClipboardCheck, Save } from 'lucide-react';

export default function ExportControls({
  onExport,
  onExportRegistration,
  onExportCombined,
  onSaveProjectBackup,
  studentsCount,
  isExporting,
  selectedCount = 0
}) {
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

  const handleDownloadCombined = () => {
    if (onExportCombined) {
      onExportCombined(options);
    }
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

  const [openDropdown, setOpenDropdown] = useState(null); // 'multi' | 'same' | null

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.export-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  if (studentsCount === 0) return null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        position: 'relative',
        zIndex: openDropdown ? 100 : 10
      }}
    >
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

          {/* DROPDOWN 1: Multi-Page (Separate Sheets / Tabs) */}
          <div className="export-dropdown-container" style={{ position: 'relative', zIndex: openDropdown === 'multi' ? 1000 : 'auto' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(prev => prev === 'multi' ? null : 'multi');
              }}
              disabled={isExporting}
              style={{
                padding: '0.65rem 1.15rem',
                borderColor: openDropdown === 'multi' ? 'var(--accent-primary)' : 'rgba(99, 102, 241, 0.4)',
                background: openDropdown === 'multi' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 600
              }}
              title="Click to view all Multi-Page / Separate Sheet export options"
            >
              {isExporting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Layers size={17} style={{ color: '#818cf8' }} />
              )}
              <span>Multi-Page (Multi-Tab)</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8, transform: openDropdown === 'multi' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {/* Dropdown Menu for Multi-Page */}
            {openDropdown === 'multi' && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: '270px',
                background: 'var(--bg-card, #1e1b4b)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                padding: '0.5rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                backdropFilter: 'blur(16px)'
              }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setOpenDropdown(null);
                    handleDownloadMulti();
                  }}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Download size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Degree Audit: Multi-Sheet</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Separate tab per student with degree tree</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setOpenDropdown(null);
                    handleDownloadRegMulti();
                  }}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Layers size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Registration Form: Multi-Tab</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Separate tab per student for reg.xlsx form</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* DROPDOWN 2: Same Page (Single Sheet) */}
          <div className="export-dropdown-container" style={{ position: 'relative', zIndex: openDropdown === 'same' ? 1000 : 'auto' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(prev => prev === 'same' ? null : 'same');
              }}
              disabled={isExporting}
              style={{
                padding: '0.65rem 1.25rem',
                background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 600
              }}
              title="Click to view all Same-Page / Single Sheet download options"
            >
              {isExporting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}
              <span>Same Page (Single Sheet)</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.9, transform: openDropdown === 'same' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {/* Dropdown Menu for Same Page */}
            {openDropdown === 'same' && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: '310px',
                background: 'var(--bg-card, #0f172a)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.55)',
                padding: '0.5rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                backdropFilter: 'blur(16px)'
              }}>
                {/* Option A: Tree & Registration in Same Sheet (with page break) */}
                {onExportCombined && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setOpenDropdown(null);
                      handleDownloadCombined();
                    }}
                    style={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      background: 'rgba(14, 165, 233, 0.08)',
                      border: '1px solid rgba(14, 165, 233, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.08)'}
                  >
                    <Sparkles size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>Tree &amp; Registration (Same Sheet)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Tree on top + Registration form below with automatic Page Break
                      </div>
                    </div>
                  </button>
                )}

                {/* Option B: All Registrations in Single Sheet */}
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setOpenDropdown(null);
                    handleDownloadRegSingle();
                  }}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ClipboardCheck size={17} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>All Registrations (Single Sheet)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>All student registration forms stacked continuously</div>
                  </div>
                </button>

                {/* Option C: Degree Tree Single Sheet */}
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setOpenDropdown(null);
                    handleDownloadSingle();
                  }}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Layers size={17} style={{ color: '#818cf8', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Degree Audit: Single Sheet</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>All student degree sheets stacked in one sheet</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Button 3: Save Project Backup (.degree.json) */}
          {onSaveProjectBackup && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSaveProjectBackup}
              disabled={isExporting}
              style={{
                padding: '0.65rem 1.15rem',
                borderColor: 'rgba(99, 102, 241, 0.5)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                fontWeight: 600
              }}
              title="Save full project state to a .degree.json backup file so you can restore and resume edits anytime"
            >
              <Save size={18} />
              <span>Save Backup</span>
            </button>
          )}
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
