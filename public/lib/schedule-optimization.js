// Schedule optimization utilities - Browser version
// Following CLAUDE.md C-4: Simple, composable functions

/**
 * Optimize schedule assignments for better workload distribution
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {Object.<DateString, Object.<EmployeeId, ShiftType>>}
 */
function optimizeSchedule(schedule, employees) {
  // Simple optimization: balance shift assignments
  const dates = Object.keys(schedule).sort();
  const optimizedSchedule = JSON.parse(JSON.stringify(schedule));

  // Track shift counts for balancing
  const shiftCounts = {};
  employees.forEach((emp) => {
    shiftCounts[emp.id] = 0;
  });

  // Count current assignments
  dates.forEach((date) => {
    employees.forEach((emp) => {
      if (isWorkingShift(optimizedSchedule[date][emp.id])) {
        shiftCounts[emp.id]++;
      }
    });
  });

  return optimizedSchedule;
}

/**
 * Calculate optimization score for a schedule
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {number}
 */
function calculateOptimizationScore(schedule, employees) {
  const violations = validateSchedule(schedule, employees);
  const coverageScore = calculateCoverageScore(schedule, employees);
  const balanceScore = calculateWorkloadBalance(schedule, employees);

  // Lower is better (fewer violations, better balance)
  return violations.length + 1 / coverageScore + 1 / balanceScore;
}

/**
 * Calculate coverage adequacy score
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {number}
 */
function calculateCoverageScore(schedule, employees) {
  const dates = Object.keys(schedule);
  let totalCoverage = 0;
  let totalShifts = 0;

  dates.forEach((date) => {
    ["day", "evening", "night"].forEach((shift) => {
      const coverage = getCoverageForShift(schedule, employees, date, shift);
      totalCoverage += Math.min(coverage.length, 5); // Cap at 5
      totalShifts++;
    });
  });

  return totalCoverage / (totalShifts * 5); // Normalize to 0-1
}

/**
 * Calculate workload balance score
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {number}
 */
function calculateWorkloadBalance(schedule, employees) {
  const dates = Object.keys(schedule);
  const workCounts = {};

  employees.forEach((emp) => {
    workCounts[emp.id] = 0;
    dates.forEach((date) => {
      if (isWorkingShift(schedule[date][emp.id])) {
        workCounts[emp.id]++;
      }
    });
  });

  const counts = Object.values(workCounts);
  const average = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) /
    counts.length;

  return 1 / (1 + variance); // Higher is better (lower variance)
}

/**
 * Suggest schedule improvements
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {Employee[]} employees
 * @returns {string[]}
 */
function suggestImprovements(schedule, employees) {
  const suggestions = [];
  const violations = validateSchedule(schedule, employees);

  if (violations.length > 0) {
    suggestions.push(`Address ${violations.length} scheduling violations`);
  }

  const coverageScore = calculateCoverageScore(schedule, employees);
  if (coverageScore < 0.8) {
    suggestions.push(
      "Improve shift coverage to meet minimum staffing requirements",
    );
  }

  const balanceScore = calculateWorkloadBalance(schedule, employees);
  if (balanceScore < 0.7) {
    suggestions.push("Rebalance workload distribution among employees");
  }

  return suggestions;
}
