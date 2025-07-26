// Type definitions for the scheduler application - Browser version
// Following CLAUDE.md C-5: Use branded types for IDs

/**
 * @typedef {string & { __brand: 'EmployeeId' }} EmployeeId
 * @typedef {string & { __brand: 'DateString' }} DateString
 * @typedef {'day' | 'evening' | 'night' | 'day-ot' | 'night-ot' | 'off' | 'leave'} ShiftType
 */

/**
 * @typedef {Object} Employee
 * @property {EmployeeId} id
 * @property {string} name
 * @property {string} role
 * @property {number} tenure
 * @property {boolean} canSeniorDuty
 */

/**
 * @typedef {Object} Shift
 * @property {string} name
 * @property {string} time
 * @property {number} hours
 * @property {string} class
 */

/**
 * @typedef {Object} ScheduleAssignmentParams
 * @property {DateString} date
 * @property {ShiftType} shiftType
 * @property {Employee[]} availableEmployees
 * @property {Object.<EmployeeId, number>} consecutiveDays
 * @property {number} weekNum
 * @property {DateString[]} dates
 * @property {Object.<EmployeeId, number>} offDaysCount
 */

// Global type constants for browser use
window.SHIFT_TYPES = [
  "day",
  "evening",
  "night",
  "day-ot",
  "night-ot",
  "off",
  "leave",
];
window.REQUIRED_ROLES = [
  "Senior-on-Duty",
  "ICU",
  "WARDS",
  "Emergency",
  "Outpatient",
];
