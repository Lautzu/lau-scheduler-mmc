import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleGrid } from "../ScheduleGrid";
import { createEmployeeId } from "@/types/branded";
import type { Employee } from "@/types/scheduler";

const mockEmployees: Record<string, Employee> = {
  emp1: {
    id: createEmployeeId("emp1"),
    name: "John Doe",
    role: "ICU",
    tenure: 5,
    canSeniorDuty: true,
  },
  emp2: {
    id: createEmployeeId("emp2"),
    name: "Jane Smith",
    role: "WARDS",
    tenure: 3,
    canSeniorDuty: false,
  },
};

const mockSchedule = {
  "2024-01-01": {
    [createEmployeeId("emp1")]: "day" as const,
    [createEmployeeId("emp2")]: "evening" as const,
  },
  "2024-01-02": {
    [createEmployeeId("emp1")]: "off" as const,
    [createEmployeeId("emp2")]: "night" as const,
  },
};

const mockDates = ["2024-01-01", "2024-01-02"];

describe("ScheduleGrid", () => {
  test("renders employee names and roles", () => {
    const mockOnShiftChange = vi.fn();
    const mockOnCellClick = vi.fn();

    render(
      <ScheduleGrid
        schedule={mockSchedule}
        employees={mockEmployees}
        dates={mockDates}
        onShiftChange={mockOnShiftChange}
        onCellClick={mockOnCellClick}
      />,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ICU")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("WARDS")).toBeInTheDocument();
  });

  test("displays correct shift labels", () => {
    const mockOnShiftChange = vi.fn();
    const mockOnCellClick = vi.fn();

    render(
      <ScheduleGrid
        schedule={mockSchedule}
        employees={mockEmployees}
        dates={mockDates}
        onShiftChange={mockOnShiftChange}
        onCellClick={mockOnCellClick}
      />,
    );

    expect(screen.getByText("D")).toBeInTheDocument(); // day shift
    expect(screen.getByText("E")).toBeInTheDocument(); // evening shift
    expect(screen.getByText("N")).toBeInTheDocument(); // night shift
    expect(screen.getByText("OFF")).toBeInTheDocument(); // off day
  });

  test("calls onCellClick when schedule cell is clicked", () => {
    const mockOnShiftChange = vi.fn();
    const mockOnCellClick = vi.fn();

    render(
      <ScheduleGrid
        schedule={mockSchedule}
        employees={mockEmployees}
        dates={mockDates}
        onShiftChange={mockOnShiftChange}
        onCellClick={mockOnCellClick}
      />,
    );

    const dayShiftCell = screen.getByText("D");
    fireEvent.click(dayShiftCell);

    expect(mockOnCellClick).toHaveBeenCalledWith("emp1", "2024-01-01");
  });

  test("formats dates correctly in header", () => {
    const mockOnShiftChange = vi.fn();
    const mockOnCellClick = vi.fn();

    render(
      <ScheduleGrid
        schedule={mockSchedule}
        employees={mockEmployees}
        dates={mockDates}
        onShiftChange={mockOnShiftChange}
        onCellClick={mockOnCellClick}
      />,
    );

    expect(screen.getByText(/Mon.*1/)).toBeInTheDocument();
    expect(screen.getByText(/Tue.*2/)).toBeInTheDocument();
  });

  test("applies correct CSS classes for shift types", () => {
    const mockOnShiftChange = vi.fn();
    const mockOnCellClick = vi.fn();

    render(
      <ScheduleGrid
        schedule={mockSchedule}
        employees={mockEmployees}
        dates={mockDates}
        onShiftChange={mockOnShiftChange}
        onCellClick={mockOnCellClick}
      />,
    );

    const dayShiftCell = screen.getByText("D");
    const offShiftCell = screen.getByText("OFF");

    expect(dayShiftCell).toHaveClass("schedule-cell", "shift-day");
    expect(offShiftCell).toHaveClass("schedule-cell", "shift-off");
  });
});
