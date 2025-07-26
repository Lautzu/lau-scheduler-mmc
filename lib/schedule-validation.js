// Schedule validation logic - separated from main scheduler
// Following CLAUDE.md C-4: Composable, testable functions
import {
  isWorkingShift,
  isNightToMorningViolation,
  REQUIRED_DEPARTMENTS,
  MIN_OFF_DAYS_PER_WEEK,
  MAX_CONSECUTIVE_DAYS,
} from "./schedule-core.js";

/**
 * Validate entire schedule and return violations
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {string[]} Array of violation messages
 */
function validateSchedule(schedule, employees) {
  const violations = [];
  const dates = Object.keys(schedule).sort();

  violations.push(...validateCoverage(schedule, employees, dates));
  violations.push(...validateEmployeeConstraints(schedule, employees, dates));

  return violations;
}

/**
 * Validate shift coverage requirements
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {DateString[]} dates
 * @returns {string[]}
 */
function validateCoverage(schedule, employees, dates) {
  const violations = [];

  dates.forEach((date) => {
    ["day", "evening", "night"].forEach((shift) => {
      const coverage = getCoverageForShift(schedule, employees, date, shift);

      if (coverage.length < 5) {
        violations.push(
          `⚠️ Low coverage on ${date} ${shift} shift: ${coverage.length}/5 staff`,
        );
      }

      const missingDepts = findMissingDepartments(
        coverage,
        REQUIRED_DEPARTMENTS,
      );
      if (missingDepts.length > 0) {
        violations.push(
          `🏥 Missing departments on ${date} ${shift}: ${missingDepts.join(", ")}`,
        );
      }
    });

    if (!hasSeniorDutyPresence(schedule, employees, date)) {
      violations.push(`👨‍⚕️ No Senior-on-Duty present on ${date}`);
    }
  });

  return violations;
}

/**
 * Get employees assigned to specific shift on date
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {DateString} date
 * @param {ShiftType} shiftType
 * @returns {Employee[]}
 */
function getCoverageForShift(schedule, employees, date, shiftType) {
  return employees.filter((emp) =>
    isShiftMatch(schedule[date][emp.id], shiftType),
  );
}

/**
 * Check if employee shift matches target shift (including overtime variants)
 * @param {ShiftType} empShift
 * @param {ShiftType} targetShift
 * @returns {boolean}
 */
function isShiftMatch(empShift, targetShift) {
  return (
    empShift === targetShift ||
    (targetShift === "day" && empShift === "day-ot") ||
    (targetShift === "night" && empShift === "night-ot")
  );
}

/**
 * Find departments not represented in coverage
 * @param {Employee[]} coverage
 * @param {string[]} requiredDepartments
 * @returns {string[]}
 */
function findMissingDepartments(coverage, requiredDepartments) {
  const representedDepts = new Set(coverage.map((emp) => emp.role));
  return requiredDepartments.filter((dept) => !representedDepts.has(dept));
}

/**
 * Check if senior duty staff is present on date
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {DateString} date
 * @returns {boolean}
 */
function hasSeniorDutyPresence(schedule, employees, date) {
  return employees.some(
    (emp) => emp.canSeniorDuty && isWorkingShift(schedule[date][emp.id]),
  );
}

/**
 * Validate employee-specific constraints
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {DateString[]} dates
 * @returns {string[]}
 */
function validateEmployeeConstraints(schedule, employees, dates) {
  const violations = [];

  employees.forEach((emp) => {
    violations.push(...validateConsecutiveDays(schedule, emp, dates));
    violations.push(...validateNightToMorning(schedule, emp, dates));
    violations.push(...validateOffDayRequirements(schedule, emp, dates));
  });

  return violations;
}

/**
 * Validate consecutive working days constraint
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee} employee
 * @param {DateString[]} dates
 * @returns {string[]}
 */
function validateConsecutiveDays(schedule, employee, dates) {
  const violations = [];
  let consecutive = 0;
  let maxConsecutive = 0;

  dates.forEach((date) => {
    if (isWorkingShift(schedule[date][employee.id])) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  });

  if (maxConsecutive > MAX_CONSECUTIVE_DAYS) {
    violations.push(
      `⏰ ${employee.name} has ${maxConsecutive} consecutive working days`,
    );
  }

  return violations;
}

/**
 * Validate night-to-morning shift violations
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee} employee
 * @param {DateString[]} dates
 * @returns {string[]}
 */
function validateNightToMorning(schedule, employee, dates) {
  const violations = [];

  dates.forEach((date, index) => {
    if (index > 0) {
      const prevDate = dates[index - 1];
      const prevShift = schedule[prevDate][employee.id];
      const currentShift = schedule[date][employee.id];

      if (isNightToMorningViolation(prevShift, currentShift)) {
        violations.push(
          `🔥 ${employee.name} has a night shift followed by a morning shift on ${date}`,
        );
      }
    }
  });

  return violations;
}

/**
 * Validate minimum off days per week requirement
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee} employee
 * @param {DateString[]} dates
 * @returns {string[]}
 */
function validateOffDayRequirements(schedule, employee, dates) {
  const violations = [];
  const week1Days = dates.slice(0, 7);
  const week2Days = dates.slice(7, 14);

  [week1Days, week2Days].forEach((weekDays, weekNum) => {
    const offDays = weekDays.filter(
      (date) => !isWorkingShift(schedule[date][employee.id]),
    ).length;

    if (offDays < MIN_OFF_DAYS_PER_WEEK) {
      violations.push(
        `📅 ${employee.name} has only ${offDays} days off in week ${weekNum + 1} (minimum ${MIN_OFF_DAYS_PER_WEEK} required)`,
      );
    }
  });

  return violations;
}

/**
 * Calculate schedule statistics
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {Object.<ShiftType, {hours: number}>} shifts
 * @returns {Object}
 */
function calculateScheduleStatistics(schedule, employees, shifts) {
  let totalHours = 0;
  let otHours = 0;
  let totalShifts = 0;
  const dates = Object.keys(schedule);

  employees.forEach((emp) => {
    dates.forEach((date) => {
      const shiftType = schedule[date][emp.id];
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

/**
 * Get employee violations for export
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {EmployeeId} empId
 * @param {DateString[]} dates
 * @returns {string[]}
 */
function getEmployeeViolations(schedule, empId, dates) {
  const violations = [];

  // Check consecutive days
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  dates.forEach((date) => {
    if (isWorkingShift(schedule[date][empId])) {
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 0;
    }
  });

  if (maxConsecutive > MAX_CONSECUTIVE_DAYS) {
    violations.push(`${maxConsecutive} consecutive days`);
  }

  // Check night-to-morning violations
  dates.forEach((date, index) => {
    if (index > 0) {
      const prevShift = schedule[dates[index - 1]][empId];
      const currentShift = schedule[date][empId];
      if (isNightToMorningViolation(prevShift, currentShift)) {
        violations.push("Night-to-morning shift");
      }
    }
  });

  // Check off days requirement
  const week1OffDays = countEmployeeOffDays(schedule, empId, dates.slice(0, 7));
  const week2OffDays = countEmployeeOffDays(
    schedule,
    empId,
    dates.slice(7, 14),
  );

  if (week1OffDays < MIN_OFF_DAYS_PER_WEEK)
    violations.push("Insufficient off days week 1");
  if (week2OffDays < MIN_OFF_DAYS_PER_WEEK)
    violations.push("Insufficient off days week 2");

  return violations;
}

/**
 * Count employee off days
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {EmployeeId} empId
 * @param {DateString[]} dates
 * @returns {number}
 */
function countEmployeeOffDays(schedule, empId, dates) {
  return dates.filter((date) => {
    const shift = schedule[date][empId];
    return shift === "off" || shift === "leave";
  }).length;
}

export {
  validateSchedule,
  validateCoverage,
  validateEmployeeConstraints,
  getCoverageForShift,
  isShiftMatch,
  findMissingDepartments,
  hasSeniorDutyPresence,
  validateConsecutiveDays,
  validateNightToMorning,
  validateOffDayRequirements,
  calculateScheduleStatistics,
  getEmployeeViolations,
  countEmployeeOffDays,
};
