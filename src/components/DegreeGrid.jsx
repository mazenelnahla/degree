import React, { useState } from 'react';
import { DEGREE_STRUCTURE, ALL_COURSES, PREREQUISITE_LINKS, normalizeCode } from '../services/courseMapping.js';
import { CheckCircle2, XCircle, Search, Filter, Info, ChevronRight, X, ArrowRight, CornerDownRight, GitFork } from 'lucide-react';

export default function DegreeGrid({ student }) {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, passed, failed, not_taken
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCourseModal, setActiveCourseModal] = useState(null);
  const [hoveredCode, setHoveredCode] = useState(null);

  if (!student) return null;

  // Filter levels
  const filteredLevels = DEGREE_STRUCTURE.filter(lvl => {
    if (selectedLevel !== 'all' && lvl.level !== parseInt(selectedLevel, 10)) {
      return false;
    }
    return true;
  });

  const getCourseStatus = (course) => {
    const norm = normalizeCode(course.code);
    let record = student.courseMap[norm];
    if (!record && course.aliases) {
      for (const alias of course.aliases) {
        if (student.courseMap[normalizeCode(alias)]) {
          record = student.courseMap[normalizeCode(alias)];
          break;
        }
      }
    }

    if (!record) {
      return { status: 'not_taken', label: 'Not Taken', record: null };
    }
    if (record.isPassed && record.points > 0.00) {
      return { status: 'passed', label: 'Passed & Crossed', record };
    }
    if (record.points === 0.00) {
      return { status: 'failed_zero', label: '0.00 (NOT Crossed)', record };
    }
    return { status: 'other', label: record.grade, record };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Controls Bar: Filters, Search, and Legend */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Level Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.25rem' }}>
              Level:
            </span>
            {['all', '0', '1', '2', '3', '4'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`tab-btn ${selectedLevel === lvl ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              >
                {lvl === 'all' ? 'All Levels' : `Level ${lvl}`}
              </button>
            ))}
          </div>

          {/* Status Filter & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all">All Courses</option>
                <option value="passed">Passed (Crossed Out)</option>
                <option value="failed_zero">0.00 Failed (NOT Crossed)</option>
                <option value="not_taken">Not Taken Yet</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search course code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  fontSize: '0.85rem',
                  minWidth: '220px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          marginTop: '0.85rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rules:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></span>
              <span><strong>Passed:</strong> Crossed out</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f43f5e' }}></span>
              <span><strong>0.00 Value:</strong> NOT crossed (Active)</span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}>
            <GitFork size={13} />
            <span>55 Prerequisite Link Arrows Preserved in Excel</span>
          </div>
        </div>
      </div>

      {/* Levels & Courses Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {filteredLevels.map((lvl) => {
          return (
            <div key={lvl.level} className="glass-panel" style={{ padding: '1.5rem' }}>
              {/* Level Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="level-badge">{lvl.title}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Curriculum Year {lvl.level + 1}
                  </span>
                </div>
              </div>

              {/* Semesters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {lvl.semesters.map((sem) => {
                  // Filter courses inside semester
                  const visibleCourses = sem.courses.filter(course => {
                    const statusInfo = getCourseStatus(course);
                    if (statusFilter !== 'all') {
                      if (statusFilter === 'passed' && statusInfo.status !== 'passed') return false;
                      if (statusFilter === 'failed_zero' && statusInfo.status !== 'failed_zero') return false;
                      if (statusFilter === 'not_taken' && statusInfo.status !== 'not_taken') return false;
                    }
                    if (searchTerm) {
                      const q = searchTerm.toLowerCase();
                      const matchCode = course.code.toLowerCase().includes(q);
                      const matchName = course.name.toLowerCase().includes(q);
                      return matchCode || matchName;
                    }
                    return true;
                  });

                  if (visibleCourses.length === 0 && (statusFilter !== 'all' || searchTerm)) {
                    return null;
                  }

                  const semGpaRecord = student.levelGpas?.find(lg => lg.level === lvl.level && lg.semester === sem.semester);

                  return (
                    <div key={sem.semester} style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.015)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {sem.title}
                          </h3>
                          {semGpaRecord ? (
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#818cf8',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}>
                              GPA: {semGpaRecord.gpa.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              (Pending)
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Excel: {sem.gpaCell} = <strong>{semGpaRecord ? semGpaRecord.gpa.toFixed(2) : '—'}</strong> • CH: {sem.chCell}
                        </span>
                      </div>

                      {/* Courses Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                        gap: '1rem'
                      }}>
                        {visibleCourses.map((course) => {
                          const statusInfo = getCourseStatus(course);
                          const isPassed = statusInfo.status === 'passed';
                          const isZeroFailed = statusInfo.status === 'failed_zero';
                          
                          const norm = normalizeCode(course.code);
                          const isHovered = hoveredCode === norm;
                          const requires = PREREQUISITE_LINKS.filter(l => normalizeCode(l.to) === norm).map(l => l.from);
                          const unlocks = PREREQUISITE_LINKS.filter(l => normalizeCode(l.from) === norm).map(l => l.to);
                          const isConnected = hoveredCode && (
                            requires.some(r => normalizeCode(r) === hoveredCode) ||
                            unlocks.some(u => normalizeCode(u) === hoveredCode)
                          );

                          return (
                            <div
                              key={course.code}
                              className={`course-card ${isPassed ? 'passed' : ''} ${isZeroFailed ? 'failed-zero' : ''}`}
                              onClick={() => setActiveCourseModal({ course, statusInfo, requires, unlocks })}
                              onMouseEnter={() => setHoveredCode(norm)}
                              onMouseLeave={() => setHoveredCode(null)}
                              style={{
                                cursor: 'pointer',
                                outline: isHovered ? '2px solid #6366f1' : isConnected ? '2px dashed #06b6d4' : 'none',
                                transform: isHovered ? 'translateY(-3px)' : 'none',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                  <span className="course-code" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {course.code}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {course.ch} CH
                                  </span>
                                </div>

                                <div className="course-name" style={{ fontSize: '0.825rem', lineHeight: 1.3, marginBottom: '0.4rem' }}>
                                  {course.name}
                                </div>

                                {/* Prerequisite Links & Arrows indicator */}
                                {requires.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                    <CornerDownRight size={11} style={{ color: '#818cf8' }} />
                                    <span>Requires: <strong>{requires.join(', ')}</strong></span>
                                  </div>
                                )}
                                {unlocks.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                    <ArrowRight size={11} style={{ color: '#06b6d4' }} />
                                    <span>Unlocks: <strong>{unlocks.join(', ')}</strong></span>
                                  </div>
                                )}
                              </div>

                              {/* Status Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                                {isPassed && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--passed-text)'
                                  }}>
                                    <CheckCircle2 size={14} />
                                    <span>{statusInfo.record.points.toFixed(2)} ({statusInfo.record.grade})</span>
                                  </div>
                                )}

                                {isZeroFailed && (
                                  <div className="zero-alert">
                                    <XCircle size={12} />
                                    <span>0.00 - NOT CROSSED</span>
                                  </div>
                                )}

                                {!isPassed && !isZeroFailed && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Pending
                                  </span>
                                )}

                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {course.codeCell}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Detail Modal */}
      {activeCourseModal && (
        <div className="modal-overlay" onClick={() => setActiveCourseModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="code-pill" style={{ fontSize: '1rem' }}>
                  {activeCourseModal.course.code}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Level {activeCourseModal.course.level} • {activeCourseModal.course.ch} Credit Hours
                </span>
              </div>
              <button
                onClick={() => setActiveCourseModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              {activeCourseModal.course.name}
            </h2>

            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Excel Template Mapping:
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <div>Code Cell: <strong style={{ color: 'var(--text-primary)' }}>{activeCourseModal.course.codeCell}</strong></div>
                <div>Credit Cell: <strong style={{ color: 'var(--text-primary)' }}>{activeCourseModal.course.chCell}</strong></div>
                <div>Title Range: <strong style={{ color: 'var(--text-primary)' }}>{activeCourseModal.course.mergeRange || activeCourseModal.course.titleCell}</strong></div>
              </div>
            </div>

            {/* Student Attempts */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Transcript Records ({activeCourseModal.statusInfo.record?.attempts?.length || 0} attempt)
              </h3>

              {activeCourseModal.statusInfo.record ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {activeCourseModal.statusInfo.record.attempts.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: att.points > 0 ? 'var(--passed-bg)' : 'var(--failed-bg)',
                        border: `1px solid ${att.points > 0 ? 'var(--passed-border)' : 'var(--failed-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          Attempt #{idx + 1} - Grade: {att.grade}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Points: {att.points.toFixed(2)} | Credits: {att.credit}
                        </div>
                      </div>

                      <div>
                        {att.points > 0 ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--passed-text)' }}>
                            PASSED (Crossed Out on Sheet)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--failed-text)' }}>
                            0.00 VALUE (Kept Uncrossed)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No record for this course in the uploaded transcript.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
