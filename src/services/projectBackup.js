/**
 * Degree Project Backup & Restore Service
 * Saves entire state (students, selected courses, prerequisite links, roster mapping, template info)
 * into a single JSON file (.degree.json) that can be reloaded at any time.
 */

export function exportProjectBackup({
  students = [],
  prerequisiteLinks = [],
  rosterInfo = null,
  rosterMap = null,
  templateName = 'template.xlsx'
}) {
  const rosterEntries = rosterMap instanceof Map ? Array.from(rosterMap.entries()) : [];

  const backupData = {
    version: '1.0',
    app: 'Transcript Degree Crosser',
    exportedAt: new Date().toISOString(),
    templateName,
    rosterInfo,
    rosterEntries,
    prerequisiteLinks,
    students
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Generate filename with date
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `Degree_Project_Backup_${students.length}_Students_${dateStr}_${timeStr}.degree.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Validates and restores project state from a loaded JSON file
 * @param {string|File} fileOrText
 * @returns {Promise<Object>} Restored project state
 */
export async function parseProjectBackup(fileOrText) {
  let text = '';
  if (typeof fileOrText === 'string') {
    text = fileOrText;
  } else if (fileOrText && typeof fileOrText.text === 'function') {
    text = await fileOrText.text();
  } else {
    throw new Error('Invalid project file format.');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error('Failed to parse file: Invalid JSON format.');
  }

  if (!data || (!data.students && !Array.isArray(data))) {
    throw new Error('Invalid Degree backup file. Expected "students" array.');
  }

  // Handle either direct array or full backup object
  const students = Array.isArray(data) ? data : (data.students || []);
  const prerequisiteLinks = data.prerequisiteLinks || null;
  const templateName = data.templateName || 'template.xlsx';
  const rosterInfo = data.rosterInfo || null;
  let rosterMap = null;

  if (Array.isArray(data.rosterEntries)) {
    rosterMap = new Map(data.rosterEntries);
  }

  return {
    version: data.version || '1.0',
    exportedAt: data.exportedAt,
    students,
    prerequisiteLinks,
    templateName,
    rosterInfo,
    rosterMap
  };
}
