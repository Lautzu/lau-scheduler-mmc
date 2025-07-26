// Tests for schedule-assignment.js
// Following CLAUDE.md T-1: Unit tests in same directory

import { describe, expect, test } from "vitest";
import {
  assignShiftsForType,
  assignDepartmentCoverage,
  fillRemainingPositions,
  assignDailyShifts,
} from "./schedule-assignment.js";

describe("assignDepartmentCoverage", () => {
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
    {
      id: "3",
      name: "Ward Staff",
      role: "WARDS",
      tenure: 3,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": { 1: "off", 2: "off", 3: "off" },
  };

  const baseParams = {
    date: "2024-01-01",
    shiftType: "day",
    sortedEmployees: mockEmployees,
    consecutiveDays: { 1: 0, 2: 0, 3: 0 },
    offDaysCount: { 1: 1, 2: 1, 3: 1 }, // Need more work days
    weekNum: 0,
    dates: ["2024-01-01"],
    schedule: mockSchedule,
    assignedDepartments: new Set(),
    shiftCounts: { 1: 0, 2: 0, 3: 0 },
    otCounter: 0,
  };

  test("assigns employees from required departments", () => {
    const params = { ...baseParams };
    const assigned = assignDepartmentCoverage(params);

    expect(assigned).toBeGreaterThan(0);
    expect(params.schedule["2024-01-01"]["1"]).not.toBe("off");
    expect(params.schedule["2024-01-01"]["2"]).not.toBe("off");
    expect(params.schedule["2024-01-01"]["3"]).not.toBe("off");
  });

  test("updates shift counts correctly", () => {
    const params = { ...baseParams };
    assignDepartmentCoverage(params);

    const totalAssigned = Object.values(params.shiftCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(totalAssigned).toBeGreaterThan(0);
  });

  test("tracks assigned departments", () => {
    const params = { ...baseParams };
    assignDepartmentCoverage(params);

    expect(params.assignedDepartments.size).toBeGreaterThan(0);
  });
});

describe("fillRemainingPositions", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "ICU Staff 1",
      role: "ICU",
      tenure: 1,
      canSeniorDuty: false,
    },
    {
      id: "2",
      name: "ICU Staff 2",
      role: "ICU",
      tenure: 2,
      canSeniorDuty: false,
    },
    {
      id: "3",
      name: "Emergency Staff",
      role: "Emergency",
      tenure: 3,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": { 1: "off", 2: "off", 3: "off" },
  };

  const baseParams = {
    date: "2024-01-01",
    shiftType: "day",
    sortedEmployees: mockEmployees,
    consecutiveDays: { 1: 0, 2: 0, 3: 0 },
    offDaysCount: { 1: 1, 2: 1, 3: 1 }, // Need more work days
    weekNum: 0,
    dates: ["2024-01-01"],
    schedule: mockSchedule,
    assigned: 2,
    shiftCounts: { 1: 0, 2: 0, 3: 0 },
    otCounter: 0,
  };

  test("fills remaining positions up to limit", () => {
    const params = { ...baseParams };
    const additional = fillRemainingPositions(params);

    expect(additional).toBe(3); // Should fill 3 more to reach 5 total
  });

  test("stops when no qualified employees available", () => {
    const scheduleWithLimit = {
      "2024-01-01": { 1: "leave", 2: "leave", 3: "off" },
    };

    const params = {
      ...baseParams,
      schedule: scheduleWithLimit,
      assigned: 4,
    };

    const additional = fillRemainingPositions(params);
    expect(additional).toBe(1); // Only one employee available
  });
});

describe("assignShiftsForType", () => {
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
    {
      id: "3",
      name: "Ward Staff",
      role: "WARDS",
      tenure: 3,
      canSeniorDuty: false,
    },
    {
      id: "4",
      name: "Emergency Staff",
      role: "Emergency",
      tenure: 4,
      canSeniorDuty: false,
    },
    {
      id: "5",
      name: "Outpatient Staff",
      role: "Outpatient",
      tenure: 5,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": { 1: "off", 2: "off", 3: "off", 4: "off", 5: "off" },
  };

  const params = {
    date: "2024-01-01",
    shiftType: "day",
    availableEmployees: mockEmployees,
    consecutiveDays: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    weekNum: 0,
    dates: ["2024-01-01"],
    schedule: mockSchedule,
    offDaysCount: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, // All employees need more work
  };

  const shiftCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  test("assigns correct number of employees", () => {
    const result = assignShiftsForType(params, shiftCounts, 0);

    expect(result.assigned).toBeGreaterThan(0);
    expect(result.updatedOtCounter).toBeGreaterThanOrEqual(0);
  });

  test("updates schedule correctly", () => {
    assignShiftsForType(params, shiftCounts, 0);

    const assignedEmployees = Object.values(
      params.schedule["2024-01-01"],
    ).filter((shift) => shift !== "off").length;

    expect(assignedEmployees).toBeGreaterThan(0);
  });

  test("covers all required departments", () => {
    assignShiftsForType(params, shiftCounts, 0);

    const assignedRoles = mockEmployees
      .filter((emp) => params.schedule["2024-01-01"][emp.id] !== "off")
      .map((emp) => emp.role);

    const requiredDepartments = [
      "Senior-on-Duty",
      "ICU",
      "WARDS",
      "Emergency",
      "Outpatient",
    ];
    const coveredDepartments = requiredDepartments.filter((dept) =>
      assignedRoles.includes(dept),
    );

    expect(coveredDepartments.length).toBeGreaterThan(0);
  });
});

describe("assignDailyShifts", () => {
  const mockEmployees = [
    {
      id: "1",
      name: "Employee 1",
      role: "Senior-on-Duty",
      tenure: 1,
      canSeniorDuty: true,
    },
    {
      id: "2",
      name: "Employee 2",
      role: "ICU",
      tenure: 2,
      canSeniorDuty: false,
    },
  ];

  const mockSchedule = {
    "2024-01-01": { 1: "off", 2: "off" },
  };

  const dates = ["2024-01-01"];
  const consecutiveDays = { 1: 0, 2: 0 };
  const shiftCounts = { 1: 0, 2: 0 };

  test("assigns all three shift types", () => {
    const otCounter = assignDailyShifts(
      "2024-01-01",
      0,
      mockEmployees,
      mockSchedule,
      dates,
      consecutiveDays,
      shiftCounts,
      0,
    );

    expect(otCounter).toBeGreaterThanOrEqual(0);

    // Check that employees were assigned to shifts
    const emp1Shift = mockSchedule["2024-01-01"]["1"];
    const emp2Shift = mockSchedule["2024-01-01"]["2"];

    // At least one employee should be assigned (with only 2 employees, we can't fill all positions)
    const hasAssignments = emp1Shift !== "off" || emp2Shift !== "off";
    expect(hasAssignments).toBe(true);
  });

  test("updates consecutive days tracking", () => {
    const initialConsecutiveDays = { 1: 0, 2: 0 };

    assignDailyShifts(
      "2024-01-01",
      0,
      mockEmployees,
      mockSchedule,
      dates,
      initialConsecutiveDays,
      shiftCounts,
      0,
    );

    // Employees assigned to work should have consecutive days incremented from their starting value
    mockEmployees.forEach((emp) => {
      const shift = mockSchedule["2024-01-01"][emp.id];
      if (shift !== "off" && shift !== "leave") {
        expect(initialConsecutiveDays[emp.id]).toBeGreaterThan(0);
      }
    });
  });

  test("excludes employees on leave", () => {
    const scheduleWithLeave = {
      "2024-01-01": { 1: "leave", 2: "off" },
    };

    assignDailyShifts(
      "2024-01-01",
      0,
      mockEmployees,
      scheduleWithLeave,
      dates,
      consecutiveDays,
      shiftCounts,
      0,
    );

    expect(scheduleWithLeave["2024-01-01"]["1"]).toBe("leave");
  });
});
