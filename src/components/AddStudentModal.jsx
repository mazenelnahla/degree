import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckSquare, Square, Check, BookOpen, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { getDegreeStructure, getAllCourses, getProgram, normalizeCode, normalizeProgramId } from '../services/courseMapping.js';

export default function AddStudentModal({ isOpen, onClose, onAddStudent, initialProgram = 'AI' }) {
  const [modalProgram, setModalProgram] = useState(() => normalizeProgramId(initialProgram));
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [aiLevel, setAiLevel] = useState(1);
  const [cgpa, setCgpa] = useState('');
  const [admissionYear, setAdmissionYear] = useState('2024');
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [activeLevelTab, setActiveLevelTab] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync modalProgram when opening with initialProgram
  useEffect(() => {
    if (isOpen) {
      setModalProgram(normalizeProgramId(initialProgram));
    }
  }, [isOpen, initialProgram]);

  // Close dialog on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const degreeStructure = getDegreeStructure(modalProgram);
  const allCourses = getAllCourses(modalProgram);
  const isEep = modalProgram === 'EEP';

  const handleToggleCourse = (code) => {
    const norm = normalizeCode(code);
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(norm)) {
        next.delete(norm);
      } else {
        next.add(norm);
      }
      return next;
    });
  };

  const handleSelectLevelCourses = (lvl) => {
    const lvlConfig = degreeStructure.find(l => l.level === lvl);
    if (!lvlConfig) return;
    const codesInLevel = lvlConfig.semesters.flatMap(s => s.courses.map(c => normalizeCode(c.code)));
    setSelectedCourses(prev => {
      const next = new Set(prev);
      codesInLevel.forEach(c => next.add(c));
      return next;
    });
  };

  const handleDeselectLevelCourses = (lvl) => {
    const lvlConfig = degreeStructure.find(l => l.level === lvl);
    if (!lvlConfig) return;
    const codesInLevel = lvlConfig.semesters.flatMap(s => s.courses.map(c => normalizeCode(c.code)));
    setSelectedCourses(prev => {
      const next = new Set(prev);
      codesInLevel.forEach(c => next.delete(c));
      return next;
    });
  };

  const handleClearAllCourses = () => {
    setSelectedCourses(new Set());
  };

  const handleProgramChange = (newProg) => {
    if (newProg === modalProgram) return;
    setModalProgram(newProg);
    // Keep courses that are common in both curricula (e.g. Level 0 BSC 041, PRD 031, PRD 041, CCE 031)
    const newProgCourses = getAllCourses(newProg);
    const newProgNorms = new Set(newProgCourses.map(c => normalizeCode(c.code)));
    setSelectedCourses(prev => {
      const filtered = new Set();
      prev.forEach(code => {
        if (newProgNorms.has(code)) filtered.add(code);
      });
      return filtered;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('Please enter student name.');
      return;
    }
    if (!studentId.trim()) {
      setErrorMsg('Please enter student ID.');
      return;
    }

    onAddStudent({
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      aiLevel: parseInt(aiLevel, 10),
      cgpa: cgpa ? parseFloat(cgpa) : 3.0,
      admissionYear: admissionYear.trim() || '2024',
      program: modalProgram,
      crossedCourseCodes: Array.from(selectedCourses)
    });

    // Reset and close
    setStudentName('');
    setStudentId('');
    setAiLevel(1);
    setCgpa('');
    setSelectedCourses(new Set());
    setErrorMsg('');
    onClose();
  };

  const currentLevelData = degreeStructure.find(l => l.level === activeLevelTab);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-add-student-title"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          borderRadius: '20px'
        }}
      >
        {/* Dialog Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <UserPlus size={22} />
            </div>
            <div>
              <h2 id="dialog-add-student-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Add Student
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                Create student profile and cross completed subjects without uploading a transcript PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            title="Close dialog (Esc)"
            style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.65rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {/* Program Curriculum Track Selector */}
          <div style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '12px',
            background: isEep ? 'rgba(234, 179, 8, 0.08)' : 'rgba(99, 102, 241, 0.08)',
            border: isEep ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target Program / Degree Track
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Subjects list and levels below automatically adapt to this program.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleProgramChange('AI')}
                style={{
                  padding: '0.42rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: modalProgram === 'AI' ? 700 : 500,
                  background: modalProgram === 'AI' ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'var(--bg-card)',
                  border: modalProgram === 'AI' ? '1px solid transparent' : '1px solid var(--border-color)',
                  color: modalProgram === 'AI' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: modalProgram === 'AI' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                <span>🤖 AI Track</span>
                {modalProgram === 'AI' && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => handleProgramChange('EEP')}
                style={{
                  padding: '0.42rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: modalProgram === 'EEP' ? 700 : 500,
                  background: modalProgram === 'EEP' ? 'linear-gradient(135deg, #eab308, #f97316)' : 'var(--bg-card)',
                  border: modalProgram === 'EEP' ? '1px solid transparent' : '1px solid var(--border-color)',
                  color: modalProgram === 'EEP' ? '#1c1917' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: modalProgram === 'EEP' ? '0 2px 8px rgba(234, 179, 8, 0.3)' : 'none'
                }}
              >
                <span>⚡ EEP Program</span>
                {modalProgram === 'EEP' && <Check size={14} />}
              </button>
            </div>
          </div>

          {/* Basic Info Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            padding: '1.1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Student Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Student Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Seif Eleslam Ahmed"
                value={studentName}
                onChange={e => {
                  setStudentName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Student ID */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Student ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 20230045"
                value={studentId}
                onChange={e => {
                  setStudentId(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Curriculum AI Level */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Curriculum Level
              </label>
              <select
                value={aiLevel}
                onChange={e => setAiLevel(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              >
                <option value={1}>1st Level (Freshman)</option>
                <option value={2}>2nd Level (Sophomore)</option>
                <option value={3}>3rd Level (Junior)</option>
                <option value={4}>4th Level (Senior)</option>
              </select>
            </div>

            {/* CGPA */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                CGPA (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                placeholder="e.g. 3.25"
                value={cgpa}
                onChange={e => setCgpa(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Admission Year */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Admission Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={admissionYear}
                onChange={e => setAdmissionYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>

          {/* Section: Pre-Cross Passed Subjects */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckSquare size={17} style={{ color: '#10b981' }} />
                  <span>Cross Out Passed Subjects ({selectedCourses.size} selected)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Selected courses will be marked as passed and crossed with a strike line in the degree sheet.
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSelectLevelCourses(0)}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                >
                  + Level 0 All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSelectLevelCourses(1)}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                >
                  + Level 1 All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSelectLevelCourses(2)}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                >
                  + Level 2 All
                </button>
                {selectedCourses.size > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearAllCourses}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: '#f87171' }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Level Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
              {[0, 1, 2, 3, 4].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setActiveLevelTab(lvl)}
                  className={`tab-btn ${activeLevelTab === lvl ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  Level {lvl}
                </button>
              ))}
            </div>

            {/* Course Checkboxes in Current Level Tab */}
            {currentLevelData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectLevelCourses(activeLevelTab)}
                    style={{ fontSize: '0.72rem', color: '#10b981', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Select All in Level {activeLevelTab}
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <button
                    type="button"
                    onClick={() => handleDeselectLevelCourses(activeLevelTab)}
                    style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Deselect Level {activeLevelTab}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {currentLevelData.semesters.map((sem, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                        {sem.title}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {sem.courses.map(course => {
                          const norm = normalizeCode(course.code);
                          const isCrossed = selectedCourses.has(norm);
                          return (
                            <label
                              key={course.code}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '8px',
                                background: isCrossed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                border: isCrossed ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isCrossed}
                                onChange={() => handleToggleCourse(course.code)}
                                style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    color: isCrossed ? '#10b981' : 'var(--text-primary)',
                                    textDecoration: isCrossed ? 'line-through' : 'none'
                                  }}>
                                    {course.code}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {course.ch || 3} CH
                                  </span>
                                </div>
                                <div style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {course.name}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <UserPlus size={16} />
              <span>Add Student &amp; Cross Subjects</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
