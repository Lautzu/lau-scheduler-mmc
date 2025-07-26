// Schedule history and persistence utilities - Browser version
// Following CLAUDE.md C-4: Simple, composable functions

/**
 * Save schedule to local storage
 * @param {string} name
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {Object} metadata
 * @returns {boolean}
 */
function saveSchedule(name, schedule, employees, metadata = {}) {
  try {
    const scheduleData = {
      name,
      schedule,
      employees,
      metadata: {
        ...metadata,
        savedAt: new Date().toISOString(),
        version: "1.0",
      },
    };

    const savedSchedules = getSavedSchedules();
    savedSchedules[name] = scheduleData;

    localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));
    return true;
  } catch (error) {
    console.error("Failed to save schedule:", error);
    return false;
  }
}

/**
 * Load schedule from local storage
 * @param {string} name
 * @returns {Object|null}
 */
function loadSchedule(name) {
  try {
    const savedSchedules = getSavedSchedules();
    return savedSchedules[name] || null;
  } catch (error) {
    console.error("Failed to load schedule:", error);
    return null;
  }
}

/**
 * Get all saved schedules
 * @returns {Object}
 */
function getSavedSchedules() {
  try {
    const saved = localStorage.getItem("savedSchedules");
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Failed to get saved schedules:", error);
    return {};
  }
}

/**
 * Delete saved schedule
 * @param {string} name
 * @returns {boolean}
 */
function deleteSchedule(name) {
  try {
    const savedSchedules = getSavedSchedules();
    delete savedSchedules[name];
    localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));
    return true;
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return false;
  }
}

/**
 * Get list of saved schedule names
 * @returns {string[]}
 */
function getScheduleNames() {
  const savedSchedules = getSavedSchedules();
  return Object.keys(savedSchedules).sort();
}

/**
 * Export schedule data
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {string}
 */
function exportScheduleData(schedule, employees) {
  const exportData = {
    schedule,
    employees,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import schedule data
 * @param {string} jsonData
 * @returns {{schedule: Object, employees: Employee[]}|null}
 */
function importScheduleData(jsonData) {
  try {
    const data = JSON.parse(jsonData);

    if (!data.schedule || !data.employees) {
      throw new Error("Invalid schedule data format");
    }

    return {
      schedule: data.schedule,
      employees: data.employees,
    };
  } catch (error) {
    console.error("Failed to import schedule data:", error);
    return null;
  }
}

/**
 * Create backup of current data
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {boolean}
 */
function createBackup(schedule, employees) {
  const backupName = `backup_${new Date().toISOString().split("T")[0]}_${Date.now()}`;
  return saveSchedule(backupName, schedule, employees, { isBackup: true });
}

/**
 * Get backup schedules
 * @returns {string[]}
 */
function getBackupNames() {
  const savedSchedules = getSavedSchedules();
  return Object.keys(savedSchedules)
    .filter((name) => savedSchedules[name].metadata?.isBackup)
    .sort()
    .reverse(); // Most recent first
}

/**
 * Clean old backups (keep only last 10)
 * @returns {number} Number of backups cleaned
 */
function cleanOldBackups() {
  const backupNames = getBackupNames();
  let cleaned = 0;

  if (backupNames.length > 10) {
    const toDelete = backupNames.slice(10);
    toDelete.forEach((name) => {
      if (deleteSchedule(name)) {
        cleaned++;
      }
    });
  }

  return cleaned;
}
