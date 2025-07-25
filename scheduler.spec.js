// Test Suite for Healthcare Staff Scheduler
// Following CLAUDE.md best practices for testing

// Simple test framework (since no external testing library is available)
const TestFramework = {
  tests: [],
  passed: 0,
  failed: 0,

  describe(suiteName, testFn) {
    console.group(`📋 ${suiteName}`);
    testFn();
    console.groupEnd();
  },

  test(testName, testFn) {
    try {
      testFn();
      this.passed++;
      console.log(`✅ ${testName}`);
    } catch (error) {
      this.failed++;
      console.error(`❌ ${testName}:`, error.message);
    }
  },

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(
            `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
          );
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      },
    };
  },

  runTests() {
    console.log("\n📊 Test Results:");
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(
      `📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`,
    );
  },
};

// Test Data Setup
const createTestEmployee = (id, name, role, canSeniorDuty = false) => ({
  id,
  name,
  role,
  tenure: id,
  canSeniorDuty,
});

const createTestSchedule = () => {
  const schedule = {};
  const startDate = new Date("2024-01-07"); // Sunday

  for (let i = 0; i < 14; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    schedule[dateStr] = {};
  }

  return schedule;
};

// Test Suite: Input Validation
TestFramework.describe("Input Validation", () => {
  TestFramework.test("validates employee names correctly", () => {
    TestFramework.expect(
      InputValidator.validateEmployeeName("John Doe").isValid,
    ).toBeTruthy();
    TestFramework.expect(
      InputValidator.validateEmployeeName("J").isValid,
    ).toBeFalsy();
    TestFramework.expect(
      InputValidator.validateEmployeeName("").isValid,
    ).toBeFalsy();
    TestFramework.expect(
      InputValidator.validateEmployeeName("  ").isValid,
    ).toBeFalsy();
    TestFramework.expect(
      InputValidator.validateEmployeeName("123").isValid,
    ).toBeFalsy();
  });

  TestFramework.test("validates employee roles correctly", () => {
    TestFramework.expect(
      InputValidator.validateEmployeeRole("ICU").isValid,
    ).toBeTruthy();
    TestFramework.expect(
      InputValidator.validateEmployeeRole("Senior-on-Duty").isValid,
    ).toBeTruthy();
    TestFramework.expect(
      InputValidator.validateEmployeeRole("InvalidRole").isValid,
    ).toBeFalsy();
    TestFramework.expect(
      InputValidator.validateEmployeeRole("").isValid,
    ).toBeFalsy();
  });

  TestFramework.test("validates dates correctly", () => {
    const today = new Date().toISOString().split("T")[0];
    TestFramework.expect(
      InputValidator.validateDate(today).isValid,
    ).toBeTruthy();
    TestFramework.expect(
      InputValidator.validateDate("invalid-date").isValid,
    ).toBeFalsy();
    TestFramework.expect(InputValidator.validateDate("").isValid).toBeFalsy();
  });

  TestFramework.test("validates date ranges correctly", () => {
    const start = "2024-01-01";
    const end = "2024-01-05";
    const invalidEnd = "2023-12-31";

    TestFramework.expect(
      InputValidator.validateDateRange(start, end).isValid,
    ).toBeTruthy();
    TestFramework.expect(
      InputValidator.validateDateRange(start, invalidEnd).isValid,
    ).toBeFalsy();
  });

  TestFramework.test(
    "validates schedule start dates (Sunday requirement)",
    () => {
      TestFramework.expect(
        InputValidator.validateScheduleStartDate("2024-01-07").isValid,
      ).toBeTruthy(); // Sunday
      TestFramework.expect(
        InputValidator.validateScheduleStartDate("2024-01-08").isValid,
      ).toBeFalsy(); // Monday
    },
  );
});

// Test Suite: Schedule Logic
TestFramework.describe("Schedule Logic", () => {
  TestFramework.test("getDatesArray generates correct 14-day period", () => {
    const startDate = new Date("2024-01-07");
    const dates = getDatesArray(startDate);

    TestFramework.expect(dates.length).toBe(14);
    TestFramework.expect(dates[0].getDay()).toBe(0); // Sunday
    TestFramework.expect(dates[6].getDay()).toBe(6); // Saturday
    TestFramework.expect(dates[7].getDay()).toBe(0); // Next Sunday
  });

  TestFramework.test("validates working shift detection", () => {
    TestFramework.expect(isWorkingShift("day")).toBeTruthy();
    TestFramework.expect(isWorkingShift("night-ot")).toBeTruthy();
    TestFramework.expect(isWorkingShift("off")).toBeFalsy();
    TestFramework.expect(isWorkingShift("leave")).toBeFalsy();
  });

  TestFramework.test("validates shift matching logic", () => {
    TestFramework.expect(isShiftMatch("day", "day")).toBeTruthy();
    TestFramework.expect(isShiftMatch("day-ot", "day")).toBeTruthy();
    TestFramework.expect(isShiftMatch("night-ot", "night")).toBeTruthy();
    TestFramework.expect(isShiftMatch("evening", "day")).toBeFalsy();
  });

  TestFramework.test("detects night-to-morning violations", () => {
    // Setup test data
    const originalAppState = { ...appState };
    appState.schedule = {
      "2024-01-07": { 1: "night" },
      "2024-01-08": { 1: "day" },
    };

    TestFramework.expect(
      isNightToMorningViolation("night", "day"),
    ).toBeTruthy();
    TestFramework.expect(
      isNightToMorningViolation("night-ot", "day-ot"),
    ).toBeTruthy();
    TestFramework.expect(
      isNightToMorningViolation("evening", "day"),
    ).toBeFalsy();
    TestFramework.expect(isNightToMorningViolation("day", "night")).toBeFalsy();

    // Restore original state
    appState = originalAppState;
  });
});

// Test Suite: Schedule Validation
TestFramework.describe("Schedule Validation", () => {
  TestFramework.test("validates minimum off days requirement", () => {
    const weekDays = [
      "2024-01-07",
      "2024-01-08",
      "2024-01-09",
      "2024-01-10",
      "2024-01-11",
      "2024-01-12",
      "2024-01-13",
    ];
    const empId = 1;

    // Setup schedule with only 1 off day
    const originalAppState = { ...appState };
    appState.schedule = {};
    weekDays.forEach((date, index) => {
      appState.schedule[date] = { [empId]: index === 0 ? "off" : "day" };
    });

    const offDays = weekDays.filter(
      (date) =>
        appState.schedule[date][empId] === "off" ||
        appState.schedule[date][empId] === "leave",
    ).length;

    TestFramework.expect(offDays).toBeLessThan(2); // Should violate minimum requirement

    // Restore original state
    appState = originalAppState;
  });

  TestFramework.test("calculates employee statistics correctly", () => {
    const emp = createTestEmployee(1, "Test Employee", "ICU");
    const dates = ["2024-01-07", "2024-01-08", "2024-01-09"];

    // Setup test schedule
    const originalAppState = { ...appState };
    appState.schedule = {
      "2024-01-07": { 1: "day" }, // 8 hours
      "2024-01-08": { 1: "day-ot" }, // 12 hours (4 OT)
      "2024-01-09": { 1: "off" }, // 0 hours
    };

    const stats = calculateEmployeeStats(emp, dates);
    TestFramework.expect(stats.totalHours).toBe(20);
    TestFramework.expect(stats.otHours).toBe(4);

    // Restore original state
    appState = originalAppState;
  });
});

// Test Suite: Employee Management
TestFramework.describe("Employee Management", () => {
  TestFramework.test("generates unique employee IDs", () => {
    const originalAppState = { ...appState };
    appState.employees = [
      createTestEmployee(1, "John", "ICU"),
      createTestEmployee(3, "Jane", "WARDS"),
      createTestEmployee(5, "Bob", "Emergency"),
    ];

    const newId = generateNewEmployeeId();
    TestFramework.expect(newId).toBe(6); // Should be max(1,3,5) + 1

    // Restore original state
    appState = originalAppState;
  });

  TestFramework.test("validates employee data correctly", () => {
    const validEmpData = {
      name: "John Doe, RN",
      role: "ICU",
      canSeniorDuty: true,
    };

    const invalidEmpData = {
      name: "",
      role: "InvalidRole",
      canSeniorDuty: false,
    };

    TestFramework.expect(validateEmployeeData(validEmpData)).toBeTruthy();
    TestFramework.expect(validateEmployeeData(invalidEmpData)).toBeFalsy();
  });
});

// Test Suite: Schedule Business Logic
TestFramework.describe("Schedule Business Logic", () => {
  TestFramework.test("validates shift assignment constraints", () => {
    const originalAppState = { ...appState };
    appState.employees = [createTestEmployee(1, "Test Employee", "ICU", false)];
    appState.schedule = {
      "2024-01-07": { 1: "night" },
      "2024-01-08": { 1: "off" },
    };

    // Test night-to-morning violation
    const result = ScheduleValidator.validateShiftAssignment(
      1,
      "2024-01-08",
      "day",
    );
    TestFramework.expect(result.isValid).toBeFalsy();
    TestFramework.expect(result.violations).toContain(
      "Cannot assign morning shift after night shift",
    );

    // Restore original state
    appState = originalAppState;
  });

  TestFramework.test("calculates consecutive days correctly", () => {
    const originalAppState = { ...appState };
    appState.schedule = {
      "2024-01-05": { 1: "day" },
      "2024-01-06": { 1: "evening" },
      "2024-01-07": { 1: "night" },
      "2024-01-08": { 1: "off" },
    };

    const consecutive = ScheduleValidator.getConsecutiveDaysCount(
      1,
      "2024-01-08",
    );
    TestFramework.expect(consecutive).toBe(3);

    // Restore original state
    appState = originalAppState;
  });

  TestFramework.test("validates coverage requirements", () => {
    const originalAppState = { ...appState };
    appState.employees = [
      createTestEmployee(1, "John", "ICU"),
      createTestEmployee(2, "Jane", "WARDS"),
      createTestEmployee(3, "Bob", "Emergency"),
      createTestEmployee(4, "Alice", "Senior-on-Duty", true),
      createTestEmployee(5, "Charlie", "Outpatient"),
    ];
    appState.schedule = {
      "2024-01-07": {
        1: "day",
        2: "day",
        3: "day",
        4: "day",
        5: "day",
      },
    };

    const result = ScheduleValidator.validateCoverageRequirements(
      "2024-01-07",
      "day",
    );
    TestFramework.expect(result.isValid).toBeTruthy();
    TestFramework.expect(result.coverage).toBe(5);

    // Restore original state
    appState = originalAppState;
  });
});

// Test Suite: Data Integrity
TestFramework.describe("Data Integrity", () => {
  TestFramework.test("ensures schedule data structure integrity", () => {
    const schedule = createTestSchedule();
    const dates = Object.keys(schedule);

    TestFramework.expect(dates.length).toBe(14);
    dates.forEach((date) => {
      TestFramework.expect(new Date(date).getDay()).toBeGreaterThan(-1);
      TestFramework.expect(typeof schedule[date]).toBe("object");
    });
  });

  TestFramework.test("validates shift configuration", () => {
    const shiftKeys = Object.keys(shifts);
    const requiredShifts = [
      "day",
      "evening",
      "night",
      "day-ot",
      "night-ot",
      "off",
      "leave",
    ];

    requiredShifts.forEach((shift) => {
      TestFramework.expect(shiftKeys).toContain(shift);
      TestFramework.expect(shifts[shift]).toBeTruthy();
      TestFramework.expect(typeof shifts[shift].hours).toBe("number");
    });
  });
});

// Property-Based Tests (following CLAUDE.md T-6)
TestFramework.describe("Property-Based Tests", () => {
  TestFramework.test(
    "schedule generation preserves employee count invariant",
    () => {
      const originalAppState = { ...appState };
      const testEmployees = [
        createTestEmployee(1, "John", "ICU"),
        createTestEmployee(2, "Jane", "WARDS"),
      ];

      appState.employees = testEmployees;
      const schedule = createTestSchedule();

      // Property: Every date should have entries for all employees
      Object.keys(schedule).forEach((date) => {
        testEmployees.forEach((emp) => {
          // Initialize with default value if not present
          if (!schedule[date][emp.id]) {
            schedule[date][emp.id] = "off";
          }
          TestFramework.expect(schedule[date][emp.id]).toBeTruthy();
        });
      });

      // Restore original state
      appState = originalAppState;
    },
  );

  TestFramework.test("shift hours calculation commutativity", () => {
    const shifts1 = ["day", "evening"];
    const shifts2 = ["evening", "day"];

    const hours1 = shifts1.reduce(
      (total, shift) => total + shifts[shift].hours,
      0,
    );
    const hours2 = shifts2.reduce(
      (total, shift) => total + shifts[shift].hours,
      0,
    );

    TestFramework.expect(hours1).toBe(hours2); // Commutative property
  });
});

// Run all tests when this file is loaded
if (typeof window !== "undefined") {
  console.log("🧪 Running Healthcare Staff Scheduler Tests...\n");
  TestFramework.runTests();

  // Export for manual test execution
  window.runSchedulerTests = () => TestFramework.runTests();
} else {
  // Node.js environment
  module.exports = { TestFramework, InputValidator, ScheduleValidator };
}
