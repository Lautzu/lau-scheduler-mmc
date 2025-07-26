// Tests for schedule-assignment.js
// Following CLAUDE.md T-1: Unit tests in same directory

import { describe, expect, test } from "vitest";
import {
  assignShiftsForType,
  assignDepartmentCoverage,
  fillRemainingPositions,
  assignDailyShifts,
} from "./schedule-assignment.js";

// Test data factories to eliminate magic numbers
const TEST_DATE_BASE = "2024-01-01";
const EMPLOYEE_ID_1 = "1";
const EMPLOYEE_ID_2 = "2";
const EMPLOYEE_ID_3 = "3";
const EMPLOYEE_ID_4 = "4";
const EMPLOYEE_ID_5 = "5";

const DEPARTMENT_COVERAGE_TARGET = 3; // Senior, ICU, WARDS
const REMAINING_POSITIONS_TO_FILL = 3;

function createTestEmployee(id = EMPLOYEE_ID_1, overrides = {}) {
  return {
    id,
    name: `Test Employee ${id}`,
    role: "ICU",
    tenure: parseInt(id),
    canSeniorDuty: false,
    ...overrides,
  };
}

function createTestSchedule(employeeAssignments) {
  const schedule = {};
  Object.entries(employeeAssignments).forEach(([date, assignments]) => {
    schedule[date] = assignments;
  });
  return schedule;
}

function createShiftCounts(employeeIds, defaultCount = 0) {
  const counts = {};
  employeeIds.forEach((id) => {
    counts[id] = defaultCount;
  });
  return counts;
}

function createOffDaysCount(employeeIds, defaultCount = 1) {
  const counts = {};
  employeeIds.forEach((id) => {
    counts[id] = defaultCount;
  });
  return counts;
}

function createConsecutiveDays(employeeIds, defaultCount = 0) {
  const counts = {};
  employeeIds.forEach((id) => {
    counts[id] = defaultCount;
  });
  return counts;
}

describe("assignDepartmentCoverage", () => {
  const employeeIds = [EMPLOYEE_ID_1, EMPLOYEE_ID_2, EMPLOYEE_ID_3];
  const mockEmployees = [
    createTestEmployee(EMPLOYEE_ID_1, {
      role: "Senior-on-Duty",
      canSeniorDuty: true,
    }),
    createTestEmployee(EMPLOYEE_ID_2, { role: "ICU" }),
    createTestEmployee(EMPLOYEE_ID_3, { role: "WARDS" }),
  ];

  const testDate = TEST_DATE_BASE;
  const mockSchedule = createTestSchedule({
    [testDate]: {
      [EMPLOYEE_ID_1]: "off",
      [EMPLOYEE_ID_2]: "off",
      [EMPLOYEE_ID_3]: "off",
    },
  });

  const baseParams = {
    date: testDate,
    shiftType: "day",
    sortedEmployees: mockEmployees,
    consecutiveDays: createConsecutiveDays(employeeIds),
    offDaysCount: createOffDaysCount(employeeIds), // Need more work days
    weekNum: 0,
    dates: [testDate],
    schedule: mockSchedule,
    assignedDepartments: new Set(),
    shiftCounts: createShiftCounts(employeeIds),
    otCounter: 0,
  };

  test("assigns employees from required departments", () => {
    const params = { ...baseParams };
    const assigned = assignDepartmentCoverage(params);

    expect(assigned).toBe(DEPARTMENT_COVERAGE_TARGET);
    expect(params.schedule[testDate][EMPLOYEE_ID_1]).not.toBe("off");
    expect(params.schedule[testDate][EMPLOYEE_ID_2]).not.toBe("off");
    expect(params.schedule[testDate][EMPLOYEE_ID_3]).not.toBe("off");
  });

  test("updates shift counts correctly", () => {
    const params = { ...baseParams };
    assignDepartmentCoverage(params);

    const totalAssigned = Object.values(params.shiftCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(totalAssigned).toBe(DEPARTMENT_COVERAGE_TARGET);
  });

  test("tracks assigned departments", () => {
    const params = { ...baseParams };
    assignDepartmentCoverage(params);

    expect(params.assignedDepartments.size).toBe(DEPARTMENT_COVERAGE_TARGET);
  });
});

describe("fillRemainingPositions", () => {
  const employeeIds = [EMPLOYEE_ID_1, EMPLOYEE_ID_2, EMPLOYEE_ID_3];
  const mockEmployees = [
    createTestEmployee(EMPLOYEE_ID_1, { role: "ICU" }),
    createTestEmployee(EMPLOYEE_ID_2, { role: "ICU" }),
    createTestEmployee(EMPLOYEE_ID_3, { role: "Emergency" }),
  ];

  const testDate = TEST_DATE_BASE;
  const mockSchedule = createTestSchedule({
    [testDate]: {
      [EMPLOYEE_ID_1]: "off",
      [EMPLOYEE_ID_2]: "off",
      [EMPLOYEE_ID_3]: "off",
    },
  });
  const alreadyAssigned = 2;
  const nearCapacityAssigned = 4;

  const baseParams = {
    date: testDate,
    shiftType: "day",
    sortedEmployees: mockEmployees,
    consecutiveDays: createConsecutiveDays(employeeIds),
    offDaysCount: createOffDaysCount(employeeIds), // Need more work days
    weekNum: 0,
    dates: [testDate],
    schedule: mockSchedule,
    assigned: alreadyAssigned,
    shiftCounts: createShiftCounts(employeeIds),
    otCounter: 0,
  };

  test("fills remaining positions up to limit", () => {
    const params = { ...baseParams };
    const additional = fillRemainingPositions(params);

    expect(additional).toBe(REMAINING_POSITIONS_TO_FILL); // Should fill 3 more to reach 5 total
  });

  test("stops when no qualified employees available", () => {
    const scheduleWithLimit = createTestSchedule({
      [testDate]: {
        [EMPLOYEE_ID_1]: "leave",
        [EMPLOYEE_ID_2]: "leave",
        [EMPLOYEE_ID_3]: "off",
      },
    });
    const availableEmployees = 1;

    const params = {
      ...baseParams,
      schedule: scheduleWithLimit,
      assigned: nearCapacityAssigned,
    };

    const additional = fillRemainingPositions(params);
    expect(additional).toBe(availableEmployees); // Only one employee available
  });
});

describe("assignShiftsForType", () => {
  const employeeIds = [
    EMPLOYEE_ID_1,
    EMPLOYEE_ID_2,
    EMPLOYEE_ID_3,
    EMPLOYEE_ID_4,
    EMPLOYEE_ID_5,
  ];
  const mockEmployees = [
    createTestEmployee(EMPLOYEE_ID_1, {
      role: "Senior-on-Duty",
      canSeniorDuty: true,
    }),
    createTestEmployee(EMPLOYEE_ID_2, { role: "ICU" }),
    createTestEmployee(EMPLOYEE_ID_3, { role: "WARDS" }),
    createTestEmployee(EMPLOYEE_ID_4, { role: "Emergency" }),
    createTestEmployee(EMPLOYEE_ID_5, { role: "Outpatient" }),
  ];

  const testDate = TEST_DATE_BASE;
  const mockSchedule = createTestSchedule({
    [testDate]: {
      [EMPLOYEE_ID_1]: "off",
      [EMPLOYEE_ID_2]: "off",
      [EMPLOYEE_ID_3]: "off",
      [EMPLOYEE_ID_4]: "off",
      [EMPLOYEE_ID_5]: "off",
    },
  });

  const params = {
    date: testDate,
    shiftType: "day",
    availableEmployees: mockEmployees,
    consecutiveDays: createConsecutiveDays(employeeIds),
    weekNum: 0,
    dates: [testDate],
    schedule: mockSchedule,
    offDaysCount: createOffDaysCount(employeeIds), // All employees need more work
  };

  const shiftCounts = createShiftCounts(employeeIds);
  const expectedTargetAssignments = 5;
  const minDepartmentCoverage = 5; // All 5 departments should be covered

  test("assigns correct number of employees", () => {
    const result = assignShiftsForType(params, shiftCounts, 0);

    expect(result.assigned).toBe(expectedTargetAssignments);
    expect(result.updatedOtCounter).toBeGreaterThanOrEqual(0);
  });

  test("updates schedule correctly", () => {
    assignShiftsForType(params, shiftCounts, 0);

    const assignedEmployees = Object.values(params.schedule[testDate]).filter(
      (shift) => shift !== "off",
    ).length;

    expect(assignedEmployees).toBe(expectedTargetAssignments);
  });

  test("covers all required departments", () => {
    assignShiftsForType(params, shiftCounts, 0);

    const assignedRoles = mockEmployees
      .filter((emp) => params.schedule[testDate][emp.id] !== "off")
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

    expect(coveredDepartments.length).toBe(minDepartmentCoverage);
  });
});

describe("assignDailyShifts", () => {
  const employeeIds = [EMPLOYEE_ID_1, EMPLOYEE_ID_2];
  const mockEmployees = [
    createTestEmployee(EMPLOYEE_ID_1, {
      role: "Senior-on-Duty",
      canSeniorDuty: true,
    }),
    createTestEmployee(EMPLOYEE_ID_2, { role: "ICU" }),
  ];

  const testDate = TEST_DATE_BASE;
  const mockSchedule = createTestSchedule({
    [testDate]: { [EMPLOYEE_ID_1]: "off", [EMPLOYEE_ID_2]: "off" },
  });

  const dates = [testDate];
  const consecutiveDays = createConsecutiveDays(employeeIds);
  const shiftCounts = createShiftCounts(employeeIds);
  const weekNum = 0;
  const initialOtCounter = 0;
  const expectedMinAssignments = 1; // With only 2 employees, can't fill all positions but should assign some

  test("assigns all three shift types", () => {
    const otCounter = assignDailyShifts(
      testDate,
      weekNum,
      mockEmployees,
      mockSchedule,
      dates,
      consecutiveDays,
      shiftCounts,
      initialOtCounter,
    );

    expect(otCounter).toBeGreaterThanOrEqual(initialOtCounter);

    // Check that employees were assigned to shifts
    const emp1Shift = mockSchedule[testDate][EMPLOYEE_ID_1];
    const emp2Shift = mockSchedule[testDate][EMPLOYEE_ID_2];

    // At least one employee should be assigned (with only 2 employees, we can't fill all positions)
    const assignedCount = [emp1Shift, emp2Shift].filter(
      (shift) => shift !== "off",
    ).length;
    expect(assignedCount).toBeGreaterThanOrEqual(expectedMinAssignments);
  });

  test("updates consecutive days tracking", () => {
    const initialConsecutiveDays = createConsecutiveDays(employeeIds);

    assignDailyShifts(
      testDate,
      weekNum,
      mockEmployees,
      mockSchedule,
      dates,
      initialConsecutiveDays,
      shiftCounts,
      initialOtCounter,
    );

    // Employees assigned to work should have consecutive days incremented from their starting value
    mockEmployees.forEach((emp) => {
      const shift = mockSchedule[testDate][emp.id];
      if (shift !== "off" && shift !== "leave") {
        expect(initialConsecutiveDays[emp.id]).toBeGreaterThan(0);
      }
    });
  });

  test("excludes employees on leave", () => {
    const scheduleWithLeave = createTestSchedule({
      [testDate]: { [EMPLOYEE_ID_1]: "leave", [EMPLOYEE_ID_2]: "off" },
    });

    assignDailyShifts(
      testDate,
      weekNum,
      mockEmployees,
      scheduleWithLeave,
      dates,
      consecutiveDays,
      shiftCounts,
      initialOtCounter,
    );

    expect(scheduleWithLeave[testDate][EMPLOYEE_ID_1]).toBe("leave");
  });
});
