import React, { useState } from 'react';
import { DEGREE_STRUCTURE, ALL_COURSES, PREREQUISITE_LINKS, normalizeCode, getCourseRequires, getCourseUnlocks, checkPrerequisitesMet, getRegistrationLimit } from '../services/courseMapping.js';
import { CheckCircle2, XCircle, Search, Filter, Info, ChevronRight, X, ArrowRight, CornerDownRight, GitFork, CheckSquare, Square, Check, RefreshCw, Edit3, Plus, Trash2, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DegreeGrid({
  student,
  prerequisiteLinks = PREREQUISITE_LINKS,
  onOpenPrereqModal,
  onSavePrerequisites,
  onResetPrerequisites,
  onToggleCourseSelection,
  onSelectAllFailed,
  onSelectAllPending,
  onClearSelected
}) {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, selected, passed, failed, not_taken
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCourseModal, setActiveCourseModal] = useState(null);
  const [hoveredCode, setHoveredCode] = useState(null);
  const [inlinePrereqToAdd, setInlinePrereqToAdd] = useState('');

  if (!student) return null;

  const selectedCodesSet = new Set((student.selectedCourseCodes || []).map(normalizeCode));
  const regLimit = getRegistrationLimit(student);
  const isLimitReached = selectedCodesSet.size >= regLimit.maxCourses;

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

    const isSelected = selectedCodesSet.has(norm) || (course.aliases && course.aliases.some(a => selectedCodesSet.has(normalizeCode(a))));

    if (!record) {
      return { status: 'not_taken', label: 'Not Taken', record: null, isSelected };
    }
    if (record.isPassed && record.points > 0.00) {
      return { status: 'passed', label: 'Passed & Crossed', record, isSelected: false };
    }
    if (record.points === 0.00) {
      return { status: 'failed_zero', label: '0.00 (NOT Crossed)', record, isSelected };
    }
    return { status: 'other', label: record.grade, record, isSelected };
  };

  const handleCardCheckboxClick = (e, courseCode, isPassed) => {
    e.stopPropagation();
    if (isPassed) return;
    if (onToggleCourseSelection) {
      onToggleCourseSelection(courseCode);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Controls Bar: Filters, Quick Select Actions, and Search */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
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
                <option value="selected">★ Selected Checkpoints ({student.selectedCourseCodes?.length || 0})</option>
                <option value="failed_zero">0.00 Failed (Eligible for Checkpoint)</option>
                <option value="not_taken">Pending / Not Taken (Eligible)</option>
                <option value="passed">Passed (Crossed Out)</option>
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

        {/* Quick Selection Action Bar */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckSquare size={15} style={{ color: '#10b981' }} />
              <span>Select Courses to Register:</span>
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSelectAllFailed}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#fb7185' }}
              title="Select all failed courses with 0.00 points for registration"
            >
              + Select All Failed ({student.failedCount})
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSelectAllPending}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '8px' }}
              title="Select remaining unattempted curriculum courses"
            >
              + Select All Pending
            </button>

            {student.selectedCourseCodes && student.selectedCourseCodes.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClearSelected}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '8px', color: 'var(--text-muted)' }}
              >
                Clear Selections ({student.selectedCourseCodes.length})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Selected: <strong style={{ color: selectedCodesSet.size >= regLimit.maxCourses ? '#f59e0b' : selectedCodesSet.size > 0 ? '#10b981' : 'var(--text-muted)' }}>
                {selectedCodesSet.size} / {regLimit.maxCourses}
              </strong> subjects allowed
            </span>

            <span style={{
              fontSize: '0.72rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '6px',
              background: regLimit.tier === 'strict_warning'
                ? 'rgba(239, 68, 68, 0.15)'
                : regLimit.tier === 'academic_warning'
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(16, 185, 129, 0.15)',
              color: regLimit.tier === 'strict_warning'
                ? '#f87171'
                : regLimit.tier === 'academic_warning'
                ? '#fbbf24'
                : '#34d399',
              border: `1px solid ${regLimit.tier === 'strict_warning' ? 'rgba(239, 68, 68, 0.3)' : regLimit.tier === 'academic_warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontWeight: 600
            }}>
              Max {regLimit.maxCourses}
            </span>
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
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rules &amp; Legend:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }}></span>
              <span><strong>Passed:</strong> Crossed out</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }}></span>
              <span><strong>0.00 Failed:</strong> Red Alert (Click checkbox to select)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></span>
              <span><strong>Selected Checkpoint:</strong> Green Highlight &amp; [✓] in Excel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={13} style={{ color: '#f59e0b' }} />
              <span><strong>Locked:</strong> Prerequisite not passed</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenPrereqModal && onOpenPrereqModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#818cf8',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to view and edit course prerequisite connections"
          >
            <GitFork size={14} />
            <span>{prerequisiteLinks.length} Prerequisite Links (Click to Edit)</span>
            <Edit3 size={13} style={{ opacity: 0.8 }} />
          </button>
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
                      if (statusFilter === 'selected' && !statusInfo.isSelected) return false;
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
                        gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
                        gap: '1rem'
                      }}>
                        {visibleCourses.map((course) => {
                          const statusInfo = getCourseStatus(course);
                          const isPassed = statusInfo.status === 'passed';
                          const isZeroFailed = statusInfo.status === 'failed_zero';
                          const isSelected = statusInfo.isSelected;
                          
                          const norm = normalizeCode(course.code);
                          const isHovered = hoveredCode === norm;
                          const requires = prerequisiteLinks.filter(l => normalizeCode(l.to) === norm).map(l => l.from);
                          const unlocks = prerequisiteLinks.filter(l => normalizeCode(l.from) === norm).map(l => l.to);
                          const isConnected = hoveredCode && (
                            requires.some(r => normalizeCode(r) === hoveredCode) ||
                            unlocks.some(u => normalizeCode(u) === hoveredCode)
                          );

                          // Check whether all prerequisites are met
                          const prereqStatus = checkPrerequisitesMet(course.code, student.courseMap, prerequisiteLinks);
                          const isPrereqBlocked = !isPassed && !isSelected && !prereqStatus.canTake;
                          const isLimitBlocked = !isPassed && !isSelected && isLimitReached;

                          return (
                            <div
                              key={course.code}
                              className={`course-card ${isPassed ? 'passed' : ''} ${isZeroFailed ? 'failed-zero' : ''} ${isSelected ? 'selected-checkpoint' : ''} ${isPrereqBlocked ? 'prereq-blocked' : ''}`}
                              onClick={() => setActiveCourseModal({ course, statusInfo, requires, unlocks, prereqStatus, isLimitBlocked, regLimit })}
                              onMouseEnter={() => setHoveredCode(norm)}
                              onMouseLeave={() => setHoveredCode(null)}
                              style={{
                                cursor: 'pointer',
                                outline: isHovered ? '2px solid #6366f1' : isConnected ? '2px dashed #06b6d4' : 'none',
                                transform: isHovered ? 'translateY(-3px)' : 'none',
                                transition: 'all 0.2s ease',
                                opacity: isPrereqBlocked || (isLimitBlocked && !isSelected) ? 0.72 : 1
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {/* Selection Checkbox for Failed or Pending Courses */}
                                    {!isPassed && (
                                      isPrereqBlocked ? (
                                        <div
                                          className="course-checkbox-btn disabled-lock"
                                          title={`Cannot select: Prerequisite(s) not passed (${prereqStatus.missingPrereqs.join(', ')})`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            alert(`Cannot check ${course.code}: You must first pass its prerequisite(s): ${prereqStatus.missingPrereqs.join(', ')}`);
                                          }}
                                          style={{ cursor: 'not-allowed', color: '#f59e0b', padding: '2px' }}
                                        >
                                          <Lock size={15} />
                                        </div>
                                      ) : isLimitBlocked ? (
                                        <div
                                          className="course-checkbox-btn disabled-lock"
                                          title={`Registration limit reached (${regLimit.maxCourses} subjects). ${regLimit.ruleText}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            alert(`Cannot check ${course.code}: Maximum registration limit reached (${regLimit.maxCourses} subjects). ${regLimit.ruleText}`);
                                          }}
                                          style={{ cursor: 'not-allowed', color: 'var(--text-muted)', padding: '2px' }}
                                        >
                                          <ShieldAlert size={15} />
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          className="course-checkbox-btn"
                                          onClick={(e) => handleCardCheckboxClick(e, course.code, isPassed)}
                                          title={isSelected ? 'Remove from registration checkpoint' : 'Select course for registration checkpoint'}
                                          style={{ color: isSelected ? '#10b981' : isZeroFailed ? '#ef4444' : 'var(--text-muted)' }}
                                        >
                                          {isSelected ? (
                                            <CheckSquare size={17} style={{ fill: 'rgba(16, 185, 129, 0.2)' }} />
                                          ) : (
                                            <Square size={17} />
                                          )}
                                        </button>
                                      )
                                    )}

                                    <span className="course-code" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>
                                      {course.code}
                                    </span>
                                  </div>

                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {course.ch} CH
                                  </span>
                                </div>

                                <div className="course-name" style={{ fontSize: '0.825rem', lineHeight: 1.3, marginBottom: '0.4rem' }}>
                                  {course.name}
                                </div>

                                {/* Prerequisite Links & Arrows indicator */}
                                {requires.length > 0 && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.68rem',
                                    color: isPrereqBlocked ? '#f59e0b' : 'var(--text-muted)',
                                    marginBottom: '0.35rem'
                                  }}>
                                    {isPrereqBlocked ? <Lock size={11} style={{ color: '#f59e0b' }} /> : <CornerDownRight size={11} style={{ color: '#818cf8' }} />}
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
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', gap: '0.5rem', flexWrap: 'wrap' }}>
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

                                {isSelected && (
                                  <div className="checkpoint-badge">
                                    <Check size={12} strokeWidth={3} />
                                    <span>Checkpointed</span>
                                  </div>
                                )}

                                {!isSelected && isZeroFailed && (
                                  <div className="zero-alert">
                                    <XCircle size={12} />
                                    <span>0.00 - NOT CROSSED</span>
                                  </div>
                                )}

                                {!isPassed && !isSelected && !isZeroFailed && (
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

            {/* Checkpoint Selection toggle button inside modal */}
            {activeCourseModal.statusInfo.status !== 'passed' && (
              (() => {
                const isSelected = selectedCodesSet.has(normalizeCode(activeCourseModal.course.code));
                const prereqStatus = checkPrerequisitesMet(activeCourseModal.course.code, student.courseMap, prerequisiteLinks);
                const isPrereqBlocked = !isSelected && !prereqStatus.canTake;
                const isLimitBlocked = !isSelected && isLimitReached;
                const isBlocked = isPrereqBlocked || isLimitBlocked;

                return (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: isSelected
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isBlocked
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'var(--bg-secondary)',
                    border: isSelected
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isBlocked
                      ? '1px solid rgba(245, 158, 11, 0.35)'
                      : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: isSelected ? '#10b981' : isBlocked ? '#f59e0b' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        {isPrereqBlocked && <Lock size={15} />}
                        {!isPrereqBlocked && isLimitBlocked && <ShieldAlert size={15} />}
                        <span>
                          {isSelected
                            ? '✓ Checkpointed for Excel Sheet'
                            : isPrereqBlocked
                            ? 'Cannot Check Course: Prerequisite(s) Missing'
                            : isLimitBlocked
                            ? `Cannot Check Course: Limit Reached (${regLimit.maxCourses} Subjects Max)`
                            : 'Select for Registration Checkpoint'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: isBlocked ? '#fbbf24' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {isPrereqBlocked
                          ? `You must pass prerequisite course(s) first: ${prereqStatus.missingPrereqs.join(', ')}`
                          : isLimitBlocked
                          ? regLimit.ruleText
                          : 'Export into Excel with bold text, green highlight & [✓] checkpoint'}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBlocked}
                      className={isSelected ? 'btn btn-success' : isBlocked ? 'btn btn-secondary' : 'btn btn-primary'}
                      onClick={() => onToggleCourseSelection && onToggleCourseSelection(activeCourseModal.course.code)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.9rem',
                        opacity: isBlocked ? 0.6 : 1,
                        cursor: isBlocked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSelected ? (
                        <>
                          <CheckSquare size={15} />
                          <span>Selected (Remove)</span>
                        </>
                      ) : isPrereqBlocked ? (
                        <>
                          <Lock size={15} />
                          <span>Prereqs Not Passed</span>
                        </>
                      ) : isLimitBlocked ? (
                        <>
                          <ShieldAlert size={15} />
                          <span>Limit Reached ({regLimit.maxCourses})</span>
                        </>
                      ) : (
                        <>
                          <Square size={15} />
                          <span>Select Subject</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()
            )}

            {/* Prerequisites Section in Course Detail Modal with Direct Inline Editing */}
            <div style={{
              padding: '1.1rem',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <GitFork size={17} style={{ color: '#818cf8' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Curriculum Prerequisites
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const code = activeCourseModal.course.code;
                    setActiveCourseModal(null);
                    if (onOpenPrereqModal) {
                      onOpenPrereqModal(code);
                    }
                  }}
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit3 size={13} />
                  <span>Open Full Manager</span>
                </button>
              </div>

              {/* Requires with direct inline delete and add */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CornerDownRight size={13} style={{ color: '#818cf8' }} />
                  <span>Required to take <strong>{activeCourseModal.course.code}</strong>:</span>
                </div>
                {(() => {
                  const currentNorm = normalizeCode(activeCourseModal.course.code);
                  const reqs = prerequisiteLinks.filter(l => normalizeCode(l.to) === currentNorm).map(l => l.from);
                  
                  return (
                    <div>
                      {reqs.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '0.5rem', marginBottom: '0.6rem' }}>
                          None (Can be registered directly)
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.65rem' }}>
                          {reqs.map(r => (
                            <span
                              key={r}
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: '#818cf8',
                                background: 'rgba(99, 102, 241, 0.12)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(99, 102, 241, 0.28)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <span>{r}</span>
                              <button
                                type="button"
                                title={`Remove ${r} as prerequisite`}
                                onClick={() => {
                                  if (onSavePrerequisites) {
                                    const rNorm = normalizeCode(r);
                                    const updated = prerequisiteLinks.filter(l => !(normalizeCode(l.from) === rNorm && normalizeCode(l.to) === currentNorm));
                                    onSavePrerequisites(updated);
                                  }
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '1px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Inline Add Prerequisite Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={inlinePrereqToAdd}
                          onChange={e => setInlinePrereqToAdd(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.4rem 0.65rem',
                            borderRadius: '8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <option value="">+ Add Prerequisite to {activeCourseModal.course.code}...</option>
                          {(() => {
                            const existingNorms = new Set(reqs.map(normalizeCode));
                            return ALL_COURSES
                              .filter(c => normalizeCode(c.code) !== currentNorm && !existingNorms.has(normalizeCode(c.code)))
                              .map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.code} — {c.name} (L{c.level})
                                </option>
                              ));
                          })()}
                        </select>

                        <button
                          type="button"
                          disabled={!inlinePrereqToAdd}
                          onClick={() => {
                            if (!inlinePrereqToAdd) return;
                            const exists = prerequisiteLinks.some(l => 
                              normalizeCode(l.from) === normalizeCode(inlinePrereqToAdd) && 
                              normalizeCode(l.to) === currentNorm
                            );
                            if (!exists && onSavePrerequisites) {
                              const updated = [...prerequisiteLinks, { from: inlinePrereqToAdd, to: activeCourseModal.course.code }];
                              onSavePrerequisites(updated);
                            }
                            setInlinePrereqToAdd('');
                          }}
                          className="btn btn-primary"
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.4rem 0.75rem',
                            opacity: inlinePrereqToAdd ? 1 : 0.5,
                            cursor: inlinePrereqToAdd ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Unlocks with direct delete option */}
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowRight size={13} style={{ color: '#06b6d4' }} />
                  <span>Unlocks subsequent subjects:</span>
                </div>
                {(() => {
                  const currentNorm = normalizeCode(activeCourseModal.course.code);
                  const unls = prerequisiteLinks.filter(l => normalizeCode(l.from) === currentNorm).map(l => l.to);
                  if (unls.length === 0) {
                    return (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                        None
                      </span>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {unls.map(u => (
                        <span
                          key={u}
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: '#06b6d4',
                            background: 'rgba(6, 182, 212, 0.1)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(6, 182, 212, 0.28)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <span>{u}</span>
                          <button
                            type="button"
                            title={`Remove unlock link to ${u}`}
                            onClick={() => {
                              if (onSavePrerequisites) {
                                const uNorm = normalizeCode(u);
                                const updated = prerequisiteLinks.filter(l => !(normalizeCode(l.from) === currentNorm && normalizeCode(l.to) === uNorm));
                                onSavePrerequisites(updated);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '1px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

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
