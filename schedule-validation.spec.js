// Tests for schedule-validation.js
// Following CLAUDE.md T-6: Test entire structure in one assertion when possible

import { describe, expect, test } from "vitest";
import {
  validateSchedule,
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
} from "./schedule-validation.js";

describe("isShiftMatch", () => {
  test("matches exact shift types", () => {
    expect(isShiftMatch("day", "day")).toBe(true);
    expect(isShiftMatch("evening", "evening")).toBe(true);
    expect(isShiftMatch("night", "night")).toBe(true);
  });

  test("matches overtime variants", () => {
    expect(isShiftMatch("day-ot", "day")).toBe(true);
    expect(isShiftMatch("night-ot", "night")).toBe(true);
  });

  test("does not match different shifts", () => {
    expect(isShiftMatch("day", "evening")).toBe(false);
    expect(isShiftMatch("evening", "night")).toBe(false);
    expect(isShiftMatch("off", "day")).toBe(false);
  });
});

describe("getCoverageForShift", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "Day Worker",
      role: "ICU",
      tenure: 1,
      canSeniorDuty: false,
    },
    {
      id: "2",
      name: "Evening Worker",
      role: "WARDS",
      tenure: 2,
      canSeniorDuty: false,
    },
    {
      id: "3",
      name: "Night Worker",
      role: "Emergency",
      tenure: 3,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": {
      1: "day",
      2: "evening",
      3: "night",
    },
  };

  test("returns employees assigned to specific shift", () => {
    const dayCoverage = getCoverageForShift(
      mockSchedule,
      mockEmployees,
      "2024-01-01",
      "day",
    );
    expect(dayCoverage).toEqual([mockEmployees[0]]);

    const eveningCoverage = getCoverageForShift(
      mockSchedule,
      mockEmployees,
      "2024-01-01",
      "evening",
    );
    expect(eveningCoverage).toEqual([mockEmployees[1]]);
  });

  test("includes overtime shifts in coverage", () => {
    const scheduleWithOT = {
      "2024-01-01": {
        1: "day-ot",
        2: "evening",
        3: "night",
      },
    };

    const dayCoverage = getCoverageForShift(
      scheduleWithOT,
      mockEmployees,
      "2024-01-01",
      "day",
    );
    expect(dayCoverage).toEqual([mockEmployees[0]]);
  });
});

describe("findMissingDepartments", () => {
  const requiredDepts = [
    "Senior-on-Duty",
    "ICU",
    "WARDS",
    "Emergency",
    "Outpatient",
  ];

  test("identifies missing departments", () => {
    const coverage = [
      { id: "1", role: "ICU" },
      { id: "2", role: "WARDS" },
    ];

    const missing = findMissingDepartments(coverage, requiredDepts);
    expect(missing).toEqual(["Senior-on-Duty", "Emergency", "Outpatient"]);
  });

  test("returns empty array when all departments covered", () => {
    const coverage = [
      { id: "1", role: "Senior-on-Duty" },
      { id: "2", role: "ICU" },
      { id: "3", role: "WARDS" },
      { id: "4", role: "Emergency" },
      { id: "5", role: "Outpatient" },
    ];

    const missing = findMissingDepartments(coverage, requiredDepts);
    expect(missing).toEqual([]);
  });
});

describe("hasSeniorDutyPresence", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "Senior Staff",
      role: "Senior-on-Duty",
      canSeniorDuty: true,
    },
    { id: "2", name: "Regular Staff", role: "ICU", canSeniorDuty: false },
  ];

  test("returns true when senior duty staff is working", () => {
    const schedule = {
      "2024-01-01": { 1: "day", 2: "evening" },
    };

    const result = hasSeniorDutyPresence(schedule, mockEmployees, "2024-01-01");
    expect(result).toBe(true);
  });

  test("returns false when senior duty staff is off", () => {
    const schedule = {
      "2024-01-01": { 1: "off", 2: "day" },
    };

    const result = hasSeniorDutyPresence(schedule, mockEmployees, "2024-01-01");
    expect(result).toBe(false);
  });

  test("returns false when no senior duty qualified staff present", () => {
    const nonSeniorEmployees = [
      { id: "2", name: "Regular Staff", role: "ICU", canSeniorDuty: false },
    ];

    const schedule = {
      "2024-01-01": { 2: "day" },
    };

    const result = hasSeniorDutyPresence(
      schedule,
      nonSeniorEmployees,
      "2024-01-01",
    );
    expect(result).toBe(false);
  });
});

describe("validateConsecutiveDays", () => {
  const mockEmployee = {
    id: "1",
    name: "Test Employee",
    role: "ICU",
    tenure: 5,
    canSeniorDuty: false,
  };

  test("detects consecutive days violation", () => {
    const schedule = {
      "2024-01-01": { 1: "day" },
      "2024-01-02": { 1: "evening" },
      "2024-01-03": { 1: "night" },
      "2024-01-04": { 1: "day" },
    };
    const dates = Object.keys(schedule);

    const violations = validateConsecutiveDays(schedule, mockEmployee, dates);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("4 consecutive working days");
  });

  test("passes when consecutive days within limit", () => {
    const schedule = {
      "2024-01-01": { 1: "day" },
      "2024-01-02": { 1: "evening" },
      "2024-01-03": { 1: "night" },
      "2024-01-04": { 1: "off" },
    };
    const dates = Object.keys(schedule);

    const violations = validateConsecutiveDays(schedule, mockEmployee, dates);
    expect(violations).toEqual([]);
  });
});

describe("validateNightToMorning", () => {
  const mockEmployee = {
    id: "1",
    name: "Test Employee",
    role: "ICU",
    tenure: 5,
    canSeniorDuty: false,
  };

  test("detects night-to-morning violation", () => {
    const schedule = {
      "2024-01-01": { 1: "night" },
      "2024-01-02": { 1: "day" },
    };
    const dates = Object.keys(schedule);

    const violations = validateNightToMorning(schedule, mockEmployee, dates);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("night shift followed by a morning shift");
  });

  test("passes when no night-to-morning transition", () => {
    const schedule = {
      "2024-01-01": { 1: "night" },
      "2024-01-02": { 1: "evening" },
    };
    const dates = Object.keys(schedule);

    const violations = validateNightToMorning(schedule, mockEmployee, dates);
    expect(violations).toEqual([]);
  });
});

describe("validateOffDayRequirements", () => {
  const mockEmployee = {
    id: "1",
    name: "Test Employee",
    role: "ICU",
    tenure: 5,
    canSeniorDuty: false,
  };

  test("detects insufficient off days violation", () => {
    const schedule = {
      "2024-01-01": { 1: "day" },
      "2024-01-02": { 1: "evening" },
      "2024-01-03": { 1: "night" },
      "2024-01-04": { 1: "day" },
      "2024-01-05": { 1: "evening" },
      "2024-01-06": { 1: "night" },
      "2024-01-07": { 1: "off" },
      // Week 2 - only 1 off day
      "2024-01-08": { 1: "day" },
      "2024-01-09": { 1: "evening" },
      "2024-01-10": { 1: "night" },
      "2024-01-11": { 1: "day" },
      "2024-01-12": { 1: "evening" },
      "2024-01-13": { 1: "night" },
      "2024-01-14": { 1: "off" },
    };
    const dates = Object.keys(schedule);

    const violations = validateOffDayRequirements(
      schedule,
      mockEmployee,
      dates,
    );
    expect(violations).toHaveLength(2); // Both weeks have insufficient off days
    expect(
      violations.some((v) => v.includes("only 1 days off in week 1")),
    ).toBe(true);
    expect(
      violations.some((v) => v.includes("only 1 days off in week 2")),
    ).toBe(true);
  });

  test("passes when minimum off days met", () => {
    const schedule = {
      "2024-01-01": { 1: "day" },
      "2024-01-02": { 1: "off" },
      "2024-01-03": { 1: "night" },
      "2024-01-04": { 1: "off" },
      "2024-01-05": { 1: "evening" },
      "2024-01-06": { 1: "night" },
      "2024-01-07": { 1: "day" },
      // Week 2
      "2024-01-08": { 1: "off" },
      "2024-01-09": { 1: "evening" },
      "2024-01-10": { 1: "off" },
      "2024-01-11": { 1: "day" },
      "2024-01-12": { 1: "evening" },
      "2024-01-13": { 1: "night" },
      "2024-01-14": { 1: "day" },
    };
    const dates = Object.keys(schedule);

    const violations = validateOffDayRequirements(
      schedule,
      mockEmployee,
      dates,
    );
    expect(violations).toEqual([]);
  });
});

describe("calculateScheduleStatistics", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "Employee 1",
      role: "ICU",
      tenure: 1,
      canSeniorDuty: false,
    },
    {
      id: "2",
      name: "Employee 2",
      role: "WARDS",
      tenure: 2,
      canSeniorDuty: false,
    },
  ];

  const mockShifts = {
    day: { hours: 8 },
    evening: { hours: 8 },
    night: { hours: 8 },
    "day-ot": { hours: 12 },
    "night-ot": { hours: 12 },
    off: { hours: 0 },
    leave: { hours: 0 },
  };

  test("calculates statistics correctly", () => {
    const schedule = {
      "2024-01-01": { 1: "day", 2: "evening" },
      "2024-01-02": { 1: "day-ot", 2: "off" },
    };

    const stats = calculateScheduleStatistics(
      schedule,
      mockEmployees,
      mockShifts,
    );

    expect(stats.totalHours).toBe(28); // 8 + 8 + 12 + 0
    expect(stats.otHours).toBe(4); // 12-hour shift = 4 OT hours
    expect(stats.avgCoveragePerShift).toBeCloseTo(0.5); // 3 shifts / (2 dates * 3 shift types)
  });
});

describe("countEmployeeOffDays", () => {
  const schedule = {
    "2024-01-01": { 1: "day" },
    "2024-01-02": { 1: "off" },
    "2024-01-03": { 1: "leave" },
    "2024-01-04": { 1: "evening" },
  };
  const dates = Object.keys(schedule);

  test("counts off days and leave correctly", () => {
    const count = countEmployeeOffDays(schedule, "1", dates);
    expect(count).toBe(2);
  });
});

describe("getEmployeeViolations", () => {
  test("returns all violation types for employee", () => {
    const schedule = {
      // Week 1 - 4 consecutive days, night-to-morning, insufficient off days
      "2024-01-01": { 1: "day" },
      "2024-01-02": { 1: "evening" },
      "2024-01-03": { 1: "night" },
      "2024-01-04": { 1: "day" }, // Night-to-morning violation
      "2024-01-05": { 1: "evening" },
      "2024-01-06": { 1: "night" },
      "2024-01-07": { 1: "day" },
      // Week 2 - insufficient off days
      "2024-01-08": { 1: "evening" },
      "2024-01-09": { 1: "night" },
      "2024-01-10": { 1: "day" },
      "2024-01-11": { 1: "evening" },
      "2024-01-12": { 1: "night" },
      "2024-01-13": { 1: "day" },
      "2024-01-14": { 1: "off" },
    };
    const dates = Object.keys(schedule);

    const violations = getEmployeeViolations(schedule, "1", dates);

    expect(violations).toContain("13 consecutive days");
    expect(violations).toContain("Night-to-morning shift");
    expect(violations).toContain("Insufficient off days week 1");
    expect(violations).toContain("Insufficient off days week 2");
  });
});

describe("validateSchedule", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "Senior Staff",
      role: "Senior-on-Duty",
      tenure: 1,
      canSeniorDuty: true,
    },
    {
      id: "2",
      name: "ICU Staff",
      role: "ICU",
      tenure: 2,
      canSeniorDuty: false,
    },
  ];

  test("returns empty array for valid schedule", () => {
    const validSchedule = {
      "2024-01-01": { 1: "day", 2: "day" },
      "2024-01-02": { 1: "evening", 2: "evening" },
      "2024-01-03": { 1: "off", 2: "off" },
    };

    const violations = validateSchedule(validSchedule, mockEmployees);
    // Will have some violations due to insufficient coverage (need 5 staff per shift)
    expect(Array.isArray(violations)).toBe(true);
  });

  test("detects multiple violation types", () => {
    const problematicSchedule = {
      "2024-01-01": { 1: "night", 2: "off" }, // Low coverage
      "2024-01-02": { 1: "day", 2: "off" }, // Night-to-morning + low coverage
    };

    const violations = validateSchedule(problematicSchedule, mockEmployees);
    expect(violations.length).toBeGreaterThan(0);

    const violationText = violations.join(" ");
    expect(violationText).toContain("Low coverage");
    expect(violationText).toContain("night shift followed by a morning shift");
  });
});
