// Input Validation Utilities
// Following CLAUDE.md best practices for robust validation

const InputValidator = {
  // Employee name validation
  validateEmployeeName(name) {
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return { isValid: false, error: "Employee name is required" };
    }

    if (trimmedName.length < 2) {
      return {
        isValid: false,
        error: "Employee name must be at least 2 characters",
      };
    }

    if (trimmedName.length > 100) {
      return {
        isValid: false,
        error: "Employee name must not exceed 100 characters",
      };
    }

    // Check for valid characters (letters, spaces, periods, commas, hyphens)
    const validNamePattern = /^[a-zA-Z\s\.\,\-]+$/;
    if (!validNamePattern.test(trimmedName)) {
      return {
        isValid: false,
        error: "Employee name contains invalid characters",
      };
    }

    return { isValid: true, value: trimmedName };
  },

  // Role validation
  validateEmployeeRole(role) {
    const validRoles = [
      "Senior-on-Duty",
      "ICU",
      "WARDS",
      "Emergency",
      "Outpatient",
    ];

    if (!role) {
      return { isValid: false, error: "Employee role is required" };
    }

    if (!validRoles.includes(role)) {
      return { isValid: false, error: "Invalid employee role selected" };
    }

    return { isValid: true, value: role };
  },

  // Date validation
  validateDate(dateString, fieldName = "Date") {
    if (!dateString) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    const date = new Date(dateString);
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, error: `${fieldName} is not a valid date` };
    }

    // Check if date is not too far in the past (more than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    if (date < oneYearAgo) {
      return {
        isValid: false,
        error: `${fieldName} cannot be more than 1 year in the past`,
      };
    }

    // Check if date is not too far in the future (more than 2 years)
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(now.getFullYear() + 2);

    if (date > twoYearsFromNow) {
      return {
        isValid: false,
        error: `${fieldName} cannot be more than 2 years in the future`,
      };
    }

    return { isValid: true, value: date };
  },

  // Date range validation
  validateDateRange(startDate, endDate) {
    const startValidation = this.validateDate(startDate, "Start date");
    if (!startValidation.isValid) {
      return startValidation;
    }

    const endValidation = this.validateDate(endDate, "End date");
    if (!endValidation.isValid) {
      return endValidation;
    }

    if (startValidation.value > endValidation.value) {
      return { isValid: false, error: "Start date must be before end date" };
    }

    // Check if date range is reasonable (not more than 6 months)
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
    if (endValidation.value - startValidation.value > sixMonthsInMs) {
      return { isValid: false, error: "Leave period cannot exceed 6 months" };
    }

    return {
      isValid: true,
      value: {
        startDate: startValidation.value,
        endDate: endValidation.value,
      },
    };
  },

  // Schedule start date validation (must be Sunday)
  validateScheduleStartDate(dateString) {
    const dateValidation = this.validateDate(dateString, "Schedule start date");
    if (!dateValidation.isValid) {
      return dateValidation;
    }

    if (dateValidation.value.getDay() !== 0) {
      return { isValid: false, error: "Schedule start date must be a Sunday" };
    }

    return { isValid: true, value: dateValidation.value };
  },

  // Leave type validation
  validateLeaveType(leaveType) {
    const validLeaveTypes = ["vacation", "sick", "personal", "off"];

    if (!leaveType) {
      return { isValid: false, error: "Leave type is required" };
    }

    if (!validLeaveTypes.includes(leaveType)) {
      return { isValid: false, error: "Invalid leave type selected" };
    }

    return { isValid: true, value: leaveType };
  },

  // Employee ID validation
  validateEmployeeId(empId) {
    if (!empId) {
      return { isValid: false, error: "Employee selection is required" };
    }

    const numericId = parseInt(empId);
    if (isNaN(numericId) || numericId <= 0) {
      return { isValid: false, error: "Invalid employee ID" };
    }

    return { isValid: true, value: numericId };
  },

  // Schedule name validation
  validateScheduleName(name) {
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return { isValid: false, error: "Schedule name is required" };
    }

    if (trimmedName.length < 3) {
      return {
        isValid: false,
        error: "Schedule name must be at least 3 characters",
      };
    }

    if (trimmedName.length > 50) {
      return {
        isValid: false,
        error: "Schedule name must not exceed 50 characters",
      };
    }

    // Check for safe filename characters
    const safeNamePattern = /^[a-zA-Z0-9\s\-_\.]+$/;
    if (!safeNamePattern.test(trimmedName)) {
      return {
        isValid: false,
        error: "Schedule name contains invalid characters",
      };
    }

    return { isValid: true, value: trimmedName };
  },
};

// Schedule Business Logic Validation
const ScheduleValidator = {
  // Validate shift assignment constraints
  validateShiftAssignment(empId, date, shiftType) {
    const violations = [];

    // Check night-to-morning violation
    if (this.hasNightToMorningViolation(empId, date, shiftType)) {
      violations.push("Cannot assign morning shift after night shift");
    }

    // Check consecutive days limit
    const consecutiveDays = this.getConsecutiveDaysCount(empId, date);
    if (consecutiveDays >= 3 && shiftType !== "off" && shiftType !== "leave") {
      violations.push("Cannot work more than 3 consecutive days");
    }

    // Check weekly shift limit
    const weeklyShifts = this.getWeeklyShiftCount(empId, date);
    if (weeklyShifts >= 5 && shiftType !== "off" && shiftType !== "leave") {
      violations.push("Cannot work more than 5 shifts per week");
    }

    // Check senior duty requirement for day shifts
    if (shiftType === "day" || shiftType === "day-ot") {
      const emp = appState.employees.find((e) => e.id === empId);
      if (!emp?.canSeniorDuty && !this.hasSeniorDutyCoverage(date)) {
        violations.push("Day shift requires senior duty qualified staff");
      }
    }

    return {
      isValid: violations.length === 0,
      violations: violations,
    };
  },

  hasNightToMorningViolation(empId, date, shiftType) {
    if (shiftType !== "day" && shiftType !== "day-ot") return false;

    const dates = Object.keys(appState.schedule).sort();
    const dateIndex = dates.indexOf(date);

    if (dateIndex > 0) {
      const previousDate = dates[dateIndex - 1];
      const previousShift = appState.schedule[previousDate]?.[empId];
      return previousShift === "night" || previousShift === "night-ot";
    }

    return false;
  },

  getConsecutiveDaysCount(empId, date) {
    const dates = Object.keys(appState.schedule).sort();
    const dateIndex = dates.indexOf(date);
    let consecutive = 0;

    // Count backwards from the day before the target date
    for (let i = dateIndex - 1; i >= 0; i--) {
      const shift = appState.schedule[dates[i]]?.[empId];
      if (shift && shift !== "off" && shift !== "leave") {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  },

  getWeeklyShiftCount(empId, date) {
    const dates = Object.keys(appState.schedule).sort();
    const dateIndex = dates.indexOf(date);
    const weekNum = dateIndex >= 7 ? 1 : 0;

    const weekStart = weekNum === 0 ? dates[0] : dates[7];
    const weekEnd = weekNum === 0 ? dates[6] : dates[13];

    let count = 0;
    for (let d = dates.indexOf(weekStart); d <= dates.indexOf(weekEnd); d++) {
      if (d >= 0 && d < dates.length) {
        const currentDate = dates[d];
        const shift = appState.schedule[currentDate]?.[empId];
        if (shift && shift !== "off" && shift !== "leave") {
          count++;
        }
      }
    }

    return count;
  },

  hasSeniorDutyCoverage(date) {
    return appState.employees.some(
      (emp) =>
        emp.canSeniorDuty &&
        appState.schedule[date]?.[emp.id] &&
        appState.schedule[date][emp.id] !== "off" &&
        appState.schedule[date][emp.id] !== "leave",
    );
  },

  // Validate minimum coverage requirements
  validateCoverageRequirements(date, shiftType) {
    const coverage = this.getShiftCoverage(date, shiftType);
    const requiredDepartments = [
      "Senior-on-Duty",
      "ICU",
      "WARDS",
      "Emergency",
      "Outpatient",
    ];

    const violations = [];

    if (coverage.length < 5) {
      violations.push(`Minimum 5 staff required for ${shiftType} shift`);
    }

    const representedDepts = new Set(coverage.map((emp) => emp.role));
    const missingDepts = requiredDepartments.filter(
      (dept) => !representedDepts.has(dept),
    );

    if (missingDepts.length > 0) {
      violations.push(`Missing departments: ${missingDepts.join(", ")}`);
    }

    return {
      isValid: violations.length === 0,
      violations: violations,
      coverage: coverage.length,
    };
  },

  getShiftCoverage(date, shiftType) {
    return appState.employees.filter((emp) => {
      const empShift = appState.schedule[date]?.[emp.id];
      return (
        empShift === shiftType ||
        (shiftType === "day" && empShift === "day-ot") ||
        (shiftType === "night" && empShift === "night-ot")
      );
    });
  },
};

// Enhanced error handling utilities
const ErrorHandler = {
  displayValidationError(error, fieldId = null) {
    showAlert(error, "error");

    if (fieldId) {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.add("error");
        field.focus();

        // Remove error class after user interacts with field
        const removeError = () => {
          field.classList.remove("error");
          field.removeEventListener("input", removeError);
          field.removeEventListener("change", removeError);
        };
        field.addEventListener("input", removeError);
        field.addEventListener("change", removeError);
      }
    }
  },

  handleScheduleError(error, context = "") {
    const contextMessage = context ? `${context}: ` : "";
    showAlert(`${contextMessage}${error}`, "error");
    console.error("Schedule error:", error, context);
  },

  handleDataIntegrityError(error, data = null) {
    showAlert(
      "Data integrity error detected. Please refresh and try again.",
      "error",
    );
    console.error("Data integrity error:", error, data);

    // Optionally trigger automatic backup
    if (typeof createAutomaticBackup === "function") {
      createAutomaticBackup();
    }
  },
};
