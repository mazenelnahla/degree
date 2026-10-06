import React from 'react';
import { User, CheckCircle2, XCircle, UserPlus } from 'lucide-react';

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
        return (
          <button
            key={idx}
            onClick={() => onSelectTab(idx)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1rem',
              whiteSpace: 'nowrap',
              border: isActive ? '1px solid var(--border-focus)' : '1px solid var(--border-color)',
              background: isActive ? 'var(--bg-secondary)' : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <User size={15} style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }} />
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
