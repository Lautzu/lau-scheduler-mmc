"use client";

import React, { useState, useEffect } from "react";
import type { EmployeeManagerProps } from "@/types/components";
import type { Employee } from "@/types/scheduler";
import { createEmployeeId, extractId } from "@/types/branded";

export function EmployeeManager({
  isOpen,
  onClose,
  employees,
  onSave,
  onDelete,
  selectedEmployeeId,
}: EmployeeManagerProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Senior-on-Duty");
  const [canSeniorDuty, setCanSeniorDuty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees[selectedEmployeeId];
      if (employee) {
        setSelectedId(extractId(selectedEmployeeId));
        setName(employee.name);
        setRole(employee.role);
        setCanSeniorDuty(employee.canSeniorDuty);
      }
    }
  }, [selectedEmployeeId, employees]);

  const handleEmployeeSelect = (empId: string) => {
    if (empId === "") {
      setSelectedId("");
      setName("");
      setRole("Senior-on-Duty");
      setCanSeniorDuty(false);
    } else {
      const employee = employees[empId as any];
      if (employee) {
        setSelectedId(empId);
        setName(employee.name);
        setRole(employee.role);
        setCanSeniorDuty(employee.canSeniorDuty);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const employeeId = selectedId || `emp_${Date.now()}`;
      const employee: Employee = {
        id: createEmployeeId(employeeId),
        name: name.trim(),
        role,
        tenure: employees[employeeId as any]?.tenure || 0,
        canSeniorDuty,
      };

      await onSave(employee);

      setSelectedId("");
      setName("");
      setRole("Senior-on-Duty");
      setCanSeniorDuty(false);
    } catch (error) {
      console.error("Failed to save employee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !selectedId ||
      !confirm("Are you sure you want to delete this employee?")
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(createEmployeeId(selectedId));

      setSelectedId("");
      setName("");
      setRole("Senior-on-Duty");
      setCanSeniorDuty(false);
    } catch (error) {
      console.error("Failed to delete employee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const employeeOptions = Object.values(employees);

  return (
    <div className="modal" style={{ display: "block" }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Employee Management</h2>

        <div className="form-group">
          <label htmlFor="employeeSelect">Select Employee:</label>
          <select
            id="employeeSelect"
            className="form-control"
            value={selectedId}
            onChange={(e) => handleEmployeeSelect(e.target.value)}
            disabled={isLoading}
          >
            <option value="">➕ Add New Employee</option>
            {employeeOptions.map((emp) => (
              <option key={extractId(emp.id)} value={extractId(emp.id)}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="employeeName">Name:</label>
          <input
            type="text"
            id="employeeName"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            placeholder="Enter employee name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="employeeRole">Role:</label>
          <select
            id="employeeRole"
            className="form-control"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isLoading}
          >
            <option value="Senior-on-Duty">Senior-on-Duty</option>
            <option value="ICU">ICU</option>
            <option value="WARDS">WARDS</option>
            <option value="Emergency">Emergency</option>
            <option value="Outpatient">Outpatient</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={canSeniorDuty}
              onChange={(e) => setCanSeniorDuty(e.target.checked)}
              disabled={isLoading}
            />
            Can perform Senior-on-Duty
          </label>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          {selectedId && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
