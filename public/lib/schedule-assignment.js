// Schedule assignment logic - simplified from complex assignShiftType function - Browser version
// Following CLAUDE.md C-9: Extract functions only when needed for reuse or testing

/**
 * Assign shifts for a specific shift type on a date
 * Replaces the complex assignShiftType function from original code
 * @param {ScheduleAssignmentParams} params
 * @param {Object.<EmployeeId, number>} shiftCounts
 * @param {number} otCounter
 * @returns {{ assigned: number, updatedOtCounter: number }}
 */
function assignShiftsForType(params, shiftCounts, otCounter) {
  const {
    date,
    shiftType,
    availableEmployees,
    consecutiveDays,
    weekNum,
    dates,
    schedule,
    offDaysCount,
  } = params;

  let assigned = 0;
  let currentOtCounter = otCounter;
  const assignedDepartments = new Set();

  // Use provided off days count or calculate if not provided
  const finalOffDaysCount = offDaysCount || {};
  if (!offDaysCount) {
    availableEmployees.forEach((emp) => {
      finalOffDaysCount[emp.id] = calculateEmployeeOffDays(
        emp.id,
        weekNum,
        dates,
        schedule,
      );
    });
  }

  // Get prioritized employee list
  const sortedEmployees = prioritizeEmployees(
    availableEmployees,
    date,
    finalOffDaysCount,
    consecutiveDays,
    shiftCounts,
    schedule,
  );

  // Phase 1: Ensure department coverage
  assigned += assignDepartmentCoverage({
    date,
    shiftType,
    sortedEmployees,
    consecutiveDays,
    offDaysCount: finalOffDaysCount,
    weekNum,
    dates,
    schedule,
    assignedDepartments,
    shiftCounts,
    otCounter: currentOtCounter,
  });

  // Update OT counter for each assignment
  currentOtCounter += assigned;

  // Phase 2: Fill remaining positions
  const additionalAssigned = fillRemainingPositions({
    date,
    shiftType,
    sortedEmployees,
    consecutiveDays,
    offDaysCount: finalOffDaysCount,
    weekNum,
    dates,
    schedule,
    assigned,
    shiftCounts,
    otCounter: currentOtCounter,
  });

  assigned += additionalAssigned;
  currentOtCounter += additionalAssigned;

  return { assigned, updatedOtCounter: currentOtCounter };
}

/**
 * Assign department coverage for shift
 * @param {Object} params
 * @returns {number} Number of employees assigned
 */
function assignDepartmentCoverage(params) {
  const {
    date,
    shiftType,
    sortedEmployees,
    consecutiveDays,
    offDaysCount: finalOffDaysCount,
    weekNum,
    dates,
    schedule,
    assignedDepartments,
    shiftCounts,
    otCounter,
  } = params;

  let deptAssigned = 0;

  for (const dept of REQUIRED_DEPARTMENTS) {
    if (deptAssigned >= SHIFTS_PER_DAY) break;

    const constraints = {
      date,
      shiftType,
      consecutiveDays,
      offDaysCount: finalOffDaysCount,
      weekNum,
      dates,
      schedule,
      targetDepartment: dept,
      assignedDepartments,
    };

    const deptEmployee = findQualifiedEmployeeForDepartment(
      sortedEmployees,
      dept,
      constraints,
    );

    if (deptEmployee) {
      const finalShift = determineShiftWithOT(
        shiftType,
        date,
        schedule,
        sortedEmployees,
        otCounter + deptAssigned,
      );
      schedule[date][deptEmployee.id] = finalShift;
      assignedDepartments.add(deptEmployee.role);
      shiftCounts[deptEmployee.id] = (shiftCounts[deptEmployee.id] || 0) + 1;
      deptAssigned++;
    }
  }

  return deptAssigned;
}

/**
 * Fill remaining positions with available staff
 * @param {Object} params
 * @returns {number} Number of additional employees assigned
 */
function fillRemainingPositions(params) {
  const {
    date,
    shiftType,
    sortedEmployees,
    consecutiveDays,
    offDaysCount: finalOffDaysCount,
    weekNum,
    dates,
    schedule,
    assigned,
    shiftCounts,
    otCounter,
  } = params;

  let additionalAssigned = 0;
  const priorityDepartments = [
    "ICU",
    "Emergency",
    "WARDS",
    "Senior-on-Duty",
    "Outpatient",
  ];

  while (assigned + additionalAssigned < SHIFTS_PER_DAY) {
    let foundEmployee = null;

    // Try priority departments first
    for (const dept of priorityDepartments) {
      const constraints = {
        date,
        shiftType,
        consecutiveDays,
        offDaysCount: finalOffDaysCount,
        weekNum,
        dates,
        schedule,
        targetDepartment: dept,
      };

      foundEmployee = findQualifiedEmployeeForDepartment(
        sortedEmployees,
        dept,
        constraints,
      );
      if (foundEmployee) break;
    }

    // If no departmental match, find any available
    if (!foundEmployee) {
      const constraints = {
        date,
        shiftType,
        consecutiveDays,
        offDaysCount: finalOffDaysCount,
        weekNum,
        dates,
        schedule,
      };
      foundEmployee = findAnyQualifiedEmployee(sortedEmployees, constraints);
    }

    if (foundEmployee) {
      const finalShift = determineShiftWithOT(
        shiftType,
        date,
        schedule,
        sortedEmployees,
        otCounter + additionalAssigned,
      );
      schedule[date][foundEmployee.id] = finalShift;
      shiftCounts[foundEmployee.id] = (shiftCounts[foundEmployee.id] || 0) + 1;
      additionalAssigned++;
    } else {
      break; // No more qualified employees available
    }
  }

  return additionalAssigned;
}

/**
 * Assign daily shifts for all shift types
 * @param {DateString} date
 * @param {number} dayIndex
 * @param {Employee[]} employees
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @param {DateString[]} dates
 * @param {Object.<EmployeeId, number>} consecutiveDays
 * @param {Object.<EmployeeId, number>} shiftCounts
 * @param {number} otCounter
 * @returns {number} Updated OT counter
 */
function assignDailyShifts(
  date,
  dayIndex,
  employees,
  schedule,
  dates,
  consecutiveDays,
  shiftCounts,
  otCounter,
) {
  const availableEmployees = employees.filter(
    (emp) => schedule[date][emp.id] !== "leave",
  );

  const shiftTypes = ["day", "evening", "night"];
  const weekNum = dayIndex >= 7 ? 1 : 0;
  let currentOtCounter = otCounter;

  for (const shiftType of shiftTypes) {
    const params = {
      date,
      shiftType,
      availableEmployees,
      consecutiveDays,
      weekNum,
      dates,
      schedule,
    };

    const result = assignShiftsForType(params, shiftCounts, currentOtCounter);
    currentOtCounter = result.updatedOtCounter;
  }

  // Update consecutive days tracking
  employees.forEach((emp) => {
    if (
      schedule[date][emp.id] !== "off" &&
      schedule[date][emp.id] !== "leave"
    ) {
      consecutiveDays[emp.id]++;
    } else {
      consecutiveDays[emp.id] = 0;
    }
  });

  return currentOtCounter;
}
