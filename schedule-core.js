// Core scheduling logic - pure functions for business rules
// Following CLAUDE.md C-4: Prefer simple, composable, testable functions

const REQUIRED_DEPARTMENTS = [
  "Senior-on-Duty",
  "ICU",
  "WARDS",
  "Emergency",
  "Outpatient",
];

const SHIFTS_PER_DAY = 5;
const MAX_CONSECUTIVE_DAYS = 3;
const MIN_OFF_DAYS_PER_WEEK = 2;
const MAX_SHIFTS_PER_WEEK = 5;

/**
 * Check if shift type represents working time
 * @param {ShiftType} shiftType
 * @returns {boolean}
 */
function isWorkingShift(shiftType) {
  return shiftType !== "off" && shiftType !== "leave";
}

/**
 * Check if night-to-morning scheduling violation exists
 * @param {ShiftType} prevShift
 * @param {ShiftType} currentShift
 * @returns {boolean}
 */
function isNightToMorningViolation(prevShift, currentShift) {
  const isNightShift = prevShift === "night" || prevShift === "night-ot";
  const isMorningShift = currentShift === "day" || currentShift === "day-ot";
  return isNightShift && isMorningShift;
}

/**
 * Check if employee has night-to-morning violation for given date
 * @param {EmployeeId} empId
 * @param {DateString} date
 * @param {ShiftType} shiftType
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @returns {boolean}
 */
function checkNightToMorningViolation(empId, date, shiftType, schedule) {
  if (shiftType !== "day" && shiftType !== "day-ot") return false;

  const dates = Object.keys(schedule).sort();
  const dateIndex = dates.indexOf(date);

  if (dateIndex > 0) {
    const previousDate = dates[dateIndex - 1];
    const previousShift = schedule[previousDate][empId];
    return previousShift === "night" || previousShift === "night-ot";
  }
  return false;
}

/**
 * Count weekly shifts for employee
 * @param {EmployeeId} empId
 * @param {number} weekNum
 * @param {DateString[]} dates
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @returns {number}
 */
function getWeeklyShiftCount(empId, weekNum, dates, schedule) {
  const weekStart = weekNum === 0 ? dates[0] : dates[7];
  const weekEnd = weekNum === 0 ? dates[6] : dates[13];
  let count = 0;

  for (let d = dates.indexOf(weekStart); d <= dates.indexOf(weekEnd); d++) {
    const currentDate = dates[d];
    const shift = schedule[currentDate][empId];
    if (isWorkingShift(shift)) count++;
  }
  return count;
}

/**
 * Calculate off days count for employee in given week
 * @param {EmployeeId} empId
 * @param {number} weekNum
 * @param {DateString[]} dates
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @returns {number}
 */
function calculateEmployeeOffDays(empId, weekNum, dates, schedule) {
  const weekStart = weekNum === 0 ? dates[0] : dates[7];
  const weekEnd = weekNum === 0 ? dates[6] : dates[13];
  let count = 0;

  for (let d = dates.indexOf(weekStart); d <= dates.indexOf(weekEnd); d++) {
    const currentDate = dates[d];
    const shift = schedule[currentDate][empId];
    if (shift === "off" || shift === "leave") {
      count++;
    }
  }
  return count;
}

/**
 * Check if employee qualifies for shift assignment
 * @param {Employee} employee
 * @param {Object} constraints
 * @returns {boolean}
 */
function isEmployeeQualified(employee, constraints) {
  const {
    date,
    shiftType,
    consecutiveDays,
    offDaysCount,
    weekNum,
    dates,
    schedule,
    targetDepartment = null,
    assignedDepartments = new Set(),
  } = constraints;

  // Basic availability check
  if (schedule[date][employee.id] !== "off") return false;

  // Consecutive days check
  if (consecutiveDays[employee.id] >= MAX_CONSECUTIVE_DAYS) return false;

  // Off days requirement check - need enough off days remaining
  if (offDaysCount[employee.id] >= MIN_OFF_DAYS_PER_WEEK) return false;

  // Weekly shift limit check
  if (
    getWeeklyShiftCount(employee.id, weekNum, dates, schedule) >=
    MAX_SHIFTS_PER_WEEK
  )
    return false;

  // Night-to-morning violation check
  if (checkNightToMorningViolation(employee.id, date, shiftType, schedule))
    return false;

  // Department-specific checks
  if (targetDepartment) {
    if (employee.role !== targetDepartment) return false;
    if (assignedDepartments.has(employee.role)) return false;
  }

  return true;
}

/**
 * Find qualified employee for department
 * @param {Employee[]} employees
 * @param {string} department
 * @param {Object} constraints
 * @returns {Employee|null}
 */
function findQualifiedEmployeeForDepartment(
  employees,
  department,
  constraints,
) {
  return (
    employees.find(
      (emp) =>
        emp.role === department &&
        isEmployeeQualified(emp, {
          ...constraints,
          targetDepartment: department,
        }),
    ) || null
  );
}

/**
 * Find any available qualified employee
 * @param {Employee[]} employees
 * @param {Object} constraints
 * @returns {Employee|null}
 */
function findAnyQualifiedEmployee(employees, constraints) {
  return employees.find((emp) => isEmployeeQualified(emp, constraints)) || null;
}

/**
 * Prioritize employees for shift assignment
 * @param {Employee[]} availableEmployees
 * @param {DateString} date
 * @param {Object.<EmployeeId, number>} offDaysCount
 * @param {Object.<EmployeeId, number>} consecutiveDays
 * @param {Object.<EmployeeId, number>} shiftCounts
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @returns {Employee[]}
 */
function prioritizeEmployees(
  availableEmployees,
  date,
  offDaysCount,
  consecutiveDays,
  shiftCounts,
  schedule,
) {
  return availableEmployees
    .filter((emp) => schedule[date][emp.id] === "off")
    .sort((a, b) => {
      // Primary: balance shift assignments
      const shiftDiff = (shiftCounts[a.id] || 0) - (shiftCounts[b.id] || 0);
      if (shiftDiff !== 0) return shiftDiff;

      // Secondary: prioritize employees needing off days less
      const aOffDaysNeeded = MIN_OFF_DAYS_PER_WEEK - offDaysCount[a.id];
      const bOffDaysNeeded = MIN_OFF_DAYS_PER_WEEK - offDaysCount[b.id];
      if (aOffDaysNeeded !== bOffDaysNeeded) {
        return bOffDaysNeeded - aOffDaysNeeded;
      }

      // Tertiary: prefer employees with fewer consecutive days
      return consecutiveDays[a.id] - consecutiveDays[b.id];
    });
}

/**
 * Determine if overtime should be assigned
 * @param {ShiftType} baseShift
 * @param {DateString} date
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @param {number} otCounter
 * @returns {ShiftType}
 */
function determineShiftWithOT(baseShift, date, schedule, employees, otCounter) {
  if (baseShift === "day" || baseShift === "night") {
    const otType = baseShift === "day" ? "day-ot" : "night-ot";
    const otAlreadyAssigned = employees.some(
      (e) => schedule[date][e.id] === otType,
    );

    if (!otAlreadyAssigned && otCounter % 4 === 0) {
      return otType;
    }
  }
  return baseShift;
}

export {
  isWorkingShift,
  isNightToMorningViolation,
  checkNightToMorningViolation,
  getWeeklyShiftCount,
  calculateEmployeeOffDays,
  isEmployeeQualified,
  findQualifiedEmployeeForDepartment,
  findAnyQualifiedEmployee,
  prioritizeEmployees,
  determineShiftWithOT,
  REQUIRED_DEPARTMENTS,
  SHIFTS_PER_DAY,
  MAX_CONSECUTIVE_DAYS,
  MIN_OFF_DAYS_PER_WEEK,
  MAX_SHIFTS_PER_WEEK,
};
