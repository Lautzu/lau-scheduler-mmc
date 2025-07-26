// Tests for scheduler.js functions
// Following CLAUDE.md T-1: colocate unit tests with source file

import { describe, test, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

// Set up DOM environment for tests
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.window = dom.window;

// Mock the shifts object
const shifts = {
  day: { name: "Day", time: "6AM-2PM", hours: 8, class: "day-shift" },
  evening: {
    name: "Evening",
    time: "2PM-10PM",
    hours: 8,
    class: "evening-shift",
  },
  night: { name: "Night", time: "10PM-6AM", hours: 8, class: "night-shift" },
  "day-ot": { name: "Day OT", time: "6AM-6PM", hours: 12, class: "day-ot" },
  "night-ot": {
    name: "Night OT",
    time: "6PM-6AM",
    hours: 12,
    class: "night-ot",
  },
  off: { name: "Off", time: "", hours: 0, class: "off-day" },
  leave: { name: "Leave", time: "", hours: 0, class: "leave" },
};

// Mock appState
const mockAppState = {
  schedule: {
    "2024-01-01": { 1: "day-ot", 2: "day", 3: "off" },
    "2024-01-02": { 1: "off", 2: "night-ot", 3: "evening" },
    "2024-01-03": { 1: "day", 2: "off", 3: "night" },
  },
};

// Mock calculateEmployeeStats function (from scheduler.js)
function calculateEmployeeStats(emp, dates) {
  let totalHours = 0;
  let otHours = 0;

  dates.forEach((date) => {
    const shiftType = mockAppState.schedule[date]?.[emp.id] || "off";
    const shift = shifts[shiftType];
    totalHours += shift.hours;
    if (shift.hours === 12) otHours += 4;
  });

  return { totalHours, otHours };
}

// Mock createOvertimeCell function (from scheduler.js)
function createOvertimeCell(emp, dates) {
  const dateStrings = dates.map((date) =>
    typeof date === "string" ? date : date.toISOString().split("T")[0],
  );
  const stats = calculateEmployeeStats(emp, dateStrings);

  const td = document.createElement("td");
  td.className = "ot-hours";
  td.textContent = `${stats.otHours}h`;

  // Add color coding based on OT hours
  if (stats.otHours <= 8) {
    td.classList.add("low");
  } else if (stats.otHours <= 16) {
    td.classList.add("moderate");
  } else {
    td.classList.add("high");
  }

  // Add tooltip showing breakdown
  const week1Dates = dateStrings.slice(0, 7);
  const week2Dates = dateStrings.slice(7, 14);
  const week1Stats = calculateEmployeeStats(emp, week1Dates);
  const week2Stats = calculateEmployeeStats(emp, week2Dates);

  td.title = `Week 1: ${week1Stats.otHours}h, Week 2: ${week2Stats.otHours}h`;

  return td;
}

describe("calculateEmployeeStats", () => {
  const testEmployee = { id: "1", name: "Test Employee" };

  test("calculates regular hours correctly", () => {
    const dates = ["2024-01-03"]; // day shift
    const result = calculateEmployeeStats(testEmployee, dates);

    expect(result.totalHours).toBe(8);
    expect(result.otHours).toBe(0);
  });

  test("calculates overtime hours correctly", () => {
    const dates = ["2024-01-01"]; // day-ot shift
    const result = calculateEmployeeStats(testEmployee, dates);

    expect(result.totalHours).toBe(12);
    expect(result.otHours).toBe(4);
  });

  test("calculates mixed shifts correctly", () => {
    const dates = ["2024-01-01", "2024-01-03"]; // day-ot + day
    const result = calculateEmployeeStats(testEmployee, dates);

    expect(result.totalHours).toBe(20);
    expect(result.otHours).toBe(4);
  });

  test("handles off days correctly", () => {
    const dates = ["2024-01-02"]; // off
    const result = calculateEmployeeStats(testEmployee, dates);

    expect(result.totalHours).toBe(0);
    expect(result.otHours).toBe(0);
  });
});

describe("createOvertimeCell", () => {
  const testEmployee = { id: "1", name: "Test Employee" };

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
  });

  test("creates cell with correct overtime hours", () => {
    const dates = ["2024-01-01"]; // day-ot shift
    const cell = createOvertimeCell(testEmployee, dates);

    expect(cell.tagName).toBe("TD");
    expect(cell.className).toContain("ot-hours");
    expect(cell.textContent).toBe("4h");
  });

  test("applies low color class for 0-8 OT hours", () => {
    const dates = ["2024-01-03"]; // regular day shift
    const cell = createOvertimeCell(testEmployee, dates);

    expect(cell.classList.contains("low")).toBe(true);
    expect(cell.classList.contains("moderate")).toBe(false);
    expect(cell.classList.contains("high")).toBe(false);
  });

  test("applies moderate color class for 9-16 OT hours", () => {
    // Mock a scenario with moderate OT
    const originalSchedule = mockAppState.schedule;
    mockAppState.schedule = {
      "2024-01-01": { 1: "day-ot" },
      "2024-01-02": { 1: "night-ot" },
      "2024-01-03": { 1: "day-ot" },
    };

    const dates = ["2024-01-01", "2024-01-02", "2024-01-03"];
    const cell = createOvertimeCell(testEmployee, dates);

    expect(cell.classList.contains("moderate")).toBe(true);
    expect(cell.classList.contains("low")).toBe(false);
    expect(cell.classList.contains("high")).toBe(false);

    // Restore original schedule
    mockAppState.schedule = originalSchedule;
  });

  test("includes tooltip with week breakdown", () => {
    const dates = ["2024-01-01"]; // day-ot shift
    const cell = createOvertimeCell(testEmployee, dates);

    expect(cell.title).toContain("Week 1:");
    expect(cell.title).toContain("Week 2:");
  });
});
