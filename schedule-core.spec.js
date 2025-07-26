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
  findQualifiedEmployeeForDepartment,
  prioritizeEmployees,
  determineShiftWithOT,
} from "./schedule-core.js";

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

  test("does not flag valid transitions", () => {
    expect(isNightToMorningViolation("day", "evening")).toBe(false);
    expect(isNightToMorningViolation("evening", "night")).toBe(false);
    expect(isNightToMorningViolation("night", "off")).toBe(false);
    expect(isNightToMorningViolation("off", "day")).toBe(false);
  });
});

describe("checkNightToMorningViolation", () => {
  const mockSchedule = {
    "2024-01-01": { 1: "night" },
    "2024-01-02": { 1: "day" },
    "2024-01-03": { 1: "off" },
  };

  test("detects violation when night precedes day shift", () => {
    const result = checkNightToMorningViolation(
      "1",
      "2024-01-02",
      "day",
      mockSchedule,
    );
    expect(result).toBe(true);
  });

  test("does not flag non-day shifts", () => {
    const result = checkNightToMorningViolation(
      "1",
      "2024-01-02",
      "evening",
      mockSchedule,
    );
    expect(result).toBe(false);
  });

  test("handles first date correctly", () => {
    const result = checkNightToMorningViolation(
      "1",
      "2024-01-01",
      "day",
      mockSchedule,
    );
    expect(result).toBe(false);
  });
});

describe("getWeeklyShiftCount", () => {
  const mockDates = [
    "2024-01-01",
    "2024-01-02",
    "2024-01-03",
    "2024-01-04",
    "2024-01-05",
    "2024-01-06",
    "2024-01-07",
  ];
  const mockSchedule = {
    "2024-01-01": { 1: "day" },
    "2024-01-02": { 1: "evening" },
    "2024-01-03": { 1: "night" },
    "2024-01-04": { 1: "off" },
    "2024-01-05": { 1: "day" },
    "2024-01-06": { 1: "off" },
    "2024-01-07": { 1: "evening" },
  };

  test("counts working shifts correctly for week 0", () => {
    const count = getWeeklyShiftCount("1", 0, mockDates, mockSchedule);
    expect(count).toBe(5);
  });

  test("excludes off days and leave from count", () => {
    const scheduleWithLeave = {
      ...mockSchedule,
      "2024-01-01": { 1: "leave" },
      "2024-01-02": { 1: "off" },
    };
    const count = getWeeklyShiftCount("1", 0, mockDates, scheduleWithLeave);
    expect(count).toBe(3);
  });
});

describe("calculateEmployeeOffDays", () => {
  const mockDates = [
    "2024-01-01",
    "2024-01-02",
    "2024-01-03",
    "2024-01-04",
    "2024-01-05",
    "2024-01-06",
    "2024-01-07",
  ];
  const mockSchedule = {
    "2024-01-01": { 1: "off" },
    "2024-01-02": { 1: "day" },
    "2024-01-03": { 1: "leave" },
    "2024-01-04": { 1: "evening" },
    "2024-01-05": { 1: "off" },
    "2024-01-06": { 1: "night" },
    "2024-01-07": { 1: "day" },
  };

  test("counts off days and leave correctly", () => {
    const count = calculateEmployeeOffDays("1", 0, mockDates, mockSchedule);
    expect(count).toBe(3);
  });
});

describe("isEmployeeQualified", () => {
  const mockEmployee = {
    id: "1",
    name: "Test Employee",
    role: "ICU",
    tenure: 5,
    canSeniorDuty: false,
  };

  const baseConstraints = {
    date: "2024-01-02",
    shiftType: "day",
    consecutiveDays: { 1: 2 },
    offDaysCount: { 1: 3 },
    weekNum: 0,
    dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
    schedule: {
      "2024-01-01": { 1: "evening" }, // No night-to-morning conflict
      "2024-01-02": { 1: "off" },
      "2024-01-03": { 1: "off" },
    },
  };

  test("qualifies employee with valid constraints", () => {
    const constraintsWithValidOffDays = {
      ...baseConstraints,
      offDaysCount: { 1: 1 }, // Has fewer than required off days, so can work more
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
      schedule: {
        ...baseConstraints.schedule,
        "2024-01-02": { 1: "day" },
      },
    };
    const result = isEmployeeQualified(mockEmployee, constraints);
    expect(result).toBe(false);
  });

  test("disqualifies employee with too many consecutive days", () => {
    const constraints = {
      ...baseConstraints,
      consecutiveDays: { 1: 3 },
    };
    const result = isEmployeeQualified(mockEmployee, constraints);
    expect(result).toBe(false);
  });

  test("disqualifies employee with too many off days", () => {
    const constraints = {
      ...baseConstraints,
      offDaysCount: { 1: 2 }, // Already has minimum required off days
    };
    const result = isEmployeeQualified(mockEmployee, constraints);
    expect(result).toBe(false);
  });
});

describe("prioritizeEmployees", () => {
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
    {
      id: "3",
      name: "Employee 3",
      role: "Emergency",
      tenure: 3,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": { 1: "off", 2: "off", 3: "off" },
  };

  test("prioritizes employees with fewer shifts", () => {
    const shiftCounts = { 1: 5, 2: 3, 3: 4 };
    const offDaysCount = { 1: 2, 2: 2, 3: 2 };
    const consecutiveDays = { 1: 0, 2: 0, 3: 0 };

    const result = prioritizeEmployees(
      mockEmployees,
      "2024-01-01",
      offDaysCount,
      consecutiveDays,
      shiftCounts,
      mockSchedule,
    );

    expect(result[0].id).toBe("2"); // Employee with 3 shifts
    expect(result[1].id).toBe("3"); // Employee with 4 shifts
    expect(result[2].id).toBe("1"); // Employee with 5 shifts
  });

  test("prioritizes by off days needed when shift counts equal", () => {
    const shiftCounts = { 1: 3, 2: 3, 3: 3 };
    const offDaysCount = { 1: 1, 2: 2, 3: 0 };
    const consecutiveDays = { 1: 0, 2: 0, 3: 0 };

    const result = prioritizeEmployees(
      mockEmployees,
      "2024-01-01",
      offDaysCount,
      consecutiveDays,
      shiftCounts,
      mockSchedule,
    );

    expect(result[0].id).toBe("3"); // Needs 2 off days
    expect(result[1].id).toBe("1"); // Needs 1 off day
    expect(result[2].id).toBe("2"); // Needs 0 off days
  });
});

describe("determineShiftWithOT", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "Employee 1",
      role: "ICU",
      tenure: 1,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": { 1: "off" },
  };

  test("assigns overtime when counter matches and no OT exists", () => {
    const result = determineShiftWithOT(
      "day",
      "2024-01-01",
      mockSchedule,
      mockEmployees,
      0,
    );
    expect(result).toBe("day-ot");
  });

  test("assigns regular shift when OT already exists", () => {
    const scheduleWithOT = {
      "2024-01-01": { 1: "day-ot" },
    };
    const result = determineShiftWithOT(
      "day",
      "2024-01-01",
      scheduleWithOT,
      mockEmployees,
      0,
    );
    expect(result).toBe("day");
  });

  test("assigns regular shift when counter does not match", () => {
    const result = determineShiftWithOT(
      "day",
      "2024-01-01",
      mockSchedule,
      mockEmployees,
      1,
    );
    expect(result).toBe("day");
  });

  test("does not assign OT for evening shifts", () => {
    const result = determineShiftWithOT(
      "evening",
      "2024-01-01",
      mockSchedule,
      mockEmployees,
      0,
    );
    expect(result).toBe("evening");
  });
});
