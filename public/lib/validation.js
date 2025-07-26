// Input Validation Utilities - Browser version
// Following CLAUDE.md best practices for robust validation

const InputValidator = {
  // Authentication input validation
  validateAuthInput(input) {
    const trimmedInput = input?.trim();

    if (!trimmedInput) {
      return { isValid: false, error: "Input is required" };
    }

    // Check for potential XSS attempts
    const dangerousChars = /<|>|&lt;|&gt;|javascript:|on\w+=/i;
    if (dangerousChars.test(trimmedInput)) {
      return { isValid: false, error: "Invalid characters detected" };
    }

    return { isValid: true, value: trimmedInput };
  },

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

// Enhanced error handling utilities
const ErrorHandler = {
  displayValidationError(error, fieldId = null) {
    // Use global showAlert function if available
    if (typeof showAlert === "function") {
      showAlert(error, "error");
    } else {
      alert(error);
    }

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
    if (typeof showAlert === "function") {
      showAlert(`${contextMessage}${error}`, "error");
    } else {
      console.error(`${contextMessage}${error}`);
    }
    console.error("Schedule error:", error, context);
  },

  handleDataIntegrityError(error, data = null) {
    if (typeof showAlert === "function") {
      showAlert(
        "Data integrity error detected. Please refresh and try again.",
        "error",
      );
    } else {
      console.error("Data integrity error:", error);
    }
    console.error("Data integrity error:", error, data);

    // Optionally trigger automatic backup
    if (typeof createAutomaticBackup === "function") {
      createAutomaticBackup();
    }
  },
};
