"use client";

import React, { useState } from "react";
import type { LeaveRequestManagerProps } from "@/types/components";
import { createEmployeeId, extractId } from "@/types/branded";

export function LeaveRequestManager({
  isOpen,
  onClose,
  employees,
  leaveRequests,
  onAddLeave,
  onClearLeave,
}: LeaveRequestManagerProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("vacation");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddLeave = async () => {
    if (!selectedEmployeeId || !startDate || !endDate) {
      alert("Please fill in all fields");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date");
      return;
    }

    setIsLoading(true);
    try {
      await onAddLeave(
        createEmployeeId(selectedEmployeeId),
        startDate,
        endDate,
        leaveType,
      );

      setSelectedEmployeeId("");
      setStartDate("");
      setEndDate("");
      setLeaveType("vacation");
    } catch (error) {
      console.error("Failed to add leave request:", error);
      alert("Failed to add leave request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all leave requests?")) {
      return;
    }

    setIsLoading(true);
    try {
      await onClearLeave();
    } catch (error) {
      console.error("Failed to clear leave requests:", error);
      alert("Failed to clear leave requests");
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
        <h2>Leave Request</h2>

        <div className="form-group">
          <label htmlFor="leaveEmployee">Employee:</label>
          <select
            id="leaveEmployee"
            className="form-control"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select Employee</option>
            {employeeOptions.map((emp) => (
              <option key={extractId(emp.id)} value={extractId(emp.id)}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="leaveStartDate">Start Date:</label>
          <input
            type="date"
            id="leaveStartDate"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="leaveEndDate">End Date:</label>
          <input
            type="date"
            id="leaveEndDate"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
            min={startDate}
          />
        </div>

        <div className="form-group">
          <label htmlFor="leaveType">Leave Type:</label>
          <select
            id="leaveType"
            className="form-control"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            disabled={isLoading}
          >
            <option value="vacation">Vacation</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal</option>
            <option value="off">Day Off</option>
          </select>
        </div>

        {selectedEmployeeId &&
          leaveRequests[createEmployeeId(selectedEmployeeId)] && (
            <div className="current-leaves">
              <h4>Current Leave Requests:</h4>
              <ul>
                {leaveRequests[createEmployeeId(selectedEmployeeId)].map(
                  (date, index) => (
                    <li key={index}>{date}</li>
                  ),
                )}
              </ul>
            </div>
          )}

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleAddLeave}
            disabled={
              isLoading || !selectedEmployeeId || !startDate || !endDate
            }
          >
            {isLoading ? "Adding..." : "Add Leave"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClearAll}
            disabled={isLoading}
          >
            {isLoading ? "Clearing..." : "Clear All"}
          </button>
        </div>
      </div>
    </div>
  );
}
