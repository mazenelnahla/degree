import React, { useState } from 'react';
import { X, CheckSquare, Square, Check, BookOpen, AlertCircle, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { DEGREE_STRUCTURE, ALL_COURSES, normalizeCode } from '../services/courseMapping.js';

export default function CrossSubjectsModal({ isOpen, onClose, student, onToggleCourseCrossed, onBulkCrossCourses }) {
  const [activeLevelTab, setActiveLevelTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const currentLevelData = DEGREE_STRUCTURE.find(l => l.level === activeLevelTab);
  const passedCoursesCount = student.passedCount || Object.values(student.courseMap || {}).filter(c => c.isPassed && (c.points === undefined || c.points > 0)).length;

  const handleSelectLevelCourses = (lvl) => {
    const lvlConfig = DEGREE_STRUCTURE.find(l => l.level === lvl);
    if (!lvlConfig) return;
    const codesInLevel = lvlConfig.semesters.flatMap(s => s.courses.map(c => c.code));
    if (onBulkCrossCourses) {
      onBulkCrossCourses(codesInLevel, true);
    }
  };

  const handleDeselectLevelCourses = (lvl) => {
    const lvlConfig = DEGREE_STRUCTURE.find(l => l.level === lvl);
    if (!lvlConfig) return;
    const codesInLevel = lvlConfig.semesters.flatMap(s => s.courses.map(c => c.code));
    if (onBulkCrossCourses) {
      onBulkCrossCourses(codesInLevel, false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-cross-subjects-title"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          borderRadius: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Manage Crossed Subjects
                </h2>
                <span className="code-pill" style={{ fontSize: '0.75rem' }}>
                  {student.studentName} ({student.studentId || 'ID'})
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                Total crossed (passed): <strong style={{ color: '#10b981' }}>{passedCoursesCount}</strong> subjects • Strike line will appear on degree sheet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Level Tabs and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
            {[0, 1, 2, 3, 4].map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevelTab(lvl)}
                className={`tab-btn ${activeLevelTab === lvl ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              >
                Level {lvl}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSelectLevelCourses(activeLevelTab)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', color: '#10b981' }}
            >
              + Cross All Level {activeLevelTab}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleDeselectLevelCourses(activeLevelTab)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', color: '#f87171' }}
            >
              Uncross Level {activeLevelTab}
            </button>
          </div>
        </div>

        {/* Course Grid */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {currentLevelData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {currentLevelData.semesters.map((sem, sIdx) => {
                const semPassedCount = sem.courses.filter(c => {
                  const rec = student.courseMap && student.courseMap[normalizeCode(c.code)];
                  return rec && rec.isPassed && (rec.points === undefined || rec.points > 0);
                }).length;

                return (
                  <div
                    key={sIdx}
                    style={{
                      padding: '1rem',
                      borderRadius: '14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {sem.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                          {semPassedCount}/{sem.courses.length} Passed
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const codes = sem.courses.map(c => c.code);
                            onBulkCrossCourses && onBulkCrossCourses(codes, semPassedCount < sem.courses.length);
                          }}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {semPassedCount < sem.courses.length ? 'Cross All' : 'Uncross All'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {sem.courses.map(course => {
                        const norm = normalizeCode(course.code);
                        const rec = student.courseMap && student.courseMap[norm];
                        const isPassed = rec && rec.isPassed && (rec.points === undefined || rec.points > 0);

                        return (
                          <div
                            key={course.code}
                            onClick={() => onToggleCourseCrossed && onToggleCourseCrossed(course.code)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              background: isPassed ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                              border: isPassed ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                              <div style={{ color: isPassed ? '#10b981' : 'var(--text-muted)' }}>
                                {isPassed ? <CheckSquare size={17} /> : <Square size={17} />}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    color: isPassed ? '#10b981' : 'var(--text-primary)',
                                    textDecoration: isPassed ? 'line-through' : 'none'
                                  }}>
                                    {course.code}
                                  </span>
                                  {isPassed && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      padding: '0.05rem 0.35rem',
                                      borderRadius: '4px',
                                      background: 'rgba(16, 185, 129, 0.2)',
                                      color: '#10b981',
                                      fontWeight: 600
                                    }}>
                                      Crossed ✓
                                    </span>
                                  )}
                                </div>
                                <div style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {course.name}
                                </div>
                              </div>
                            </div>

                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {course.ch || 3} CH
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          marginTop: '1rem'
        }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
