"use client";

import React from "react";
import type { ScheduleGridProps } from "@/types/components";
import type { ShiftType } from "@/types/scheduler";
import { extractId } from "@/types/branded";

const SHIFT_CLASSES = {
  day: "shift-day",
  evening: "shift-evening",
  night: "shift-night",
  "day-ot": "shift-day-ot",
  "night-ot": "shift-night-ot",
  off: "shift-off",
  leave: "shift-leave",
};

const SHIFT_LABELS = {
  day: "D",
  evening: "E",
  night: "N",
  "day-ot": "D-OT",
  "night-ot": "N-OT",
  off: "OFF",
  leave: "L",
};

export function ScheduleGrid({
  schedule,
  employees,
  dates,
  onShiftChange,
  onCellClick,
}: ScheduleGridProps) {
  const employeeIds = Object.keys(employees);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${dayNames[date.getDay()]}\n${date.getDate()}`;
  };

  const handleCellClick = (empId: string, date: string) => {
    onCellClick(empId as any, date);
  };

  const getShiftClass = (shift: ShiftType): string => {
    return SHIFT_CLASSES[shift] || "";
  };

  const getShiftLabel = (shift: ShiftType): string => {
    return SHIFT_LABELS[shift] || shift;
  };

  return (
    <div className="schedule-container">
      <table className="schedule-table">
        <thead>
          <tr>
            <th className="employee-header">Employee</th>
            {dates.map((date) => (
              <th key={date} className="date-header">
                {formatDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employeeIds.map((empId) => {
            const employee = employees[empId as any];
            return (
              <tr key={empId}>
                <td className="employee-cell">
                  <div className="employee-info">
                    <div className="employee-name">{employee.name}</div>
                    <div className="employee-role">{employee.role}</div>
                  </div>
                </td>
                {dates.map((date) => {
                  const shift = schedule[date]?.[empId as any] || "off";
                  return (
                    <td
                      key={`${empId}-${date}`}
                      className={`schedule-cell ${getShiftClass(shift)}`}
                      onClick={() => handleCellClick(empId, date)}
                      title={`${employee.name} - ${date} - ${shift}`}
                    >
                      {getShiftLabel(shift)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
