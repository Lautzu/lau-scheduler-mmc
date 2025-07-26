// Schedule History Management Module
// Following CLAUDE.md best practices for state management

// ==================== Schedule History Management ==================== //

function populateSavedSchedules() {
  const savedSchedules = getSavedSchedulesFromStorage();
  const select = document.getElementById("savedSchedules");
  select.innerHTML = '<option value="">-- Select a saved schedule --</option>';

  sortSchedulesByDate(savedSchedules);

  savedSchedules.forEach((state) => {
    const option = createScheduleOption(state);
    select.appendChild(option);
  });
}

function getSavedSchedulesFromStorage() {
  return JSON.parse(localStorage.getItem("savedSchedules")) || [];
}

function sortSchedulesByDate(schedules) {
  schedules.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function createScheduleOption(state) {
  const option = document.createElement("option");
  option.value = state.name;
  option.textContent = `${state.name} (Saved: ${new Date(state.timestamp).toLocaleString()})`;
  return option;
}

function saveScheduleState() {
  const name = promptForScheduleName();
  if (!name) return;

  const savedSchedules = getSavedSchedulesFromStorage();

  if (checkForDuplicateName(savedSchedules, name)) {
    if (!confirmOverwrite(name)) return;
  }

  const scheduleState = createScheduleState(name);
  const updatedSchedules = updateSchedulesList(savedSchedules, scheduleState);

  saveSchedulesToStorage(updatedSchedules);
  populateSavedSchedules();
  showAlert(`Schedule state "${name}" saved successfully!`, "success");
}

function promptForScheduleName() {
  return prompt(
    "Enter a name for this schedule state:",
    `Schedule ${new Date().toLocaleDateString()}`,
  );
}

function checkForDuplicateName(schedules, name) {
  return schedules.some((s) => s.name === name);
}

function confirmOverwrite(name) {
  return confirm(
    `A schedule with the name "${name}" already exists. Overwrite it?`,
  );
}

function createScheduleState(name) {
  return {
    name: name,
    timestamp: new Date().toISOString(),
    scheduleData: appState.schedule,
    leaveData: appState.leaveRequests,
    startDate: document.getElementById("scheduleStart").value,
    employeeData: appState.employees,
  };
}

function updateSchedulesList(schedules, newState) {
  const filteredSchedules = schedules.filter((s) => s.name !== newState.name);
  filteredSchedules.push(newState);
  return filteredSchedules;
}

function saveSchedulesToStorage(schedules) {
  localStorage.setItem("savedSchedules", JSON.stringify(schedules));
}

function loadSelectedSchedule() {
  const scheduleName = getSelectedScheduleName();
  if (!scheduleName) {
    showAlert("Please select a schedule to load from the history.", "warning");
    return;
  }

  showSpinner();
  setTimeout(() => {
    try {
      loadScheduleFromStorage(scheduleName);
    } finally {
      hideSpinner();
    }
  }, 10);
}

function getSelectedScheduleName() {
  const select = document.getElementById("savedSchedules");
  return select.value;
}

function loadScheduleFromStorage(scheduleName) {
  const savedSchedules = getSavedSchedulesFromStorage();
  const scheduleState = savedSchedules.find((s) => s.name === scheduleName);

  if (scheduleState) {
    restoreScheduleState(scheduleState);
    refreshUIAfterScheduleLoad();
    showAlert(`Schedule "${scheduleName}" loaded successfully.`, "success");
  } else {
    showAlert(`Could not find schedule state "${scheduleName}".`, "error");
  }
}

function restoreScheduleState(state) {
  appState.schedule = state.scheduleData;
  appState.leaveRequests = state.leaveData || {};
  appState.startDate = new Date(state.startDate);
  document.getElementById("scheduleStart").value = state.startDate;

  // Restore employee data if available (for backwards compatibility)
  if (state.employeeData) {
    appState.employees = state.employeeData;
    saveEmployees();
  }
}

function refreshUIAfterScheduleLoad() {
  populateLeaveEmployeeSelect();
  renderSchedule();
  updateStatistics();
  validateSchedule();
}

function deleteSelectedSchedule() {
  const scheduleName = getSelectedScheduleName();
  if (!scheduleName) {
    showAlert(
      "Please select a schedule to delete from the history.",
      "warning",
    );
    return;
  }

  if (confirmScheduleDeletion(scheduleName)) {
    removeScheduleFromStorage(scheduleName);
    populateSavedSchedules();
    showAlert(`Schedule "${scheduleName}" deleted successfully.`, "success");
  }
}

function confirmScheduleDeletion(scheduleName) {
  return confirm(
    `Are you sure you want to delete the schedule state "${scheduleName}"? This cannot be undone.`,
  );
}

function removeScheduleFromStorage(scheduleName) {
  let savedSchedules = getSavedSchedulesFromStorage();
  savedSchedules = savedSchedules.filter((s) => s.name !== scheduleName);
  saveSchedulesToStorage(savedSchedules);
}

// ==================== Schedule Import/Export Utilities ==================== //

function exportScheduleData() {
  const exportData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    schedule: appState.schedule,
    employees: appState.employees,
    leaveRequests: appState.leaveRequests,
    startDate: document.getElementById("scheduleStart").value,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  downloadJSONFile(
    dataStr,
    `schedule-backup-${new Date().toISOString().split("T")[0]}.json`,
  );
}

function downloadJSONFile(content, filename) {
  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importScheduleData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importData = JSON.parse(e.target.result);
      validateAndLoadImportData(importData);
    } catch (error) {
      showAlert(
        "Invalid file format. Please select a valid schedule backup file.",
        "error",
      );
    }
  };
  reader.readAsText(file);
}

function validateAndLoadImportData(importData) {
  if (!importData.schedule || !importData.employees) {
    showAlert("Invalid schedule data format.", "error");
    return;
  }

  if (confirm("This will replace your current schedule. Continue?")) {
    appState.schedule = importData.schedule;
    appState.employees = importData.employees;
    appState.leaveRequests = importData.leaveRequests || {};

    if (importData.startDate) {
      document.getElementById("scheduleStart").value = importData.startDate;
      appState.startDate = new Date(importData.startDate);
    }

    saveEmployees();
    refreshUIAfterScheduleLoad();
    showAlert("Schedule data imported successfully!", "success");
  }
}

// ==================== Backup and Recovery ==================== //

function createAutomaticBackup() {
  const backupName = `Auto-backup-${new Date().toISOString()}`;
  const backupState = createScheduleState(backupName);

  let savedSchedules = getSavedSchedulesFromStorage();

  // Keep only last 5 automatic backups
  const autoBackups = savedSchedules.filter((s) =>
    s.name.startsWith("Auto-backup-"),
  );
  if (autoBackups.length >= 5) {
    autoBackups.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const oldestBackup = autoBackups[0];
    savedSchedules = savedSchedules.filter((s) => s.name !== oldestBackup.name);
  }

  savedSchedules.push(backupState);
  saveSchedulesToStorage(savedSchedules);
}

function recoverFromBackup() {
  const savedSchedules = getSavedSchedulesFromStorage();
  const backups = savedSchedules.filter((s) =>
    s.name.startsWith("Auto-backup-"),
  );

  if (backups.length === 0) {
    showAlert("No automatic backups found.", "warning");
    return;
  }

  backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestBackup = backups[0];

  if (
    confirm(
      `Restore from backup created on ${new Date(latestBackup.timestamp).toLocaleString()}?`,
    )
  ) {
    restoreScheduleState(latestBackup);
    refreshUIAfterScheduleLoad();
    showAlert("Schedule restored from backup successfully!", "success");
  }
}
