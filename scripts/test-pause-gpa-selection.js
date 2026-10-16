import { getRegistrationLimit, autoAssignEligibleCourses } from '../src/services/courseMapping.js';

console.log('--- Testing Pause GPA Limit & Unlock 6 Subjects ---');

// Test 1: Student with low semester GPA (< 1.7)
const studentStrictWarning = {
  studentName: 'Student Strict Warning',
  studentId: '20220001',
  cgpa: 2.2,
  latestSemesterGpa: 1.45,
  program: 'AI',
  courseMap: {},
  unlockGpaLimit: false
};

const limitNormal = getRegistrationLimit(studentStrictWarning);
console.log('Normal limit for studentStrictWarning:', limitNormal.maxCourses, '(Expected: 4)');
if (limitNormal.maxCourses !== 4) {
  throw new Error(`Expected natural limit 4, got ${limitNormal.maxCourses}`);
}

// Now unlock GPA limit for studentStrictWarning
studentStrictWarning.unlockGpaLimit = true;
const limitUnlocked = getRegistrationLimit(studentStrictWarning);
console.log('Unlocked limit for studentStrictWarning:', limitUnlocked.maxCourses, '(Expected: 6)');
if (limitUnlocked.maxCourses !== 6 || !limitUnlocked.isOverridden) {
  throw new Error(`Expected unlocked limit 6 with isOverridden=true, got ${limitUnlocked.maxCourses}`);
}
if (limitUnlocked.naturalLimit !== 4) {
  throw new Error(`Expected naturalLimit 4 to be preserved, got ${limitUnlocked.naturalLimit}`);
}

// Test 2: Student with Academic Warning (CGPA < 2.0)
const studentAcademicWarning = {
  studentName: 'Student Academic Warning',
  studentId: '20220002',
  cgpa: 1.85,
  latestSemesterGpa: 2.10,
  program: 'AI',
  courseMap: {},
  unlockGpaLimit: false
};

const limitAcadNormal = getRegistrationLimit(studentAcademicWarning);
console.log('Normal limit for studentAcademicWarning:', limitAcadNormal.maxCourses, '(Expected: 5)');
if (limitAcadNormal.maxCourses !== 5) {
  throw new Error(`Expected natural limit 5, got ${limitAcadNormal.maxCourses}`);
}

studentAcademicWarning.unlockGpaLimit = true;
const limitAcadUnlocked = getRegistrationLimit(studentAcademicWarning);
console.log('Unlocked limit for studentAcademicWarning:', limitAcadUnlocked.maxCourses, '(Expected: 6)');
if (limitAcadUnlocked.maxCourses !== 6 || !limitAcadUnlocked.isOverridden) {
  throw new Error(`Expected unlocked limit 6, got ${limitAcadUnlocked.maxCourses}`);
}
if (limitAcadUnlocked.naturalLimit !== 5) {
  throw new Error(`Expected naturalLimit 5 to be preserved, got ${limitAcadUnlocked.naturalLimit}`);
}

// Test 3: Verify per-student isolation
studentStrictWarning.unlockGpaLimit = true;
studentAcademicWarning.unlockGpaLimit = false;

if (getRegistrationLimit(studentStrictWarning).maxCourses !== 6) {
  throw new Error('Student 1 should be 6');
}
if (getRegistrationLimit(studentAcademicWarning).maxCourses !== 5) {
  throw new Error('Student 2 should be 5 (not affected by Student 1)');
}
console.log('✓ Per-student isolation verified: Student 1 has 6, Student 2 has 5 independently.');

// Test 4: autoAssignEligibleCourses respects unlockGpaLimit
const assignResultLocked = autoAssignEligibleCourses(studentAcademicWarning);
console.log('autoAssignEligibleCourses locked limit:', assignResultLocked.limit, '(Expected: 5)');
if (assignResultLocked.limit !== 5) {
  throw new Error(`Expected autoAssign limit 5, got ${assignResultLocked.limit}`);
}

studentAcademicWarning.unlockGpaLimit = true;
const assignResultUnlocked = autoAssignEligibleCourses(studentAcademicWarning);
console.log('autoAssignEligibleCourses unlocked limit:', assignResultUnlocked.limit, '(Expected: 6)');
if (assignResultUnlocked.limit !== 6) {
  throw new Error(`Expected autoAssign limit 6, got ${assignResultUnlocked.limit}`);
}

console.log('✓ All tests passed successfully!');
