// Schedule Optimization Module
// Following CLAUDE.md best practices for separation of concerns

// ==================== Schedule Optimization ==================== //

function optimizeSchedule() {
  const dates = Object.keys(appState.schedule).sort();
  let improvements = 0;

  improvements += optimizeOffDayRequirements(dates);
  improvements += balanceWorkloadAcrossEmployees(dates);
  optimizeWorkLifeBalanceForAll(dates);

  renderSchedule();
  updateStatistics();
  validateSchedule();

  showAlert(`Schedule optimized! ${improvements} improvements made`, "success");
}

function optimizeOffDayRequirements(dates) {
  let improvements = 0;

  appState.employees.forEach((emp) => {
    const week1Days = dates.slice(0, 7);
    const week2Days = dates.slice(7, 14);

    [week1Days, week2Days].forEach((weekDays, weekNum) => {
      const offDays = countOffDays(emp.id, weekDays);

      if (offDays < 2) {
        improvements += addRequiredOffDays(emp, weekDays, 2 - offDays);
      }
    });
  });

  return improvements;
}

function countOffDays(empId, weekDays) {
  return weekDays.filter(
    (date) =>
      appState.schedule[date][empId] === "off" ||
      appState.schedule[date][empId] === "leave",
  ).length;
}

function addRequiredOffDays(emp, weekDays, daysNeeded) {
  let daysAdded = 0;

  weekDays.forEach((date) => {
    if (
      daysAdded < daysNeeded &&
      appState.schedule[date][emp.id] !== "off" &&
      appState.schedule[date][emp.id] !== "leave"
    ) {
      const replacementEmployee = findReplacementEmployee(emp.id, date);
      if (replacementEmployee) {
        swapShifts(emp.id, replacementEmployee.id, date);
        daysAdded++;
      }
    }
  });

  return daysAdded;
}

function findReplacementEmployee(empId, date) {
  const currentShift = appState.schedule[date][empId];
  return appState.employees.find(
    (otherEmp) =>
      otherEmp.id !== empId &&
      appState.schedule[date][otherEmp.id] === "off" &&
      canTakeShift(otherEmp.id, date, currentShift),
  );
}

function swapShifts(empId1, empId2, date) {
  const shift1 = appState.schedule[date][empId1];
  const shift2 = appState.schedule[date][empId2];

  appState.schedule[date][empId1] = shift2;
  appState.schedule[date][empId2] = shift1;
}

function balanceWorkloadAcrossEmployees(dates) {
  let improvements = 0;

  appState.employees.forEach((emp) => {
    if (emp.canSeniorDuty) return; // Skip senior duty optimization

    const totalHours = calculateEmployeeTotalHours(emp.id, dates);

    if (totalHours > 80) {
      // More than 80 hours in 2 weeks
      if (redistributeWorkload(emp.id, dates)) {
        improvements++;
      }
    }
  });

  return improvements;
}

function calculateEmployeeTotalHours(empId, dates) {
  let totalHours = 0;
  dates.forEach((date) => {
    const shift = shifts[appState.schedule[date][empId]];
    totalHours += shift.hours;
  });
  return totalHours;
}

function redistributeWorkload(empId, dates) {
  const workDays = dates.filter(
    (date) =>
      appState.schedule[date][empId] !== "off" &&
      appState.schedule[date][empId] !== "leave",
  );

  const halfPoint = Math.floor(workDays.length / 2);

  for (let i = halfPoint; i < workDays.length; i++) {
    const date = workDays[i];
    const replacementEmployee = findReplacementEmployee(empId, date);

    if (replacementEmployee) {
      swapShifts(empId, replacementEmployee.id, date);
      return true;
    }
  }

  return false;
}

function optimizeWorkLifeBalanceForAll(dates) {
  appState.employees.forEach((emp) => {
    optimizeWorkLifeBalance(emp.id, dates);
  });
}

function optimizeWorkLifeBalance(empId, dates) {
  const offDays = dates.filter(
    (date) => appState.schedule[date][empId] === "off",
  );

  if (offDays.length >= 2) {
    createConsecutiveOffDays(empId, dates);
  }
}

function createConsecutiveOffDays(empId, dates) {
  for (let i = 0; i < dates.length - 1; i++) {
    const today = dates[i];
    const tomorrow = dates[i + 1];

    if (shouldSwapForConsecutiveOff(empId, today, tomorrow)) {
      const swapCandidate = findSwapCandidateForOffDay(empId, tomorrow);

      if (swapCandidate) {
        swapShifts(empId, swapCandidate.id, tomorrow);
      }
    }
  }
}

function shouldSwapForConsecutiveOff(empId, today, tomorrow) {
  return (
    appState.schedule[today][empId] === "off" &&
    appState.schedule[tomorrow][empId] !== "off" &&
    appState.schedule[tomorrow][empId] !== "leave"
  );
}

function findSwapCandidateForOffDay(empId, date) {
  const currentShift = appState.schedule[date][empId];

  return appState.employees.find(
    (otherEmp) =>
      otherEmp.id !== empId &&
      appState.schedule[date][otherEmp.id] === "off" &&
      canTakeShift(otherEmp.id, date, currentShift) &&
      !checkNightToMorningViolation(otherEmp.id, date, currentShift),
  );
}

function canTakeShift(empId, date, shiftType) {
  const emp = appState.employees.find((e) => e.id === empId);

  if (!checkSeniorDutyRequirement(emp, date, shiftType)) return false;
  if (checkNightToMorningViolation(emp.id, date, shiftType)) return false;
  if (!checkConsecutiveDaysRule(emp.id, date)) return false;

  return true;
}

function checkSeniorDutyRequirement(emp, date, shiftType) {
  if (shiftType === "day" && !emp.canSeniorDuty) {
    return hasSeniorCoverageForDay(date);
  }
  return true;
}

function hasSeniorCoverageForDay(date) {
  return appState.employees.some(
    (otherEmp) =>
      otherEmp.canSeniorDuty &&
      appState.schedule[date][otherEmp.id] !== "off" &&
      appState.schedule[date][otherEmp.id] !== "leave",
  );
}

function checkConsecutiveDaysRule(empId, date) {
  const dates = Object.keys(appState.schedule).sort();
  const dateIndex = dates.indexOf(date);
  let consecutive = 0;

  // Count backwards to check consecutive working days
  for (let i = dateIndex - 1; i >= 0; i--) {
    if (
      appState.schedule[dates[i]][empId] !== "off" &&
      appState.schedule[dates[i]][empId] !== "leave"
    ) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive < 3;
}

// ==================== Schedule Analysis and Reporting ==================== //

function getEmployeeWorkload(empId) {
  const dates = Object.keys(appState.schedule);
  let totalHours = 0;
  let otHours = 0;
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  dates.forEach((date) => {
    const shiftType = appState.schedule[date][empId];
    const shift = shifts[shiftType];
    totalHours += shift.hours;

    if (shift.hours === 12) otHours += 4;

    if (shift.hours > 0) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  });

  return {
    totalHours,
    otHours,
    maxConsecutive,
    weeklyAverage: totalHours / 2,
  };
}

function generateDetailedReport() {
  let report = "=== HEALTHCARE SCHEDULE ANALYSIS ===\n\n";

  report += generateEmployeeWorkloadReport();
  report += generateCoverageAnalysisReport();

  console.log(report);
  return report;
}

function generateEmployeeWorkloadReport() {
  let report = "EMPLOYEE WORKLOAD ANALYSIS:\n";
  report += "-".repeat(50) + "\n";

  appState.employees.forEach((emp) => {
    const workload = getEmployeeWorkload(emp.id);
    report += `${emp.name} (${emp.role}):\n`;
    report += `  Total Hours: ${workload.totalHours}h\n`;
    report += `  Overtime: ${workload.otHours}h\n`;
    report += `  Max Consecutive Days: ${workload.maxConsecutive}\n`;
    report += `  Weekly Average: ${workload.weeklyAverage}h\n\n`;
  });

  return report;
}

function generateCoverageAnalysisReport() {
  let report = "SHIFT COVERAGE ANALYSIS:\n";
  report += "-".repeat(50) + "\n";

  const dates = Object.keys(appState.schedule).sort();
  dates.forEach((date) => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    report += `${dayName} ${dateObj.getDate()}:\n`;

    ["day", "evening", "night"].forEach((shift) => {
      const coverage = appState.employees.filter((emp) => {
        const empShift = appState.schedule[date][emp.id];
        return (
          empShift === shift ||
          (shift === "day" && empShift === "day-ot") ||
          (shift === "night" && empShift === "night-ot")
        );
      });

      report += `  ${shift.charAt(0).toUpperCase() + shift.slice(1)}: ${coverage.length} staff\n`;
    });
    report += "\n";
  });

  return report;
}
