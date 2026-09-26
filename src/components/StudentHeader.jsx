import React from 'react';
import { User, Award, AlertTriangle, CheckCircle2, XCircle, BookOpen, Clock, CheckSquare, ShieldCheck, ShieldAlert } from 'lucide-react';
import { getRegistrationLimit } from '../services/courseMapping.js';

export default function StudentHeader({ student }) {
  if (!student) return null;

  const aiLevel = student.aiLevel ?? Math.max(1, student.allSemesterTables?.length ?? 0);
  const aiLevelSuffix = aiLevel % 100 >= 11 && aiLevel % 100 <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[aiLevel % 10] || 'th');

  const getCgpaColor = (gpa) => {
    if (gpa === null || gpa === undefined) return 'text-gray-400';
    if (gpa >= 3.0) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (gpa >= 2.0) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    if (gpa >= 1.0) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const isAtRisk = student.cgpa !== null && student.cgpa < 2.0;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        {/* Left: Student Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
          }}>
            <User size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {student.studentName}
              </h1>
              {student.studentId && (
                <span className="code-pill">
                  ID: {student.studentId}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <span>Program: <strong style={{ color: 'var(--text-primary)' }}>{student.program || 'Artificial Intelligence'}</strong></span>
              <span>• <strong style={{ color: 'var(--text-primary)' }}>{aiLevel}{aiLevelSuffix} AI Level</strong></span>
              {student.admissionYear && (
                <span>• Admission: <strong style={{ color: 'var(--text-primary)' }}>{student.admissionYear}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Right: CGPA Gauge & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* CGPA Card */}
          <div style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <Award size={24} style={{ color: student.cgpa >= 2.0 ? '#10b981' : '#f43f5e' }} />
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Cumulative GPA
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {student.cgpa !== null ? student.cgpa.toFixed(2) : 'N/A'}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> / 4.00</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Passed */}
            <div style={{
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              background: 'var(--passed-bg)',
              border: '1px solid var(--passed-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <CheckCircle2 size={18} style={{ color: 'var(--passed-text)' }} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--passed-text)', lineHeight: 1 }}>
                  {student.passedCount}
                </div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Passed (Crossed)
                </div>
              </div>
            </div>

            {/* Failed / 0.00 */}
            <div style={{
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              background: 'var(--failed-bg)',
              border: '1px solid var(--failed-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <XCircle size={18} style={{ color: 'var(--failed-text)' }} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--failed-text)', lineHeight: 1 }}>
                  {student.failedCount}
                </div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  0.00 (Uncrossed)
                </div>
              </div>
            </div>

            {/* Newly Selected Checkpoint Subjects */}
            {student.selectedCourseCodes && student.selectedCourseCodes.length > 0 && (
              <div style={{
                padding: '0.6rem 1rem',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <CheckSquare size={18} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', lineHeight: 1 }}>
                    {student.selectedCourseCodes.length}
                  </div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>
                    Checkpointed
                  </div>
                </div>
              </div>
            )}

            {/* Achieved Credit Hours */}
            <div style={{
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <BookOpen size={18} style={{ color: '#06b6d4' }} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {student.achievedHours ?? 27}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {student.registeredHours ?? 45}</span>
                </div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Credit Hours
                </div>
              </div>
            </div>

            {/* GPA Registration Subject Limit */}
            {(() => {
              const regLimit = getRegistrationLimit(student);
              const isWarning = regLimit.maxCourses < 6;
              return (
                <div
                  title={regLimit.ruleText}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    background: regLimit.tier === 'strict_warning'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : regLimit.tier === 'academic_warning'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(16, 185, 129, 0.12)',
                    border: `1px solid ${regLimit.tier === 'strict_warning' ? 'rgba(239, 68, 68, 0.35)' : regLimit.tier === 'academic_warning' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  {isWarning ? (
                    <ShieldAlert size={18} style={{ color: regLimit.tier === 'strict_warning' ? '#f43f5e' : '#f59e0b' }} />
                  ) : (
                    <ShieldCheck size={18} style={{ color: '#10b981' }} />
                  )}
                  <div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: regLimit.tier === 'strict_warning' ? '#f43f5e' : regLimit.tier === 'academic_warning' ? '#f59e0b' : '#10b981',
                      lineHeight: 1
                    }}>
                      {regLimit.maxCourses} Subjects
                    </div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Registration Limit
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Extracted Semester GPAs from Transcript Tables */}
      {student.regularSemesters && student.regularSemesters.length > 0 && (
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Transcript Semester GPAs:
            </span>
            {student.levelGpas.map((sem, idx) => (
              <div
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{sem.academicYear} {sem.semesterName}:</span>
                <strong style={{
                  fontFamily: 'var(--font-mono)',
                  color: sem.gpa >= 2.0 ? '#10b981' : sem.gpa >= 1.0 ? '#818cf8' : '#f43f5e'
                }}>
                  {sem.gpa.toFixed(2)}
                </strong>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ({sem.gpaCell})
                </span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontSize: '0.72rem',
            fontWeight: 600
          }}>
            <span>Summer GPA Excluded (Not Considered)</span>
          </div>
        </div>
      )}

      {isAtRisk && (
        <div style={{
          marginTop: '1rem',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem',
          color: '#fb7185'
        }}>
          <AlertTriangle size={16} />
          <span>
            <strong>Academic Warning Notice:</strong> CGPA ({student.cgpa.toFixed(2)}) is below 2.00. 
            <strong> {student.failedCount} courses</strong> with 0.00 value remain uncrossed and must be retaken for degree completion.
          </span>
        </div>
      )}
    </div>
  );
}
