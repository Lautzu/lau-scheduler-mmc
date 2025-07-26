// Healthcare Staff Scheduler - Main Application Logic
// Following CLAUDE.md best practices for code organization

// Note: StorageUtils import removed for public version - using localStorage fallback

// Initialize the application when page loads
document.addEventListener("DOMContentLoaded", initializeApp);

// Employee data structure
const shifts = {
  day: { name: "Day", time: "6AM-2PM", hours: 8, class: "day-shift" },
  evening: {
    name: "Evening",
    time: "2PM-10PM",
    hours: 8,
    class: "evening-shift",
  },
  night: { name: "Night", time: "10PM-6AM", hours: 8, class: "night-shift" },
  "day-ot": { name: "Day OT", time: "6AM-6PM", hours: 12, class: "day-ot" },
  "night-ot": {
    name: "Night OT",
    time: "6PM-6AM",
    hours: 12,
    class: "night-ot",
  },
  off: { name: "Off", time: "", hours: 0, class: "off-day" },
  leave: { name: "Leave", time: "", hours: 0, class: "leave" },
};

let appState = {
  employees: [],
  schedule: {},
  leaveRequests: {},
  startDate: new Date(),
  lastAlerts: "",
  lastAlertType: "success",
  shiftAssignedCounts: {},
  otAssignmentCounter: 0,
};

// ==================== Core Application Functions ==================== //

function initializeApp() {
  loadEmployees();
  setDefaultStartDate();
  populateLeaveEmployeeSelect();
  populateSavedSchedules();
  generateSchedule();

  // Attach button event listeners
  attachButtonEventListeners();

  // Add window resize listener for dynamic layout recalculation
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderSchedule();
    }, 250); // Debounce resize events
  });
}

function loadEmployees() {
  const storedEmployees = localStorage.getItem("employees");
  if (storedEmployees) {
    appState.employees = JSON.parse(storedEmployees);
  } else {
    appState.employees = getDefaultEmployees();
    saveEmployees();
  }
}

function getDefaultEmployees() {
  return [
    {
      id: 1,
      name: "Rico C. Campos, RTRP",
      role: "Senior-on-Duty",
      tenure: 1,
      canSeniorDuty: true,
    },
    {
      id: 2,
      name: "Maria Katrina S. Pattung, RTRP",
      role: "Senior-on-Duty",
      tenure: 2,
      canSeniorDuty: true,
    },
    {
      id: 3,
      name: "Mariam B. Buddin, RTRP",
      role: "Senior-on-Duty",
      tenure: 3,
      canSeniorDuty: true,
    },
    {
      id: 4,
      name: "Ruiza E. San Antonio, RTRP",
      role: "Senior-on-Duty",
      tenure: 4,
      canSeniorDuty: true,
    },
    {
      id: 5,
      name: "Faith D. Villanueva, RTRP",
      role: "Senior-on-Duty",
      tenure: 5,
      canSeniorDuty: true,
    },
    {
      id: 6,
      name: "Blessilda D. Larzdizabal, RTRP",
      role: "Senior-on-Duty",
      tenure: 6,
      canSeniorDuty: true,
    },
    {
      id: 7,
      name: "Jecilyn A. Usman, RTRP",
      role: "ICU",
      tenure: 7,
      canSeniorDuty: false,
    },
    {
      id: 8,
      name: "Christine Joyce M. Villareal, RTRP",
      role: "ICU",
      tenure: 8,
      canSeniorDuty: false,
    },
    {
      id: 9,
      name: "Rania S. Casalin, RTRP",
      role: "WARDS",
      tenure: 9,
      canSeniorDuty: false,
    },
    {
      id: 10,
      name: "Kamila D. Ahajul, RTRP",
      role: "WARDS",
      tenure: 10,
      canSeniorDuty: false,
    },
    {
      id: 11,
      name: "Ameera M. Ebni, RTRP",
      role: "WARDS",
      tenure: 11,
      canSeniorDuty: false,
    },
    {
      id: 12,
      name: "Eunice Yvonne L. Trinidad, RTRP",
      role: "Emergency",
      tenure: 12,
      canSeniorDuty: false,
    },
    {
      id: 13,
      name: "Yannina Marie J. Valdeñas, RTRP",
      role: "Emergency",
      tenure: 13,
      canSeniorDuty: false,
    },
    {
      id: 14,
      name: "Pia P. Lacson, RTRP",
      role: "Outpatient",
      tenure: 14,
      canSeniorDuty: false,
    },
    {
      id: 15,
      name: "Shaina Mae P. Rodriguez, RTRP",
      role: "Outpatient",
      tenure: 15,
      canSeniorDuty: false,
    },
    {
      id: 16,
      name: "Crizel Ann A. Davis, RTRP",
      role: "Outpatient",
      tenure: 16,
      canSeniorDuty: false,
    },
    {
      id: 17,
      name: "Benjamin P. Ortiz, RTRP",
      role: "Outpatient",
      tenure: 17,
      canSeniorDuty: false,
    },
    {
      id: 18,
      name: "Charlene Mae L. Gonzales, RTRP",
      role: "Outpatient",
      tenure: 18,
      canSeniorDuty: false,
    },
    {
      id: 19,
      name: "Jerricho Ian I. Vistar, RTRP",
      role: "Outpatient",
      tenure: 19,
      canSeniorDuty: false,
    },
  ];
}

function saveEmployees() {
  localStorage.setItem("employees", JSON.stringify(appState.employees));
}

function populateSavedSchedules() {
  const select = document.getElementById("savedScheduleSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Select Saved Schedule</option>';

  // Get saved schedules from localStorage
  const savedSchedules = JSON.parse(
    localStorage.getItem("savedSchedules") || "{}",
  );

  Object.keys(savedSchedules).forEach((scheduleId) => {
    const schedule = savedSchedules[scheduleId];
    const option = document.createElement("option");
    option.value = scheduleId;
    option.textContent = `${schedule.name} (${new Date(schedule.createdAt).toLocaleDateString()})`;
    select.appendChild(option);
  });
}

// ==================== UI Utility Functions ==================== //

function showSpinner() {
  document.getElementById("spinner-overlay").style.display = "flex";
}

function hideSpinner() {
  document.getElementById("spinner-overlay").style.display = "none";
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showAlert(message, type) {
  const alertsContainer = document.getElementById("alerts");
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = message;

  alertsContainer.innerHTML = "";
  alertsContainer.appendChild(alert);

  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, 5000);
}

// ==================== Date and Schedule Management ==================== //

function setDefaultStartDate() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  document.getElementById("scheduleStart").value = sunday
    .toISOString()
    .split("T")[0];
  appState.startDate = sunday;
}

function getDatesArray(startDate) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 14; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function validateStartDate(dateString) {
  const validation = InputValidator.validateScheduleStartDate(dateString);
  if (!validation.isValid) {
    ErrorHandler.displayValidationError(validation.error, "scheduleStart");
    return false;
  }
  return true;
}

// ==================== Schedule Generation ==================== //

function generateSchedule() {
  const startDateInput = document.getElementById("scheduleStart").value;
  if (!startDateInput) {
    showAlert("Please select a start date", "error");
    return;
  }

  if (!validateStartDate(startDateInput)) {
    showAlert("Start date must be a Sunday", "error");
    return;
  }

  showSpinner();
  setTimeout(() => {
    try {
      initializeScheduleStructure(startDateInput);
      applyLeaveRequests();
      autoGenerateSchedule();
      renderSchedule();
      updateStatistics();
      validateSchedule();
    } finally {
      hideSpinner();
    }
  }, 10);
}

function initializeScheduleStructure(startDateInput) {
  appState.startDate = new Date(startDateInput);
  appState.schedule = {};

  for (let day = 0; day < 14; day++) {
    const date = new Date(appState.startDate);
    date.setDate(appState.startDate.getDate() + day);
    const dateStr = date.toISOString().split("T")[0];

    appState.schedule[dateStr] = {};
    appState.employees.forEach((emp) => {
      appState.schedule[dateStr][emp.id] = "off";
    });
  }
}

function autoGenerateSchedule() {
  const dates = Object.keys(appState.schedule).sort();

  // Reset tracking counters
  let consecutiveDays = {};
  appState.employees.forEach((emp) => {
    consecutiveDays[emp.id] = 0;
    appState.shiftAssignedCounts[emp.id] = 0;
  });

  appState.otAssignmentCounter = 0;

  dates.forEach((date, dayIndex) => {
    assignDailyShifts(date, dayIndex, consecutiveDays);
  });
}

function assignDailyShifts(date, dayIndex, consecutiveDays) {
  const availableEmployees = appState.employees.filter(
    (emp) => appState.schedule[date][emp.id] !== "leave",
  );

  const shiftTypes = ["day", "evening", "night"];

  shiftTypes.forEach((shiftType) => {
    assignShiftType(date, shiftType, availableEmployees, consecutiveDays);
  });

  // Update consecutive days tracking
  appState.employees.forEach((emp) => {
    if (isWorkingShift(appState.schedule[date][emp.id])) {
      consecutiveDays[emp.id]++;
    } else {
      consecutiveDays[emp.id] = 0;
    }
  });
}

function isWorkingShift(shiftType) {
  return shiftType !== "off" && shiftType !== "leave";
}

// This function is getting complex - should be split according to CLAUDE.md C-9
function assignShiftType(date, shiftType, availableEmployees, consecutiveDays) {
  const neededStaff = 5;
  let assigned = 0;
  const dates = Object.keys(appState.schedule).sort();
  const weekNum = dates.indexOf(date) >= 7 ? 1 : 0;

  const requiredDepartments = [
    "Senior-on-Duty",
    "ICU",
    "WARDS",
    "Emergency",
    "Outpatient",
  ];
  const assignedDepartments = new Set();

  // Calculate off days for workload balancing
  const offDaysCount = calculateOffDaysCount(weekNum, dates);

  // Get prioritized employee list
  const sortedEmployees = getPrioritizedEmployees(
    availableEmployees,
    date,
    offDaysCount,
    consecutiveDays,
  );

  // Phase 1: Ensure department coverage
  assigned += assignDepartmentCoverage(
    date,
    shiftType,
    sortedEmployees,
    requiredDepartments,
    assignedDepartments,
    consecutiveDays,
    weekNum,
    dates,
    offDaysCount,
    assigned,
    neededStaff,
  );

  // Phase 2: Fill remaining positions
  assigned += fillRemainingPositions(
    date,
    shiftType,
    sortedEmployees,
    consecutiveDays,
    weekNum,
    dates,
    offDaysCount,
    assigned,
    neededStaff,
  );
}

function calculateOffDaysCount(weekNum, dates) {
  const offDaysCount = {};
  appState.employees.forEach((emp) => {
    const weekStart = weekNum === 0 ? dates[0] : dates[7];
    const weekEnd = weekNum === 0 ? dates[6] : dates[13];
    let count = 0;
    for (let d = dates.indexOf(weekStart); d <= dates.indexOf(weekEnd); d++) {
      const currentDate = dates[d];
      if (
        appState.schedule[currentDate][emp.id] === "off" ||
        appState.schedule[currentDate][emp.id] === "leave"
      ) {
        count++;
      }
    }
    offDaysCount[emp.id] = count;
  });
  return offDaysCount;
}

function getPrioritizedEmployees(
  availableEmployees,
  date,
  offDaysCount,
  consecutiveDays,
) {
  return availableEmployees
    .filter((emp) => appState.schedule[date][emp.id] === "off")
    .sort((a, b) => {
      const diffShifts = getShiftCountSoFar(a.id) - getShiftCountSoFar(b.id);
      if (diffShifts !== 0) return diffShifts;

      const aOffDaysNeeded = 2 - offDaysCount[a.id];
      const bOffDaysNeeded = 2 - offDaysCount[b.id];
      if (aOffDaysNeeded !== bOffDaysNeeded) {
        return bOffDaysNeeded - aOffDaysNeeded;
      }

      return consecutiveDays[a.id] - consecutiveDays[b.id];
    });
}

function assignDepartmentCoverage(
  date,
  shiftType,
  sortedEmployees,
  requiredDepartments,
  assignedDepartments,
  consecutiveDays,
  weekNum,
  dates,
  offDaysCount,
  assigned,
  neededStaff,
) {
  let deptAssigned = 0;
  requiredDepartments.forEach((dept) => {
    if (assigned + deptAssigned >= neededStaff) return;

    const deptEmployee = findQualifiedEmployee(
      sortedEmployees,
      dept,
      date,
      consecutiveDays,
      offDaysCount,
      weekNum,
      dates,
      shiftType,
      assignedDepartments,
    );

    if (deptEmployee) {
      const finalShift = determineShiftWithOT(shiftType, date);
      appState.schedule[date][deptEmployee.id] = finalShift;
      assignedDepartments.add(deptEmployee.role);
      deptAssigned++;
      appState.shiftAssignedCounts[deptEmployee.id]++;
    }
  });
  return deptAssigned;
}

function fillRemainingPositions(
  date,
  shiftType,
  sortedEmployees,
  consecutiveDays,
  weekNum,
  dates,
  offDaysCount,
  assigned,
  neededStaff,
) {
  let additionalAssigned = 0;
  const priorityDepartments = [
    "ICU",
    "Emergency",
    "WARDS",
    "Senior-on-Duty",
    "Outpatient",
  ];

  while (assigned + additionalAssigned < neededStaff) {
    let foundEmployee = false;

    for (const dept of priorityDepartments) {
      const deptEmployee = findQualifiedEmployee(
        sortedEmployees,
        dept,
        date,
        consecutiveDays,
        offDaysCount,
        weekNum,
        dates,
        shiftType,
      );

      if (deptEmployee) {
        const finalShift = determineShiftWithOT(shiftType, date);
        appState.schedule[date][deptEmployee.id] = finalShift;
        additionalAssigned++;
        foundEmployee = true;
        appState.shiftAssignedCounts[deptEmployee.id]++;
        break;
      }
    }

    if (!foundEmployee) {
      const anyAvailable = findAnyAvailableEmployee(
        sortedEmployees,
        date,
        consecutiveDays,
        weekNum,
        dates,
        shiftType,
      );
      if (anyAvailable) {
        const finalShift = determineShiftWithOT(shiftType, date);
        appState.schedule[date][anyAvailable.id] = finalShift;
        additionalAssigned++;
        appState.shiftAssignedCounts[anyAvailable.id]++;
      } else {
        break;
      }
    }
  }
  return additionalAssigned;
}

function findQualifiedEmployee(
  sortedEmployees,
  dept,
  date,
  consecutiveDays,
  offDaysCount,
  weekNum,
  dates,
  shiftType,
  assignedDepartments = new Set(),
) {
  return sortedEmployees.find(
    (emp) =>
      emp.role === dept &&
      appState.schedule[date][emp.id] === "off" &&
      consecutiveDays[emp.id] < 3 &&
      (!assignedDepartments.has || !assignedDepartments.has(emp.role)) &&
      offDaysCount[emp.id] < 2 &&
      getWeeklyShiftCount(emp.id, weekNum, dates) < 5 &&
      !checkNightToMorningViolation(emp.id, date, shiftType),
  );
}

function findAnyAvailableEmployee(
  sortedEmployees,
  date,
  consecutiveDays,
  weekNum,
  dates,
  shiftType,
) {
  return sortedEmployees.find(
    (emp) =>
      appState.schedule[date][emp.id] === "off" &&
      consecutiveDays[emp.id] < 3 &&
      getWeeklyShiftCount(emp.id, weekNum, dates) < 5 &&
      !checkNightToMorningViolation(emp.id, date, shiftType),
  );
}

function determineShiftWithOT(shiftType, date) {
  if (shiftType === "day" || shiftType === "night") {
    const otType = shiftType === "day" ? "day-ot" : "night-ot";
    const otAssigned = appState.employees.some(
      (e) => appState.schedule[date][e.id] === otType,
    );

    if (!otAssigned && appState.otAssignmentCounter % 4 === 0) {
      appState.otAssignmentCounter++;
      return otType;
    }
    appState.otAssignmentCounter++;
  }
  return shiftType;
}

// ==================== Schedule Rendering ==================== //

function calculateOptimalLayout() {
  const employeeCount = appState.employees.length;

  // Use fixed, readable values instead of complex viewport calculations
  const targetRowHeight = 22; // Compact row height (50% reduction)
  const cellPadding = 6; // Compact padding (50% reduction)
  const fontSize = 11; // Slightly reduced font size for compact layout
  const employeeNamePadding = 8; // Compact name padding (50% reduction)

  // Calculate natural container height based on content
  const tableHeaderHeight = 50;
  const containerPadding = 40;
  const naturalContentHeight =
    targetRowHeight * employeeCount + tableHeaderHeight + containerPadding;

  // Update CSS custom properties with fixed values
  document.documentElement.style.setProperty("--employee-count", employeeCount);
  document.documentElement.style.setProperty(
    "--target-row-height",
    `${targetRowHeight}px`,
  );
  document.documentElement.style.setProperty(
    "--cell-padding",
    `${cellPadding}px`,
  );
  document.documentElement.style.setProperty(
    "--cell-font-size",
    `${fontSize}px`,
  );
  document.documentElement.style.setProperty(
    "--employee-name-padding",
    `${employeeNamePadding}px`,
  );
  document.documentElement.style.setProperty("--employee-name-width", "130px"); // Slightly reduced for more space

  return {
    employeeCount,
    targetRowHeight,
    naturalContentHeight,
  };
}

function renderSchedule() {
  // Calculate optimal layout before rendering
  const layoutInfo = calculateOptimalLayout();

  const tableBody = document.getElementById("tableBody");
  const tableHeader = document.getElementById("tableHeader");
  tableBody.innerHTML = "";
  tableHeader.innerHTML = "<th>Employee</th>";

  const dates = getDatesArray(appState.startDate);
  const dateOptions = { weekday: "short", month: "numeric", day: "numeric" };

  // Render date headers
  dates.forEach((date) => {
    const th = document.createElement("th");
    th.textContent = new Intl.DateTimeFormat("en-US", dateOptions).format(date);
    tableHeader.appendChild(th);
  });

  // Add OT Hours header as the last column
  const otHeader = document.createElement("th");
  otHeader.textContent = "OT Hours";
  tableHeader.appendChild(otHeader);

  // Render employee rows
  appState.employees.forEach((emp) => {
    const row = createEmployeeRow(emp, dates, dateOptions);
    tableBody.appendChild(row);
  });

  debouncedValidation();
}

function createOvertimeCell(emp, dates) {
  const dateStrings = dates.map((date) => date.toISOString().split("T")[0]);
  const stats = calculateEmployeeStats(emp, dateStrings);

  const td = document.createElement("td");
  td.className = "ot-hours";
  td.textContent = `${stats.otHours}h`;

  // Add color coding based on OT hours
  if (stats.otHours <= 8) {
    td.classList.add("low");
  } else if (stats.otHours <= 16) {
    td.classList.add("moderate");
  } else {
    td.classList.add("high");
  }

  // Add tooltip showing breakdown
  const week1Dates = dateStrings.slice(0, 7);
  const week2Dates = dateStrings.slice(7, 14);
  const week1Stats = calculateEmployeeStats(emp, week1Dates);
  const week2Stats = calculateEmployeeStats(emp, week2Dates);

  td.title = `Week 1: ${week1Stats.otHours}h, Week 2: ${week2Stats.otHours}h`;

  return td;
}

function createEmployeeRow(emp, dates, dateOptions) {
  const row = document.createElement("tr");
  row.innerHTML = `<td class="employee-name ${getRoleClass(emp.role)}">${emp.name}<span class="role-indicator">${emp.role}</span></td>`;

  dates.forEach((date) => {
    const dateString = date.toISOString().split("T")[0];
    ensureScheduleEntry(dateString, emp.id);

    const shiftType = appState.schedule[dateString][emp.id];
    const shift = shifts[shiftType];
    const td = createShiftCell(shift, emp.id, dateString, dateOptions, date);
    row.appendChild(td);
  });

  // Add OT Hours cell as the last column
  const otCell = createOvertimeCell(emp, dates);
  otCell.dataset.empId = emp.id;
  row.appendChild(otCell);

  return row;
}

function ensureScheduleEntry(dateString, empId) {
  if (!appState.schedule[dateString]) {
    appState.schedule[dateString] = {};
  }
  if (!appState.schedule[dateString][empId]) {
    appState.schedule[dateString][empId] = "off";
  }
}

function createShiftCell(shift, empId, dateString, dateOptions, date) {
  const td = document.createElement("td");
  td.className = shift.class;
  td.dataset.label = new Intl.DateTimeFormat("en-US", dateOptions).format(date);
  td.innerHTML = `
        <div>${shift.name}</div>
        <small>${shift.time}</small>
    `;
  td.onclick = () => toggleShift(empId, dateString, td);
  return td;
}

function getRoleClass(role) {
  const roleMap = {
    "Senior-on-Duty": "senior-duty",
    ICU: "icu",
    WARDS: "wards",
    Emergency: "emergency",
    Outpatient: "outpatient",
  };
  return roleMap[role] || "";
}

function updateEmployeeOvertimeCell(empId) {
  const otCell = document.querySelector(`td.ot-hours[data-emp-id="${empId}"]`);
  if (!otCell) return;

  const emp = appState.employees.find((e) => e.id === empId);
  if (!emp) return;

  const dates = getDatesArray(appState.startDate);
  const dateStrings = dates.map((date) => date.toISOString().split("T")[0]);
  const stats = calculateEmployeeStats(emp, dateStrings);

  otCell.textContent = `${stats.otHours}h`;

  // Update color coding based on OT hours
  otCell.classList.remove("low", "moderate", "high");
  if (stats.otHours <= 8) {
    otCell.classList.add("low");
  } else if (stats.otHours <= 16) {
    otCell.classList.add("moderate");
  } else {
    otCell.classList.add("high");
  }

  // Update tooltip showing breakdown
  const week1Dates = dateStrings.slice(0, 7);
  const week2Dates = dateStrings.slice(7, 14);
  const week1Stats = calculateEmployeeStats(emp, week1Dates);
  const week2Stats = calculateEmployeeStats(emp, week2Dates);
  otCell.title = `Week 1: ${week1Stats.otHours}h, Week 2: ${week2Stats.otHours}h`;
}

const debouncedValidation = debounce(() => {
  updateStatistics();
  validateSchedule();
}, 500);

// ==================== Shift Management ==================== //

function toggleShift(empId, date, cell) {
  const currentShift = appState.schedule[date][empId];
  const shiftKeys = Object.keys(shifts);
  const currentIndex = shiftKeys.indexOf(currentShift);
  const nextIndex = (currentIndex + 1) % shiftKeys.length;
  const nextShift = shiftKeys[nextIndex];

  appState.schedule[date][empId] = nextShift;
  updateShiftCell(cell, nextShift);
  updateEmployeeOvertimeCell(empId);
  debouncedValidation();
  validateCellViolations(empId, cell);
}

function updateShiftCell(cell, shiftType) {
  const shift = shifts[shiftType];
  cell.className = shift.class;
  cell.innerHTML = `
        <div>${shift.name}</div>
        <small>${shift.time}</small>
    `;
}

function validateCellViolations(empId, cell) {
  const row = cell.parentNode;
  clearRowViolations(row);

  const dates = Object.keys(appState.schedule).sort();
  checkConsecutiveDaysViolation(empId, dates, row);
  checkNightToMorningViolations(empId, dates, row, cell);
}

function clearRowViolations(row) {
  // Skip employee name (index 0) and OT Hours (last index), only process date cells
  for (let i = 1; i < row.cells.length - 1; i++) {
    row.cells[i].classList.remove("violation-cell");
    row.cells[i].title = "";
  }
}

function checkConsecutiveDaysViolation(empId, dates, row) {
  let currentConsecutive = 0;
  dates.forEach((d, index) => {
    if (isWorkingShift(appState.schedule[d][empId])) {
      currentConsecutive++;
    } else {
      currentConsecutive = 0;
    }

    if (currentConsecutive > 3) {
      highlightConsecutiveViolation(row, dates, index, currentConsecutive);
    }
  });
}

function highlightConsecutiveViolation(
  row,
  dates,
  currentIndex,
  consecutiveCount,
) {
  const blockStartIndex = currentIndex - consecutiveCount + 1;
  for (let i = blockStartIndex; i <= currentIndex; i++) {
    // Cell index: employee name (0) + date cells (1-14), skip OT Hours (last cell)
    const cell = row.cells[i + 1];
    if (cell && i + 1 < row.cells.length - 1) {
      cell.classList.add("violation-cell");
      cell.title = `Violation: ${consecutiveCount} consecutive working days.`;
    }
  }
}

function checkNightToMorningViolations(empId, dates, row, cell) {
  dates.forEach((d, index) => {
    if (index > 0) {
      const prevDate = dates[index - 1];
      const prevShift = appState.schedule[prevDate][empId];
      const currentShift = appState.schedule[d][empId];

      if (isNightToMorningViolation(prevShift, currentShift)) {
        // Cell index: employee name (0) + date cells (1-14), skip OT Hours (last cell)
        const problemCell = row.cells[index + 1];
        if (problemCell && index + 1 < row.cells.length - 1) {
          problemCell.classList.add("violation-cell");
          const existingTitle = problemCell.title;
          problemCell.title = existingTitle
            ? existingTitle + " | Clopening"
            : "Violation: Morning shift after night shift.";
        }
      }
    }
  });
}

function isNightToMorningViolation(prevShift, currentShift) {
  const isNightShift = prevShift === "night" || prevShift === "night-ot";
  const isEveningShift = prevShift === "evening";
  const isMorningShift = currentShift === "day" || currentShift === "day-ot";
  return (isNightShift || isEveningShift) && isMorningShift;
}

// ==================== Statistics and Validation ==================== //

function updateStatistics() {
  const stats = calculateScheduleStatistics();
  updateStatisticsDisplay(stats);
  updateDepartmentalStats(Object.keys(appState.schedule));
}

function calculateScheduleStatistics() {
  let totalHours = 0;
  let otHours = 0;
  let totalShifts = 0;
  const dates = Object.keys(appState.schedule);

  appState.employees.forEach((emp) => {
    dates.forEach((date) => {
      const shiftType = appState.schedule[date][emp.id];
      const shift = shifts[shiftType];
      totalHours += shift.hours;
      totalShifts += shift.hours > 0 ? 1 : 0;
      if (shift.hours === 12) {
        otHours += 4;
      }
    });
  });

  const avgCoveragePerShift = totalShifts / (dates.length * 3);

  return { totalHours, otHours, avgCoveragePerShift };
}

function updateStatisticsDisplay(stats) {
  document.getElementById("totalHours").textContent = stats.totalHours;
  document.getElementById("otHours").textContent = stats.otHours;
  document.getElementById("avgCoverage").textContent =
    Math.round(stats.avgCoveragePerShift * 10) / 10;
}

function updateDepartmentalStats(dates) {
  const deptStats = {};
  const requiredDepartments = [
    "Senior-on-Duty",
    "ICU",
    "WARDS",
    "Emergency",
    "Outpatient",
  ];

  requiredDepartments.forEach((dept) => {
    deptStats[dept] = { total: 0, perShift: { day: 0, evening: 0, night: 0 } };
  });

  dates.forEach((date) => {
    ["day", "evening", "night"].forEach((shift) => {
      appState.employees.forEach((emp) => {
        const empShift = appState.schedule[date][emp.id];
        if (isShiftMatch(empShift, shift)) {
          deptStats[emp.role].total++;
          deptStats[emp.role].perShift[shift]++;
        }
      });
    });
  });

  console.log("Departmental Coverage Stats:", deptStats);
}

function isShiftMatch(empShift, targetShift) {
  return (
    empShift === targetShift ||
    (targetShift === "day" && empShift === "day-ot") ||
    (targetShift === "night" && empShift === "night-ot")
  );
}

function validateSchedule() {
  const violations = [];
  const dates = Object.keys(appState.schedule).sort();

  // Check coverage violations
  violations.push(...validateCoverage(dates));

  // Check employee violations
  violations.push(...validateEmployeeConstraints(dates));

  updateViolationsDisplay(violations);
}

function validateCoverage(dates) {
  const violations = [];
  const requiredDepartments = [
    "Senior-on-Duty",
    "ICU",
    "WARDS",
    "Emergency",
    "Outpatient",
  ];

  dates.forEach((date) => {
    ["day", "evening", "night"].forEach((shift) => {
      const coverage = getCoverageForShift(date, shift);

      if (coverage.length < 5) {
        violations.push(
          `⚠️ Low coverage on ${date} ${shift} shift: ${coverage.length}/5 staff`,
        );
      }

      const missingDepts = findMissingDepartments(
        coverage,
        requiredDepartments,
      );
      if (missingDepts.length > 0) {
        violations.push(
          `🏥 Missing departments on ${date} ${shift}: ${missingDepts.join(", ")}`,
        );
      }
    });

    if (!hasSeniorDutyPresence(date)) {
      violations.push(`👨‍⚕️ No Senior-on-Duty present on ${date}`);
    }
  });

  return violations;
}

function getCoverageForShift(date, shift) {
  return appState.employees.filter((emp) =>
    isShiftMatch(appState.schedule[date][emp.id], shift),
  );
}

function findMissingDepartments(coverage, requiredDepartments) {
  const representedDepts = new Set(coverage.map((emp) => emp.role));
  return requiredDepartments.filter((dept) => !representedDepts.has(dept));
}

function hasSeniorDutyPresence(date) {
  return appState.employees.some(
    (emp) =>
      emp.canSeniorDuty && isWorkingShift(appState.schedule[date][emp.id]),
  );
}

function validateEmployeeConstraints(dates) {
  const violations = [];

  appState.employees.forEach((emp) => {
    violations.push(...validateConsecutiveDays(emp, dates));
    violations.push(...validateNightToMorning(emp, dates));
    violations.push(...validateOffDayRequirements(emp, dates));
  });

  return violations;
}

function validateConsecutiveDays(emp, dates) {
  const violations = [];
  let consecutive = 0;
  let maxConsecutive = 0;

  dates.forEach((date) => {
    if (isWorkingShift(appState.schedule[date][emp.id])) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  });

  if (maxConsecutive > 3) {
    violations.push(
      `⏰ ${emp.name} has ${maxConsecutive} consecutive working days`,
    );
  }

  return violations;
}

function validateNightToMorning(emp, dates) {
  const violations = [];

  dates.forEach((date, index) => {
    if (index > 0) {
      const prevDate = dates[index - 1];
      const prevShift = appState.schedule[prevDate][emp.id];
      const currentShift = appState.schedule[date][emp.id];

      if (isNightToMorningViolation(prevShift, currentShift)) {
        violations.push(
          `🔥 ${emp.name} has a night shift followed by a morning shift on ${date}`,
        );
      }
    }
  });

  return violations;
}

function validateOffDayRequirements(emp, dates) {
  const violations = [];
  const week1Days = dates.slice(0, 7);
  const week2Days = dates.slice(7, 14);

  [week1Days, week2Days].forEach((weekDays, weekNum) => {
    const offDays = weekDays.filter(
      (date) => !isWorkingShift(appState.schedule[date][emp.id]),
    ).length;

    if (offDays < 2) {
      violations.push(
        `📅 ${emp.name} has only ${offDays} days off in week ${weekNum + 1} (minimum 2 required)`,
      );
    }
  });

  return violations;
}

function updateViolationsDisplay(violations) {
  document.getElementById("violations").textContent = violations.length;

  if (violations.length > 0) {
    const alertsToShow = violations.slice(0, 5);
    if (violations.length > 5) {
      alertsToShow.push(`... and ${violations.length - 5} more issues`);
    }
    appState.lastAlerts = alertsToShow.join("<br>");
    appState.lastAlertType = violations.length > 5 ? "error" : "warning";
  } else {
    appState.lastAlerts = "✅ Perfect schedule! All requirements met.";
    appState.lastAlertType = "success";
  }
}

// ==================== Helper Functions ==================== //

function checkNightToMorningViolation(empId, date, shiftType) {
  if (shiftType !== "day" && shiftType !== "day-ot") return false;

  const dates = Object.keys(appState.schedule).sort();
  const dateIndex = dates.indexOf(date);

  if (dateIndex > 0) {
    const previousDate = dates[dateIndex - 1];
    const previousShift = appState.schedule[previousDate][empId];
    return previousShift === "night" || previousShift === "night-ot";
  }
  return false;
}

function getWeeklyShiftCount(empId, weekNum, dates) {
  const weekStart = weekNum === 0 ? dates[0] : dates[7];
  const weekEnd = weekNum === 0 ? dates[6] : dates[13];
  let count = 0;
  for (let d = dates.indexOf(weekStart); d <= dates.indexOf(weekEnd); d++) {
    const currentDate = dates[d];
    const shift = appState.schedule[currentDate][empId];
    if (isWorkingShift(shift)) count++;
  }
  return count;
}

function getShiftCountSoFar(empId) {
  return appState.shiftAssignedCounts[empId] || 0;
}

// ==================== Leave Management ==================== //

function populateLeaveEmployeeSelect() {
  const select = document.getElementById("leaveEmployee");
  select.innerHTML = "";
  appState.employees.forEach((emp) => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = `${emp.name} (${emp.role})`;
    select.appendChild(option);
  });
}

function showLeaveModal() {
  document.getElementById("leaveModal").style.display = "block";
}

function closeLeaveModal() {
  document.getElementById("leaveModal").style.display = "none";
}

function assignLeave() {
  const empId = parseInt(document.getElementById("leaveEmployee").value);
  const startDate = document.getElementById("leaveStartDate").value;
  const endDate = document.getElementById("leaveEndDate").value;
  const leaveType = document.getElementById("leaveType").value;

  if (!validateLeaveInput(startDate, endDate)) return;

  applyLeaveToSchedule(empId, startDate, endDate);
  storeLeaveRequest(empId, startDate, endDate, leaveType);

  closeLeaveModal();
  renderSchedule();
  updateStatistics();
  validateSchedule();

  const empName = appState.employees.find((e) => e.id === empId).name;
  showAlert(`Leave assigned successfully for ${empName}`, "success");
}

function validateLeaveInput(startDate, endDate) {
  const dateRangeValidation = InputValidator.validateDateRange(
    startDate,
    endDate,
  );
  if (!dateRangeValidation.isValid) {
    ErrorHandler.displayValidationError(dateRangeValidation.error);
    return false;
  }

  return true;
}

function applyLeaveToSchedule(empId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = date.toISOString().split("T")[0];
    if (appState.schedule[dateStr]) {
      appState.schedule[dateStr][empId] = "leave";
    }
  }
}

function storeLeaveRequest(empId, startDate, endDate, leaveType) {
  if (!appState.leaveRequests[empId]) {
    appState.leaveRequests[empId] = [];
  }
  appState.leaveRequests[empId].push({
    start: startDate,
    end: endDate,
    type: leaveType,
  });
}

function applyLeaveRequests() {
  Object.keys(appState.leaveRequests).forEach((empId) => {
    appState.leaveRequests[empId].forEach((leave) => {
      applyLeaveToSchedule(parseInt(empId), leave.start, leave.end);
    });
  });
}

// ==================== Button Handler Functions ==================== //

function showEmployeeModal() {
  const modal = document.getElementById("employeeModal");
  const employeeSelect = document.getElementById("employeeSelect");

  // Clear form
  clearEmployeeForm();

  // Populate employee dropdown
  populateEmployeeSelect();

  modal.style.display = "block";
}

function closeEmployeeModal() {
  const modal = document.getElementById("employeeModal");
  modal.style.display = "none";
  clearEmployeeForm();
}

function handleEmployeeSelection() {
  const employeeSelect = document.getElementById("employeeSelect");
  const selectedId = parseInt(employeeSelect.value);

  if (selectedId) {
    const employee = appState.employees.find((emp) => emp.id === selectedId);
    if (employee) {
      populateEmployeeForm(employee);
    }
  } else {
    clearEmployeeForm();
  }
}

function clearEmployeeForm() {
  document.getElementById("employeeName").value = "";
  document.getElementById("employeeRole").value = "Senior-on-Duty";
  document.getElementById("employeeCanSeniorDuty").checked = false;
}

function populateEmployeeForm(employee) {
  document.getElementById("employeeName").value = employee.name;
  document.getElementById("employeeRole").value = employee.role;
  document.getElementById("employeeCanSeniorDuty").checked =
    employee.canSeniorDuty;
}

function populateEmployeeSelect() {
  const employeeSelect = document.getElementById("employeeSelect");
  employeeSelect.innerHTML = '<option value="">➕ Add New Employee</option>';

  appState.employees.forEach((emp) => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.name;
    employeeSelect.appendChild(option);
  });
}

function saveEmployee() {
  const name = document.getElementById("employeeName").value.trim();
  const role = document.getElementById("employeeRole").value;
  const canSeniorDuty = document.getElementById(
    "employeeCanSeniorDuty",
  ).checked;
  const employeeSelect = document.getElementById("employeeSelect");
  const selectedId = parseInt(employeeSelect.value);

  if (!name) {
    showAlert("Please enter employee name", "error");
    return;
  }

  if (selectedId) {
    // Update existing employee
    const empIndex = appState.employees.findIndex(
      (emp) => emp.id === selectedId,
    );
    if (empIndex !== -1) {
      appState.employees[empIndex] = {
        ...appState.employees[empIndex],
        name,
        role,
        canSeniorDuty,
      };
      showAlert("Employee updated successfully", "success");
    }
  } else {
    // Add new employee
    const newId = Math.max(...appState.employees.map((emp) => emp.id), 0) + 1;
    const newEmployee = {
      id: newId,
      name,
      role,
      tenure: 1,
      canSeniorDuty,
    };
    appState.employees.push(newEmployee);
    showAlert("Employee added successfully", "success");
  }

  saveEmployees();
  populateLeaveEmployeeSelect();
  closeEmployeeModal();
  generateSchedule();
}

function deleteEmployee() {
  const employeeSelect = document.getElementById("employeeSelect");
  const selectedId = parseInt(employeeSelect.value);

  if (!selectedId) {
    showAlert("Please select an employee to delete", "error");
    return;
  }

  if (confirm("Are you sure you want to delete this employee?")) {
    appState.employees = appState.employees.filter(
      (emp) => emp.id !== selectedId,
    );
    saveEmployees();
    populateLeaveEmployeeSelect();
    closeEmployeeModal();
    generateSchedule();
    showAlert("Employee deleted successfully", "success");
  }
}

function closeLeaveModal() {
  const modal = document.getElementById("leaveModal");
  modal.style.display = "none";
}

function addLeaveRequest() {
  const employee = document.getElementById("leaveEmployee").value;
  const startDate = document.getElementById("leaveStartDate").value;
  const endDate = document.getElementById("leaveEndDate").value;
  const leaveType = document.getElementById("leaveType").value;

  if (!employee || !startDate || !endDate) {
    showAlert("Please fill all leave request fields", "error");
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    showAlert("Start date cannot be after end date", "error");
    return;
  }

  // Add leave to each date in the range
  const current = new Date(start);
  while (current <= end) {
    const dateString = current.toISOString().split("T")[0];
    if (!appState.leaveRequests[dateString]) {
      appState.leaveRequests[dateString] = {};
    }
    appState.leaveRequests[dateString][employee] = leaveType;
    current.setDate(current.getDate() + 1);
  }

  showAlert("Leave request added successfully", "success");
  closeLeaveModal();
  generateSchedule();
}

function clearAllLeave() {
  if (confirm("Are you sure you want to clear all leave requests?")) {
    appState.leaveRequests = {};
    showAlert("All leave requests cleared", "success");
    generateSchedule();
  }
}

function saveCurrentSchedule() {
  const scheduleName = prompt("Enter a name for this schedule:");
  if (!scheduleName) return;

  try {
    const scheduleData = {
      name: scheduleName,
      schedule: appState.schedule,
      employees: appState.employees,
      leaveRequests: appState.leaveRequests,
      startDate: appState.startDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Generate unique ID for schedule
    const scheduleId = Date.now().toString();

    // Save to localStorage
    const savedSchedules = JSON.parse(
      localStorage.getItem("savedSchedules") || "{}",
    );
    savedSchedules[scheduleId] = scheduleData;
    localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));

    populateSavedSchedules();
    showAlert("Schedule saved successfully", "success");
  } catch (error) {
    console.error("Failed to save schedule:", error);
    showAlert("Failed to save schedule", "error");
  }
}

function loadSelectedSchedule() {
  const select = document.getElementById("savedScheduleSelect");
  const scheduleId = select.value;

  if (!scheduleId) {
    showAlert("Please select a schedule to load", "error");
    return;
  }

  try {
    const savedSchedules = JSON.parse(
      localStorage.getItem("savedSchedules") || "{}",
    );
    const scheduleData = savedSchedules[scheduleId];

    if (scheduleData) {
      appState.schedule = scheduleData.schedule;
      appState.employees = scheduleData.employees;
      appState.leaveRequests = scheduleData.leaveRequests || {};
      appState.startDate = new Date(scheduleData.startDate);

      // Update UI
      document.getElementById("scheduleStart").value = appState.startDate
        .toISOString()
        .split("T")[0];
      populateLeaveEmployeeSelect();
      renderSchedule();
      updateStatistics();
      showAlert("Schedule loaded successfully", "success");
    } else {
      showAlert("Schedule not found", "error");
    }
  } catch (error) {
    console.error("Failed to load schedule:", error);
    showAlert("Failed to load schedule", "error");
  }
}

function deleteSelectedSchedule() {
  const select = document.getElementById("savedScheduleSelect");
  const scheduleId = select.value;

  if (!scheduleId) {
    showAlert("Please select a schedule to delete", "error");
    return;
  }

  if (confirm("Are you sure you want to delete this schedule?")) {
    try {
      const savedSchedules = JSON.parse(
        localStorage.getItem("savedSchedules") || "{}",
      );
      delete savedSchedules[scheduleId];
      localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));

      populateSavedSchedules();
      showAlert("Schedule deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      showAlert("Failed to delete schedule", "error");
    }
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    sessionStorage.removeItem("loginData");
    window.location.href = "/login";
  }
}

function closeClearModal() {
  const modal = document.getElementById("clearModal");
  modal.style.display = "none";
}

function confirmClear() {
  const clearType = document.getElementById("clearType").value;

  switch (clearType) {
    case "all":
      appState.schedule = {};
      appState.leaveRequests = {};
      break;
    case "work-only":
      // Clear only work assignments, keep leave
      Object.keys(appState.schedule).forEach((date) => {
        Object.keys(appState.schedule[date]).forEach((empId) => {
          if (appState.schedule[date][empId] !== "leave") {
            appState.schedule[date][empId] = "off";
          }
        });
      });
      break;
    case "regenerate":
      appState.schedule = {};
      generateSchedule();
      break;
  }

  closeClearModal();
  renderSchedule();
  updateStatistics();
  showAlert("Schedule cleared successfully", "success");
}

// ==================== Export Functionality ==================== //

function exportToExcel() {
  const csvContent = generateCSVContent();
  downloadCSVFile(csvContent);
  showAlert("Schedule exported to Excel/CSV successfully!", "success");
}

function generateCSVContent() {
  const dates = Object.keys(appState.schedule).sort();
  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);

  let csvContent = generateCSVHeader(dates, startDate, endDate);
  csvContent += generateEmployeeRows(dates);
  csvContent += generateSummaryRows(dates);

  return csvContent;
}

function generateCSVHeader(dates, startDate, endDate) {
  let header = `Healthcare Staff Schedule Export\n`;
  header += `Generated on: ${new Date().toLocaleString()}\n`;
  header += `Schedule Period: ${startDate.toDateString()} to ${endDate.toDateString()}\n`;
  header += `Total Employees: ${appState.employees.length}\n\n`;

  header += "Employee,Role,Senior Duty Qualified,";

  // Add date headers with day names
  dates.forEach((date) => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
    header += `"${dayName} ${monthName} ${dayNum}",`;
  });

  header +=
    "Week 1 Hours,Week 1 OT,Week 2 Hours,Week 2 OT,Total Hours,Total OT,Off Days,Violations\n";

  return header;
}

function generateEmployeeRows(dates) {
  let content = "";
  const week1Dates = dates.slice(0, 7);
  const week2Dates = dates.slice(7, 14);

  appState.employees.forEach((emp) => {
    const week1Stats = calculateEmployeeStats(emp, week1Dates);
    const week2Stats = calculateEmployeeStats(emp, week2Dates);
    const totalStats = calculateEmployeeStats(emp, dates);
    const offDays = countEmployeeOffDays(emp.id, dates);
    const violations = getEmployeeViolations(emp.id, dates);

    content += `"${emp.name}","${emp.role}","${emp.canSeniorDuty ? "Yes" : "No"}",`;

    // Add shift data for each date
    dates.forEach((date) => {
      const shiftType = appState.schedule[date][emp.id];
      const shift = shifts[shiftType];
      const shiftDisplay = shift.time
        ? `${shift.name} (${shift.time})`
        : shift.name;
      content += `"${shiftDisplay}",`;
    });

    // Add summary statistics
    content += `${week1Stats.totalHours},${week1Stats.otHours},`;
    content += `${week2Stats.totalHours},${week2Stats.otHours},`;
    content += `${totalStats.totalHours},${totalStats.otHours},`;
    content += `${offDays},${violations.length}\n`;
  });

  return content;
}

function generateSummaryRows(dates) {
  let content = "\nSummary Statistics\n";
  content += "Metric,Week 1,Week 2,Total\n";

  const week1Dates = dates.slice(0, 7);
  const week2Dates = dates.slice(7, 14);

  // Total hours
  const week1Hours = calculateTotalHours(week1Dates);
  const week2Hours = calculateTotalHours(week2Dates);
  const totalHours = week1Hours + week2Hours;
  content += `Total Hours,${week1Hours},${week2Hours},${totalHours}\n`;

  // Overtime hours
  const week1OT = calculateTotalOT(week1Dates);
  const week2OT = calculateTotalOT(week2Dates);
  const totalOT = week1OT + week2OT;
  content += `Overtime Hours,${week1OT},${week2OT},${totalOT}\n`;

  // Coverage statistics
  const avgCoverageWeek1 = calculateAverageCoverage(week1Dates);
  const avgCoverageWeek2 = calculateAverageCoverage(week2Dates);
  const avgCoverageTotal = (avgCoverageWeek1 + avgCoverageWeek2) / 2;
  content += `Avg Coverage per Shift,${avgCoverageWeek1.toFixed(1)},${avgCoverageWeek2.toFixed(1)},${avgCoverageTotal.toFixed(1)}\n`;

  // Violations
  const totalViolations = calculateTotalViolations();
  content += `Total Violations,,,${totalViolations}\n`;

  // Department breakdown
  content += "\nDepartment Coverage Analysis\n";
  content += "Department,Total Shifts,Day Shifts,Evening Shifts,Night Shifts\n";

  const deptStats = calculateDepartmentStats(dates);
  Object.keys(deptStats).forEach((dept) => {
    const stats = deptStats[dept];
    content += `${dept},${stats.total},${stats.perShift.day},${stats.perShift.evening},${stats.perShift.night}\n`;
  });

  return content;
}

function countEmployeeOffDays(empId, dates) {
  return dates.filter((date) => {
    const shift = appState.schedule[date][empId];
    return shift === "off" || shift === "leave";
  }).length;
}

function getEmployeeViolations(empId, dates) {
  const violations = [];

  // Check consecutive days
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  dates.forEach((date) => {
    if (isWorkingShift(appState.schedule[date][empId])) {
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 0;
    }
  });

  if (maxConsecutive > 3) {
    violations.push(`${maxConsecutive} consecutive days`);
  }

  // Check night-to-morning violations
  dates.forEach((date, index) => {
    if (index > 0) {
      const prevShift = appState.schedule[dates[index - 1]][empId];
      const currentShift = appState.schedule[date][empId];
      if (isNightToMorningViolation(prevShift, currentShift)) {
        violations.push("Night-to-morning shift");
      }
    }
  });

  // Check off days requirement
  const week1OffDays = countEmployeeOffDays(empId, dates.slice(0, 7));
  const week2OffDays = countEmployeeOffDays(empId, dates.slice(7, 14));

  if (week1OffDays < 2) violations.push("Insufficient off days week 1");
  if (week2OffDays < 2) violations.push("Insufficient off days week 2");

  return violations;
}

function calculateTotalHours(dates) {
  let total = 0;
  appState.employees.forEach((emp) => {
    dates.forEach((date) => {
      const shift = shifts[appState.schedule[date][emp.id]];
      total += shift.hours;
    });
  });
  return total;
}

function calculateTotalOT(dates) {
  let total = 0;
  appState.employees.forEach((emp) => {
    dates.forEach((date) => {
      const shift = shifts[appState.schedule[date][emp.id]];
      if (shift.hours === 12) total += 4;
    });
  });
  return total;
}

function calculateAverageCoverage(dates) {
  let totalShifts = 0;
  dates.forEach((date) => {
    ["day", "evening", "night"].forEach((shiftType) => {
      const coverage = getCoverageForShift(date, shiftType);
      totalShifts += coverage.length;
    });
  });
  return totalShifts / (dates.length * 3);
}

function calculateTotalViolations() {
  const dates = Object.keys(appState.schedule).sort();
  let total = 0;

  appState.employees.forEach((emp) => {
    total += getEmployeeViolations(emp.id, dates).length;
  });

  return total;
}

function calculateDepartmentStats(dates) {
  const deptStats = {};
  const requiredDepartments = [
    "Senior-on-Duty",
    "ICU",
    "WARDS",
    "Emergency",
    "Outpatient",
  ];

  requiredDepartments.forEach((dept) => {
    deptStats[dept] = { total: 0, perShift: { day: 0, evening: 0, night: 0 } };
  });

  dates.forEach((date) => {
    ["day", "evening", "night"].forEach((shift) => {
      appState.employees.forEach((emp) => {
        const empShift = appState.schedule[date][emp.id];
        if (isShiftMatch(empShift, shift)) {
          deptStats[emp.role].total++;
          deptStats[emp.role].perShift[shift]++;
        }
      });
    });
  });

  return deptStats;
}

function calculateEmployeeStats(emp, dates) {
  let totalHours = 0;
  let otHours = 0;

  dates.forEach((date) => {
    const shiftType = appState.schedule[date][emp.id];
    const shift = shifts[shiftType];
    totalHours += shift.hours;
    if (shift.hours === 12) otHours += 4;
  });

  return { totalHours, otHours };
}

function downloadCSVFile(csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Healthcare_Schedule_${appState.startDate.toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================== Clear Schedule ==================== //

function showClearModal() {
  document.getElementById("clearModal").style.display = "block";
}

function closeClearModal() {
  document.getElementById("clearModal").style.display = "none";
}

function confirmClearSchedule() {
  const clearType = document.getElementById("clearType").value;
  closeClearModal();

  switch (clearType) {
    case "all":
      clearSchedule("all");
      break;
    case "work-only":
      clearSchedule("work-only");
      break;
    case "regenerate":
      clearSchedule("regenerate");
      break;
    default:
      clearSchedule("all");
  }
}

function clearSchedule(clearType = "all") {
  const startDateInput = document.getElementById("scheduleStart").value;
  if (!startDateInput) {
    showAlert("Please select a start date", "error");
    return;
  }

  if (!validateStartDate(startDateInput)) {
    showAlert("Start date must be a Sunday", "error");
    return;
  }

  if (Object.keys(appState.schedule).length === 0) {
    initializeScheduleStructure(startDateInput);
  } else {
    resetScheduleToOff();
  }

  if (clearType === "work-only") {
    applyLeaveRequests();
    showAlert("Work shifts cleared. Leave requests preserved.", "success");
  } else if (clearType === "regenerate") {
    applyLeaveRequests();
    autoGenerateSchedule();
    showAlert("Schedule cleared and regenerated automatically.", "success");
  } else {
    showAlert(
      "Schedule cleared. You can now assign shifts manually.",
      "success",
    );
  }

  renderSchedule();
  updateStatistics();
  validateSchedule();
}

function resetScheduleToOff() {
  Object.keys(appState.schedule).forEach((date) => {
    Object.keys(appState.schedule[date]).forEach((empId) => {
      appState.schedule[date][empId] = "off";
    });
  });
}

function displayValidationAlerts() {
  if (!appState.lastAlerts) {
    showAlert("Please generate and validate the schedule first.", "warning");
    return;
  }
  showAlert(appState.lastAlerts, appState.lastAlertType);
}

// ==================== Event Listeners ==================== //

function attachButtonEventListeners() {
  // Main action buttons
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", generateSchedule);
  }

  const manageEmployeesBtn = document.getElementById("manageEmployeesBtn");
  if (manageEmployeesBtn) {
    manageEmployeesBtn.addEventListener("click", showEmployeeModal);
  }

  const leaveRequestBtn = document.getElementById("leaveRequestBtn");
  if (leaveRequestBtn) {
    leaveRequestBtn.addEventListener("click", showLeaveModal);
  }

  // Schedule action buttons
  const loadScheduleBtn = document.getElementById("loadScheduleBtn");
  if (loadScheduleBtn) {
    loadScheduleBtn.addEventListener("click", loadSelectedSchedule);
  }

  const saveScheduleBtn = document.getElementById("saveScheduleBtn");
  if (saveScheduleBtn) {
    saveScheduleBtn.addEventListener("click", saveCurrentSchedule);
  }

  const deleteScheduleBtn = document.getElementById("deleteScheduleBtn");
  if (deleteScheduleBtn) {
    deleteScheduleBtn.addEventListener("click", deleteSelectedSchedule);
  }

  const exportScheduleBtn = document.getElementById("exportScheduleBtn");
  if (exportScheduleBtn) {
    exportScheduleBtn.addEventListener("click", exportToExcel);
  }

  // Header buttons
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Employee modal buttons
  const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");
  if (saveEmployeeBtn) {
    saveEmployeeBtn.addEventListener("click", saveEmployee);
  }

  const deleteEmployeeBtn = document.getElementById("deleteEmployeeBtn");
  if (deleteEmployeeBtn) {
    deleteEmployeeBtn.addEventListener("click", deleteEmployee);
  }

  const closeEmployeeModalBtn = document.getElementById("closeEmployeeModal");
  if (closeEmployeeModalBtn) {
    closeEmployeeModalBtn.addEventListener("click", closeEmployeeModal);
  }

  // Leave modal buttons
  const addLeaveBtn = document.getElementById("addLeaveBtn");
  if (addLeaveBtn) {
    addLeaveBtn.addEventListener("click", addLeaveRequest);
  }

  const clearLeaveBtn = document.getElementById("clearLeaveBtn");
  if (clearLeaveBtn) {
    clearLeaveBtn.addEventListener("click", clearAllLeave);
  }

  const closeLeaveModalBtn = document.getElementById("closeLeaveModal");
  if (closeLeaveModalBtn) {
    closeLeaveModalBtn.addEventListener("click", closeLeaveModal);
  }

  // Clear modal buttons
  const confirmClearBtn = document.getElementById("confirmClearBtn");
  if (confirmClearBtn) {
    confirmClearBtn.addEventListener("click", confirmClear);
  }

  const cancelClearBtn = document.getElementById("cancelClearBtn");
  if (cancelClearBtn) {
    cancelClearBtn.addEventListener("click", closeClearModal);
  }

  const closeClearModalBtn = document.getElementById("closeClearModal");
  if (closeClearModalBtn) {
    closeClearModalBtn.addEventListener("click", closeClearModal);
  }

  // Employee select dropdown
  const employeeSelect = document.getElementById("employeeSelect");
  if (employeeSelect) {
    employeeSelect.addEventListener("change", handleEmployeeSelection);
  }
}

// Date validation
document
  .getElementById("scheduleStart")
  .addEventListener("change", function () {
    const selectedDate = new Date(this.value);
    if (selectedDate.getDay() !== 0) {
      showAlert("Please select a Sunday as the start date", "error");
      const sunday = new Date(selectedDate);
      sunday.setDate(selectedDate.getDate() - selectedDate.getDay());
      this.value = sunday.toISOString().split("T")[0];
    }
  });

// Modal close handlers
window.onclick = function (event) {
  const leaveModal = document.getElementById("leaveModal");
  const employeeModal = document.getElementById("employeeModal");
  const clearModal = document.getElementById("clearModal");
  if (event.target === leaveModal) {
    closeLeaveModal();
  }
  if (event.target === employeeModal) {
    closeEmployeeModal();
  }
  if (event.target === clearModal) {
    closeClearModal();
  }
};
