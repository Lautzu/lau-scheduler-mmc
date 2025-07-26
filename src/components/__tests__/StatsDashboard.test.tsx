import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsDashboard } from "../StatsDashboard";

describe("StatsDashboard", () => {
  test("displays all stat cards with correct values", () => {
    const props = {
      totalEmployees: 10,
      totalHours: 240,
      otHours: 32,
      violations: 2,
    };

    render(<StatsDashboard {...props} />);

    expect(screen.getByText("Total Employees")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    expect(screen.getByText("Working Hours")).toBeInTheDocument();
    expect(screen.getByText("240")).toBeInTheDocument();

    expect(screen.getByText("OT Hours")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();

    expect(screen.getByText("Violations")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("applies red color to violations when greater than zero", () => {
    const props = {
      totalEmployees: 5,
      totalHours: 120,
      otHours: 16,
      violations: 3,
    };

    render(<StatsDashboard {...props} />);

    const violationsValue = screen.getByText("3");
    expect(violationsValue).toHaveStyle({ color: "#e74c3c" });
  });

  test("does not apply red color to violations when zero", () => {
    const props = {
      totalEmployees: 5,
      totalHours: 120,
      otHours: 16,
      violations: 0,
    };

    render(<StatsDashboard {...props} />);

    const violationsValue = screen.getByText("0");
    expect(violationsValue).not.toHaveStyle({ color: "#e74c3c" });
  });

  test("handles zero values correctly", () => {
    const props = {
      totalEmployees: 0,
      totalHours: 0,
      otHours: 0,
      violations: 0,
    };

    render(<StatsDashboard {...props} />);

    expect(screen.getAllByText("0")).toHaveLength(4);
  });
});
