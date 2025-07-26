// Employee management utilities - Browser version
// Following CLAUDE.md C-4: Simple, composable functions

/**
 * Create a new employee record
 * @param {string} name
 * @param {string} role
 * @param {boolean} canSeniorDuty
 * @param {number} tenure
 * @returns {Employee}
 */
function createEmployee(name, role, canSeniorDuty = false, tenure = 0) {
  return {
    id: generateEmployeeId(),
    name: name.trim(),
    role,
    canSeniorDuty,
    tenure,
  };
}

/**
 * Generate unique employee ID
 * @returns {number}
 */
function generateEmployeeId() {
  // Simple ID generation - in practice, use better method
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Validate employee data
 * @param {Employee} employee
 * @returns {{isValid: boolean, errors: string[]}}
 */
function validateEmployee(employee) {
  const errors = [];

  if (!employee.name || employee.name.trim().length < 2) {
    errors.push("Employee name must be at least 2 characters");
  }

  if (!employee.role || !REQUIRED_ROLES.includes(employee.role)) {
    errors.push("Invalid employee role");
  }

  if (typeof employee.canSeniorDuty !== "boolean") {
    errors.push("Senior duty qualification must be specified");
  }

  if (typeof employee.tenure !== "number" || employee.tenure < 0) {
    errors.push("Tenure must be a positive number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Update employee information
 * @param {Employee} employee
 * @param {Partial<Employee>} updates
 * @returns {Employee}
 */
function updateEmployee(employee, updates) {
  const updated = { ...employee, ...updates };
  const validation = validateEmployee(updated);

  if (!validation.isValid) {
    throw new Error(`Invalid employee data: ${validation.errors.join(", ")}`);
  }

  return updated;
}

/**
 * Check if employee can be assigned to a specific role
 * @param {Employee} employee
 * @param {string} targetRole
 * @returns {boolean}
 */
function canAssignToRole(employee, targetRole) {
  // Basic role compatibility check
  if (targetRole === "Senior-on-Duty") {
    return employee.canSeniorDuty;
  }

  return employee.role === targetRole;
}

/**
 * Get employees by role
 * @param {Employee[]} employees
 * @param {string} role
 * @returns {Employee[]}
 */
function getEmployeesByRole(employees, role) {
  return employees.filter((emp) => emp.role === role);
}

/**
 * Get senior duty qualified employees
 * @param {Employee[]} employees
 * @returns {Employee[]}
 */
function getSeniorDutyEmployees(employees) {
  return employees.filter((emp) => emp.canSeniorDuty);
}

/**
 * Calculate employee statistics
 * @param {Employee} employee
 * @param {Object.<DateString, Object.<EmployeeId, ShiftType>>} schedule
 * @returns {Object}
 */
function calculateEmployeeStats(employee, schedule) {
  const dates = Object.keys(schedule).sort();
  let workDays = 0;
  let offDays = 0;
  let totalHours = 0;
  let otHours = 0;

  const shifts = {
    day: { hours: 8 },
    evening: { hours: 8 },
    night: { hours: 8 },
    "day-ot": { hours: 12 },
    "night-ot": { hours: 12 },
    off: { hours: 0 },
    leave: { hours: 0 },
  };

  dates.forEach((date) => {
    const shift = schedule[date][employee.id];
    const shiftInfo = shifts[shift] || { hours: 0 };

    totalHours += shiftInfo.hours;

    if (shiftInfo.hours === 12) {
      otHours += 4; // 4 hours OT for 12-hour shifts
    }

    if (isWorkingShift(shift)) {
      workDays++;
    } else {
      offDays++;
    }
  });

  return {
    workDays,
    offDays,
    totalHours,
    otHours,
  };
}
