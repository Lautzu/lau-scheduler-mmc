// Tests for schedule-core.js
// Following CLAUDE.md T-1: Unit tests in same directory as source

import { describe, expect, test } from "vitest";
import {
  isWorkingShift,
  isNightToMorningViolation,
  checkNightToMorningViolation,
  getWeeklyShiftCount,
  calculateEmployeeOffDays,
  isEmployeeQualified,
  prioritizeEmployees,
  determineShiftWithOT,
} from "./schedule-core.js";

// Test data factories to eliminate magic numbers
const TEST_DATE_BASE = "2024-01-01";
const EMPLOYEE_ID_1 = "1";
const EMPLOYEE_ID_2 = "2";
const EMPLOYEE_ID_3 = "3";

function createTestEmployee(id = EMPLOYEE_ID_1, overrides = {}) {
  return {
    id,
    name: `Test Employee ${id}`,
    role: "ICU",
    tenure: 5,
    canSeniorDuty: false,
    ...overrides,
  };
}

function createTestDates(count = 7, startDate = TEST_DATE_BASE) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

function createTestSchedule(employeeAssignments) {
  const schedule = {};
  Object.entries(employeeAssignments).forEach(([date, assignments]) => {
    schedule[date] = assignments;
  });
  return schedule;
}

describe("isWorkingShift", () => {
  test("returns true for working shifts", () => {
    expect(isWorkingShift("day")).toBe(true);
    expect(isWorkingShift("evening")).toBe(true);
    expect(isWorkingShift("night")).toBe(true);
    expect(isWorkingShift("day-ot")).toBe(true);
    expect(isWorkingShift("night-ot")).toBe(true);
  });

  test("returns false for non-working shifts", () => {
    expect(isWorkingShift("off")).toBe(false);
    expect(isWorkingShift("leave")).toBe(false);
  });
});

describe("isNightToMorningViolation", () => {
  test("detects night to morning violations", () => {
    expect(isNightToMorningViolation("night", "day")).toBe(true);
    expect(isNightToMorningViolation("night-ot", "day")).toBe(true);
    expect(isNightToMorningViolation("night", "day-ot")).toBe(true);
    expect(isNightToMorningViolation("night-ot", "day-ot")).toBe(true);
  });

  test("detects evening to morning violations", () => {
    expect(isNightToMorningViolation("evening", "day")).toBe(true);
    expect(isNightToMorningViolation("evening", "day-ot")).toBe(true);
  });

  test("does not flag valid transitions", () => {
    expect(isNightToMorningViolation("day", "evening")).toBe(false);
    expect(isNightToMorningViolation("evening", "night")).toBe(false);
    expect(isNightToMorningViolation("night", "off")).toBe(false);
    expect(isNightToMorningViolation("off", "day")).toBe(false);
    expect(isNightToMorningViolation("evening", "evening")).toBe(false);
    expect(isNightToMorningViolation("evening", "night")).toBe(false);
  });
});

describe("checkNightToMorningViolation", () => {
  const testDates = createTestDates(3);
  const mockSchedule = createTestSchedule({
    [testDates[0]]: { [EMPLOYEE_ID_1]: "night" },
    [testDates[1]]: { [EMPLOYEE_ID_1]: "day" },
    [testDates[2]]: { [EMPLOYEE_ID_1]: "off" },
  });

  test("detects violation when night precedes day shift", () => {
    const result = checkNightToMorningViolation(
      EMPLOYEE_ID_1,
      testDates[1],
      "day",
      mockSchedule,
    );
    expect(result).toBe(true);
  });

  test("does not flag non-day shifts", () => {
    const result = checkNightToMorningViolation(
      EMPLOYEE_ID_1,
      testDates[1],
      "evening",
      mockSchedule,
    );
    expect(result).toBe(false);
  });

  test("handles first date correctly", () => {
    const result = checkNightToMorningViolation(
      EMPLOYEE_ID_1,
      testDates[0],
      "day",
      mockSchedule,
    );
    expect(result).toBe(false);
  });
});

describe("getWeeklyShiftCount", () => {
  const testDates = createTestDates(7);
  const mockSchedule = createTestSchedule({
    [testDates[0]]: { [EMPLOYEE_ID_1]: "day" },
    [testDates[1]]: { [EMPLOYEE_ID_1]: "evening" },
    [testDates[2]]: { [EMPLOYEE_ID_1]: "night" },
    [testDates[3]]: { [EMPLOYEE_ID_1]: "off" },
    [testDates[4]]: { [EMPLOYEE_ID_1]: "day" },
    [testDates[5]]: { [EMPLOYEE_ID_1]: "off" },
    [testDates[6]]: { [EMPLOYEE_ID_1]: "evening" },
  });
  const expectedWorkingShifts = 5; // day, evening, night, day, evening

  test("counts working shifts correctly for week 0", () => {
    const count = getWeeklyShiftCount(
      EMPLOYEE_ID_1,
      0,
      testDates,
      mockSchedule,
    );
    expect(count).toBe(expectedWorkingShifts);
  });

  test("excludes off days and leave from count", () => {
    const scheduleWithLeave = createTestSchedule({
      ...mockSchedule,
      [testDates[0]]: { [EMPLOYEE_ID_1]: "leave" },
      [testDates[1]]: { [EMPLOYEE_ID_1]: "off" },
    });
    const expectedReducedShifts = 3; // night, day, evening (first two changed to non-working)
    const count = getWeeklyShiftCount(
      EMPLOYEE_ID_1,
      0,
      testDates,
      scheduleWithLeave,
    );
    expect(count).toBe(expectedReducedShifts);
  });
});

describe("calculateEmployeeOffDays", () => {
  const testDates = createTestDates(7);
  const mockSchedule = createTestSchedule({
    [testDates[0]]: { [EMPLOYEE_ID_1]: "off" },
    [testDates[1]]: { [EMPLOYEE_ID_1]: "day" },
    [testDates[2]]: { [EMPLOYEE_ID_1]: "leave" },
    [testDates[3]]: { [EMPLOYEE_ID_1]: "evening" },
    [testDates[4]]: { [EMPLOYEE_ID_1]: "off" },
    [testDates[5]]: { [EMPLOYEE_ID_1]: "night" },
    [testDates[6]]: { [EMPLOYEE_ID_1]: "day" },
  });
  const expectedOffDays = 3; // off, leave, off

  test("counts off days and leave correctly", () => {
    const count = calculateEmployeeOffDays(
      EMPLOYEE_ID_1,
      0,
      testDates,
      mockSchedule,
    );
    expect(count).toBe(expectedOffDays);
  });
});

describe("isEmployeeQualified", () => {
  const mockEmployee = createTestEmployee(EMPLOYEE_ID_1);
  const testDates = createTestDates(3);
  const consecutiveDaysAllowed = 2;
  const sufficientOffDays = 3;
  const insufficientOffDays = 1;
  const tooManyConsecutiveDays = 3;
  const minimumRequiredOffDays = 2;

  const baseConstraints = {
    date: testDates[1],
    shiftType: "day",
    consecutiveDays: { [EMPLOYEE_ID_1]: consecutiveDaysAllowed },
    offDaysCount: { [EMPLOYEE_ID_1]: sufficientOffDays },
    weekNum: 0,
    dates: testDates,
    schedule: createTestSchedule({
      [testDates[0]]: { [EMPLOYEE_ID_1]: "evening" }, // No night-to-morning conflict
      [testDates[1]]: { [EMPLOYEE_ID_1]: "off" },
      [testDates[2]]: { [EMPLOYEE_ID_1]: "off" },
    }),
  };

  test("qualifies employee with valid constraints", () => {
    const constraintsWithValidOffDays = {
      ...baseConstraints,
      offDaysCount: { [EMPLOYEE_ID_1]: insufficientOffDays }, // Has fewer than required off days, so can work more
    };
    const result = isEmployeeQualified(
      mockEmployee,
      constraintsWithValidOffDays,
    );
    expect(result).toBe(true);
  });

  test("disqualifies employee already assigned", () => {
    const constraints = {
      ...baseConstraints,
      schedule: createTestSchedule({
        ...baseConstraints.schedule,
        [testDates[1]]: { [EMPLOYEE_ID_1]: "day" },
      }),
    };
    const result = isEmployeeQualified(mockEmployee, constraints);
    expect(result).toBe(false);
  });

  test("disqualifies employee with too many consecutive days", () => {
    const constraints = {
      ...baseConstraints,
      consecutiveDays: { [EMPLOYEE_ID_1]: tooManyConsecutiveDays },
    };
    const result = isEmployeeQualified(mockEmployee, constraints);
    expect(result).toBe(false);
  });

  test("disqualifies employee with too many off days", () => {
    const constraints = {
      ...baseConstraints,
      offDaysCount: { [EMPLOYEE_ID_1]: minimumRequiredOffDays }, // Already has minimum required off days
    };
    const result = isEmployeeQualified(mockEmployee, constraints);
    expect(result).toBe(false);
  });
});

describe("prioritizeEmployees", () => {
  const mockEmployees = [
    createTestEmployee(EMPLOYEE_ID_1, { role: "ICU", tenure: 1 }),
    createTestEmployee(EMPLOYEE_ID_2, { role: "WARDS", tenure: 2 }),
    createTestEmployee(EMPLOYEE_ID_3, { role: "Emergency", tenure: 3 }),
  ];

  const testDate = TEST_DATE_BASE;
  const mockSchedule = createTestSchedule({
    [testDate]: {
      [EMPLOYEE_ID_1]: "off",
      [EMPLOYEE_ID_2]: "off",
      [EMPLOYEE_ID_3]: "off",
    },
  });

  test("prioritizes employees with fewer shifts", () => {
    const highShiftCount = 5;
    const lowShiftCount = 3;
    const mediumShiftCount = 4;
    const equalOffDays = 2;
    const noConsecutiveDays = 0;

    const shiftCounts = {
      [EMPLOYEE_ID_1]: highShiftCount,
      [EMPLOYEE_ID_2]: lowShiftCount,
      [EMPLOYEE_ID_3]: mediumShiftCount,
    };
    const offDaysCount = {
      [EMPLOYEE_ID_1]: equalOffDays,
      [EMPLOYEE_ID_2]: equalOffDays,
      [EMPLOYEE_ID_3]: equalOffDays,
    };
    const consecutiveDays = {
      [EMPLOYEE_ID_1]: noConsecutiveDays,
      [EMPLOYEE_ID_2]: noConsecutiveDays,
      [EMPLOYEE_ID_3]: noConsecutiveDays,
    };

    const result = prioritizeEmployees(
      mockEmployees,
      testDate,
      offDaysCount,
      consecutiveDays,
      shiftCounts,
      mockSchedule,
    );

    expect(result[0].id).toBe(EMPLOYEE_ID_2); // Employee with 3 shifts
    expect(result[1].id).toBe(EMPLOYEE_ID_3); // Employee with 4 shifts
    expect(result[2].id).toBe(EMPLOYEE_ID_1); // Employee with 5 shifts
  });

  test("prioritizes by off days needed when shift counts equal", () => {
    const equalShiftCount = 3;
    const needsMoreOffDays = 1;
    const hasMinimumOffDays = 2;
    const needsMostOffDays = 0;
    const noConsecutiveDays = 0;

    const shiftCounts = {
      [EMPLOYEE_ID_1]: equalShiftCount,
      [EMPLOYEE_ID_2]: equalShiftCount,
      [EMPLOYEE_ID_3]: equalShiftCount,
    };
    const offDaysCount = {
      [EMPLOYEE_ID_1]: needsMoreOffDays,
      [EMPLOYEE_ID_2]: hasMinimumOffDays,
      [EMPLOYEE_ID_3]: needsMostOffDays,
    };
    const consecutiveDays = {
      [EMPLOYEE_ID_1]: noConsecutiveDays,
      [EMPLOYEE_ID_2]: noConsecutiveDays,
      [EMPLOYEE_ID_3]: noConsecutiveDays,
    };

    const result = prioritizeEmployees(
      mockEmployees,
      testDate,
      offDaysCount,
      consecutiveDays,
      shiftCounts,
      mockSchedule,
    );

    expect(result[0].id).toBe(EMPLOYEE_ID_3); // Needs 2 off days
    expect(result[1].id).toBe(EMPLOYEE_ID_1); // Needs 1 off day
    expect(result[2].id).toBe(EMPLOYEE_ID_2); // Needs 0 off days
  });
});

describe("determineShiftWithOT", () => {
  const mockEmployees = [createTestEmployee(EMPLOYEE_ID_1)];

  const testDate = TEST_DATE_BASE;
  const mockSchedule = createTestSchedule({
    [testDate]: { [EMPLOYEE_ID_1]: "off" },
  });
  const otCounterMatch = 0;
  const otCounterNoMatch = 1;

  test("assigns overtime when counter matches and no OT exists", () => {
    const result = determineShiftWithOT(
      "day",
      testDate,
      mockSchedule,
      mockEmployees,
      otCounterMatch,
    );
    expect(result).toBe("day-ot");
  });

  test("assigns regular shift when OT already exists", () => {
    const scheduleWithOT = createTestSchedule({
      [testDate]: { [EMPLOYEE_ID_1]: "day-ot" },
    });
    const result = determineShiftWithOT(
      "day",
      testDate,
      scheduleWithOT,
      mockEmployees,
      otCounterMatch,
    );
    expect(result).toBe("day");
  });

  test("assigns regular shift when counter does not match", () => {
    const result = determineShiftWithOT(
      "day",
      testDate,
      mockSchedule,
      mockEmployees,
      otCounterNoMatch,
    );
    expect(result).toBe("day");
  });

  test("does not assign OT for evening shifts", () => {
    const result = determineShiftWithOT(
      "evening",
      testDate,
      mockSchedule,
      mockEmployees,
      otCounterMatch,
    );
    expect(result).toBe("evening");
  });
});
