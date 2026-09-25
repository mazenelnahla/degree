import React, { useState, useMemo, useRef } from 'react';
import { ALL_COURSES, normalizeCode, downloadPrerequisitesJson } from '../services/courseMapping.js';
import { GitFork, Plus, Trash2, RotateCcw, Save, X, Search, Check, AlertCircle, ArrowRight, CornerDownRight, Download, Upload, BookmarkCheck } from 'lucide-react';

export default function PrerequisiteEditorModal({
  isOpen,
  onClose,
  initialCourseCode = null,
  prerequisiteLinks,
  onSavePrerequisites,
  onMakeDefault,
  onResetPrerequisites
}) {
  const [selectedCourseCode, setSelectedCourseCode] = useState(initialCourseCode || 'BSC 012');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPrereqToAdd, setSelectedPrereqToAdd] = useState('');
  const [selectedUnlockToAdd, setSelectedUnlockToAdd] = useState('');
  const [links, setLinks] = useState([...prerequisiteLinks]);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  // Sync if opened or links prop changed initially
  React.useEffect(() => {
    setLinks([...prerequisiteLinks]);
    setHasChanges(false);
  }, [prerequisiteLinks, isOpen]);

  // When opened with an initialCourseCode or initialCourseCode changes, update selectedCourseCode
  React.useEffect(() => {
    if (initialCourseCode) {
      setSelectedCourseCode(initialCourseCode);
    } else if (isOpen && !selectedCourseCode) {
      setSelectedCourseCode('BSC 012');
    }
  }, [initialCourseCode, isOpen]);

  const currentCourse = ALL_COURSES.find(c => normalizeCode(c.code) === normalizeCode(selectedCourseCode)) || ALL_COURSES[0];
  const normCurrent = normalizeCode(currentCourse?.code || '');

  // Current prerequisites required for this course (links where `to` === currentCourse)
  const currentRequires = useMemo(() => {
    return links.filter(l => normalizeCode(l.to) === normCurrent);
  }, [links, normCurrent]);

  // Current courses unlocked by this course (links where `from` === currentCourse)
  const currentUnlocks = useMemo(() => {
    return links.filter(l => normalizeCode(l.from) === normCurrent);
  }, [links, normCurrent]);

  // Courses available to add as prerequisites (exclude self and already added)
  const availablePrereqCandidates = useMemo(() => {
    const existingNorms = new Set(currentRequires.map(r => normalizeCode(r.from)));
    return ALL_COURSES.filter(c => {
      const cNorm = normalizeCode(c.code);
      return cNorm !== normCurrent && !existingNorms.has(cNorm);
    });
  }, [currentRequires, normCurrent]);

  // Courses available to add as unlocked by this course (exclude self and already unlocked)
  const availableUnlockCandidates = useMemo(() => {
    const existingNorms = new Set(currentUnlocks.map(u => normalizeCode(u.to)));
    return ALL_COURSES.filter(c => {
      const cNorm = normalizeCode(c.code);
      return cNorm !== normCurrent && !existingNorms.has(cNorm);
    });
  }, [currentUnlocks, normCurrent]);

  // Filtered course list for course picker
  const filteredCourses = useMemo(() => {
    if (!searchFilter.trim()) return ALL_COURSES;
    const term = searchFilter.toLowerCase().trim();
    return ALL_COURSES.filter(c => 
      c.code.toLowerCase().includes(term) || 
      c.name.toLowerCase().includes(term) ||
      normalizeCode(c.code).toLowerCase().includes(term)
    );
  }, [searchFilter]);

  const handleAddPrerequisite = () => {
    if (!selectedPrereqToAdd) return;
    const prereqCourse = ALL_COURSES.find(c => normalizeCode(c.code) === normalizeCode(selectedPrereqToAdd));
    if (!prereqCourse) return;

    // Check if link already exists
    const exists = links.some(l => 
      normalizeCode(l.from) === normalizeCode(prereqCourse.code) && 
      normalizeCode(l.to) === normCurrent
    );

    if (!exists) {
      const newLinks = [...links, { from: prereqCourse.code, to: currentCourse.code }];
      setLinks(newLinks);
      setHasChanges(true);
      setSelectedPrereqToAdd('');
    }
  };

  const handleAddUnlock = () => {
    if (!selectedUnlockToAdd) return;
    const unlockedCourse = ALL_COURSES.find(c => normalizeCode(c.code) === normalizeCode(selectedUnlockToAdd));
    if (!unlockedCourse) return;

    const exists = links.some(l =>
      normalizeCode(l.from) === normCurrent &&
      normalizeCode(l.to) === normalizeCode(unlockedCourse.code)
    );

    if (!exists) {
      const newLinks = [...links, { from: currentCourse.code, to: unlockedCourse.code }];
      setLinks(newLinks);
      setHasChanges(true);
      setSelectedUnlockToAdd('');
    }
  };

  const fileInputRef = useRef(null);

  const handleRemovePrerequisite = (fromCode) => {
    const fromNorm = normalizeCode(fromCode);
    const newLinks = links.filter(l => !(normalizeCode(l.from) === fromNorm && normalizeCode(l.to) === normCurrent));
    setLinks(newLinks);
    setHasChanges(true);
  };

  const handleRemoveUnlock = (toCode) => {
    const toNorm = normalizeCode(toCode);
    const newLinks = links.filter(l => !(normalizeCode(l.from) === normCurrent && normalizeCode(l.to) === toNorm));
    setLinks(newLinks);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSavePrerequisites(links);
    setHasChanges(false);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleDownload = () => {
    downloadPrerequisitesJson(links);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          setLinks(parsed);
          setHasChanges(true);
          await onSavePrerequisites(parsed);
          setSavedAlert(true);
          setTimeout(() => setSavedAlert(false), 3000);
        } else {
          alert('Invalid file format: JSON must contain an array of prerequisite links.');
        }
      } catch (err) {
        alert('Could not read JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMakeDefault = async () => {
    if (window.confirm('Set current prerequisite links as the permanent system default? This will be saved to disk as the base curriculum.')) {
      if (onMakeDefault) {
        await onMakeDefault(links);
      } else {
        await onSavePrerequisites(links);
      }
      setHasChanges(false);
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all prerequisite connections back to default curriculum settings?')) {
      const defaultLinks = await onResetPrerequisites();
      setLinks(defaultLinks);
      setHasChanges(false);
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '860px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <GitFork size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                Prerequisites Manager
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Edit prerequisite requirements and unlock relations for each subject. Automatically saved to local file &amp; browser.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Hidden file input for importing JSON */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-secondary"
              title="Save & download prerequisites as degree_prerequisites.json to your computer"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} style={{ color: '#06b6d4' }} />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              title="Import prerequisites from a previously saved JSON file"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Upload size={14} style={{ color: '#818cf8' }} />
              <span>Import JSON</span>
            </button>

            <button
              type="button"
              onClick={handleMakeDefault}
              className="btn btn-secondary"
              title="Save current prerequisite layout as the permanent default on disk and in codebase"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
            >
              <BookmarkCheck size={14} />
              <span>Make It Default</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              title="Reset all prerequisites back to default curriculum"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Content Body: Split layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* Left Column: Subject Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search subject code/title..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              padding: '0.35rem'
            }}>
              {filteredCourses.map(course => {
                const isSelected = normalizeCode(course.code) === normCurrent;
                const reqCount = links.filter(l => normalizeCode(l.to) === normalizeCode(course.code)).length;
                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => setSelectedCourseCode(course.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? 'var(--accent-primary)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '2px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        {course.code}
                      </div>
                      <div style={{
                        fontSize: '0.73rem',
                        color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {course.name}
                      </div>
                    </div>
                    {reqCount > 0 && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(99, 102, 241, 0.15)',
                        color: isSelected ? '#ffffff' : 'var(--accent-primary)',
                        fontWeight: 700
                      }}>
                        {reqCount} req
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Course Prerequisite Details & Edit Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
            
            {/* Target Course Banner */}
            <div style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="code-pill" style={{ fontSize: '0.95rem' }}>
                    {currentCourse.code}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Level {currentCourse.level} • Semester {currentCourse.semester} • {currentCourse.ch} CH
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentCourse.name}
                </div>
              </div>
            </div>

            {/* Section 1: Prerequisites Required to Take this Course (REQUIRES) */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '1.1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CornerDownRight size={17} style={{ color: '#818cf8' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Prerequisites Required ({currentRequires.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Must be passed before taking {currentCourse.code}
                </span>
              </div>

              {/* List of current requires */}
              {currentRequires.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem'
                }}>
                  No prerequisites required for this course (can be registered directly).
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {currentRequires.map(req => {
                    const reqInfo = ALL_COURSES.find(c => normalizeCode(c.code) === normalizeCode(req.from));
                    return (
                      <div
                        key={req.from}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
                          {req.from}
                        </span>
                        {reqInfo && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {reqInfo.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePrerequisite(req.from)}
                          title={`Remove ${req.from} as prerequisite`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '2px',
                            marginLeft: '2px'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Prerequisite Form */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginTop: currentRequires.length > 0 ? '0.75rem' : '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--border-color)'
              }}>
                <select
                  value={selectedPrereqToAdd}
                  onChange={e => setSelectedPrereqToAdd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="">-- Choose Course to Add as Prerequisite --</option>
                  {availablePrereqCandidates.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} (L{c.level})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddPrerequisite}
                  disabled={!selectedPrereqToAdd}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.85rem',
                    opacity: selectedPrereqToAdd ? 1 : 0.5,
                    cursor: selectedPrereqToAdd ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Plus size={15} />
                  <span>Add Prerequisite</span>
                </button>
              </div>
            </div>

            {/* Section 2: Courses that this course unlocks */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '1.1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ArrowRight size={17} style={{ color: '#06b6d4' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Courses Unlocked by {currentCourse.code} ({currentUnlocks.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Passing this enables taking these subjects
                </span>
              </div>

              {currentUnlocks.length === 0 ? (
                <div style={{
                  padding: '0.85rem',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  marginBottom: '0.75rem'
                }}>
                  This course is not currently set as a prerequisite for any subsequent courses.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {currentUnlocks.map(unl => {
                    const unlInfo = ALL_COURSES.find(c => normalizeCode(c.code) === normalizeCode(unl.to));
                    return (
                      <div
                        key={unl.to}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#06b6d4' }}>
                          {unl.to}
                        </span>
                        {unlInfo && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {unlInfo.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveUnlock(unl.to)}
                          title={`Remove unlock link to ${unl.to}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '2px',
                            marginLeft: '2px'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Unlocked Course Form */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--border-color)'
              }}>
                <select
                  value={selectedUnlockToAdd}
                  onChange={e => setSelectedUnlockToAdd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="">-- Choose Course Unlocked by {currentCourse.code} --</option>
                  {availableUnlockCandidates.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} (L{c.level})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddUnlock}
                  disabled={!selectedUnlockToAdd}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.85rem',
                    opacity: selectedUnlockToAdd ? 1 : 0.5,
                    cursor: selectedUnlockToAdd ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#06b6d4',
                    borderColor: 'rgba(6, 182, 212, 0.4)'
                  }}
                >
                  <Plus size={15} />
                  <span>Add Unlocked</span>
                </button>
              </div>
            </div>

            {/* Total Link Stats */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', padding: '0 0.25rem' }}>
              <span>Total Active Prerequisite Rules: <strong>{links.length}</strong></span>
              <span>Changes affect degree visual map, hover relations, and status alerts.</span>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            {savedAlert && (
              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Check size={16} /> Prerequisite rules saved successfully!
              </span>
            )}
            {hasChanges && !savedAlert && (
              <span style={{ color: '#f59e0b', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={15} /> Unsaved changes in prerequisites.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: hasChanges ? '0 0 14px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >
              <Save size={16} />
              <span>Save Prerequisites</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
