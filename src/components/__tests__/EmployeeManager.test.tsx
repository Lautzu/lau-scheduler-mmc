import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmployeeManager } from "../EmployeeManager";
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
};

describe("EmployeeManager", () => {
  test("does not render when not open", () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <EmployeeManager
        isOpen={false}
        onClose={mockOnClose}
        employees={mockEmployees}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.queryByText("Employee Management")).not.toBeInTheDocument();
  });

  test("renders employee form when open", () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <EmployeeManager
        isOpen={true}
        onClose={mockOnClose}
        employees={mockEmployees}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Employee Management")).toBeInTheDocument();
    expect(screen.getByLabelText("Name:")).toBeInTheDocument();
    expect(screen.getByLabelText("Role:")).toBeInTheDocument();
    expect(screen.getByText("Can perform Senior-on-Duty")).toBeInTheDocument();
  });

  test("populates form when employee is selected", () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <EmployeeManager
        isOpen={true}
        onClose={mockOnClose}
        employees={mockEmployees}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        selectedEmployeeId={createEmployeeId("emp1")}
      />,
    );

    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ICU")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  test("calls onSave with correct employee data", async () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    const mockOnDelete = vi.fn();

    render(
      <EmployeeManager
        isOpen={true}
        onClose={mockOnClose}
        employees={{}}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />,
    );

    const nameInput = screen.getByLabelText("Name:");
    const roleSelect = screen.getByLabelText("Role:");
    const seniorDutyCheckbox = screen.getByRole("checkbox");
    const saveButton = screen.getByText("Save");

    fireEvent.change(nameInput, { target: { value: "New Employee" } });
    fireEvent.change(roleSelect, { target: { value: "WARDS" } });
    fireEvent.click(seniorDutyCheckbox);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Employee",
          role: "WARDS",
          canSeniorDuty: true,
        }),
      );
    });
  });

  test("calls onDelete when delete button clicked", async () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockOnDelete = vi.fn().mockResolvedValue(undefined);

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    render(
      <EmployeeManager
        isOpen={true}
        onClose={mockOnClose}
        employees={mockEmployees}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        selectedEmployeeId={createEmployeeId("emp1")}
      />,
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(createEmployeeId("emp1"));
    });

    window.confirm = originalConfirm;
  });

  test("calls onClose when close button clicked", () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <EmployeeManager
        isOpen={true}
        onClose={mockOnClose}
        employees={mockEmployees}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />,
    );

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
