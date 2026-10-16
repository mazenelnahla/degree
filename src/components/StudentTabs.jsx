import React from 'react';
import { User, CheckCircle2, XCircle, UserPlus, Zap, Unlock } from 'lucide-react';
import { normalizeProgramId } from '../services/courseMapping.js';

export default function StudentTabs({ students, activeIndex, onSelectTab, onOpenAddStudent }) {
  if (!students || students.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem',
      marginBottom: '1rem'
    }}>
      {students.map((student, idx) => {
        const isActive = idx === activeIndex;
        const isEep = normalizeProgramId(student.program) === 'EEP';

        return (
          <button
            key={idx}
            onClick={() => onSelectTab(idx)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1rem',
              whiteSpace: 'nowrap',
              border: isActive
                ? (isEep ? '1px solid #d97706' : '1px solid var(--border-focus)')
                : '1px solid var(--border-color)',
              background: isActive
                ? (isEep ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-secondary)')
                : 'transparent'
            }}
          >
            {isEep ? (
              <Zap size={14} style={{ color: '#d97706' }} />
            ) : (
              <User size={14} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
            )}

            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '0.08rem 0.35rem',
              borderRadius: '4px',
              background: isEep ? 'rgba(217, 119, 6, 0.15)' : 'rgba(37, 99, 235, 0.15)',
              color: isEep ? '#d97706' : '#2563eb',
              letterSpacing: '0.02em'
            }}>
              {isEep ? 'EEP' : 'AI'}
            </span>

            <span style={{ fontWeight: isActive ? 700 : 500 }}>
              {student.studentName || `Student ${idx + 1}`}
            </span>

            {/* Quick mini indicators */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.7rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              background: 'var(--passed-bg)',
              color: 'var(--passed-text)',
              marginLeft: '0.25rem'
            }}>
              {student.passedCount}✓
            </span>

            {student.failedCount > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                background: 'var(--failed-bg)',
                color: 'var(--failed-text)'
              }}>
                {student.failedCount}✗
              </span>
            )}

            {student.selectedCourseCodes && student.selectedCourseCodes.length > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontWeight: 700
              }}>
                {student.selectedCourseCodes.length}★
              </span>
            )}

            {student.unlockGpaLimit && (
              <span
                title="GPA Limit Paused (6 Subjects Unlocked)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.15rem',
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '9999px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontWeight: 700
                }}
              >
                <Unlock size={10} />
                <span>6</span>
              </span>
            )}
          </button>
        );
      })}

      {/* Add Student Button in Tabs */}
      {onOpenAddStudent && (
        <button
          type="button"
          onClick={onOpenAddStudent}
          className="tab-btn"
          style={{
            padding: '0.5rem 0.9rem',
            whiteSpace: 'nowrap',
            border: '1px dashed rgba(99, 102, 241, 0.4)',
            background: 'rgba(99, 102, 241, 0.08)',
            color: '#818cf8',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
          title="Add a new student manually without a transcript"
        >
          <UserPlus size={15} />
          <span>+ Add Student</span>
        </button>
      )}
    </div>
  );
}
