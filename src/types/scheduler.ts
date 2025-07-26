// TypeScript type definitions for scheduler business logic
// Following CLAUDE.md C-5: Use branded types for IDs

import type { EmployeeId, ScheduleId } from "./branded";

export type DateString = string; // ISO date string format
export type ShiftType =
  | "day"
  | "evening"
  | "night"
  | "day-ot"
  | "night-ot"
  | "off"
  | "leave";

export interface Employee {
  id: EmployeeId;
  name: string;
  role: string;
  tenure: number;
  canSeniorDuty: boolean;
}

export interface Shift {
  name: string;
  time: string;
  hours: number;
  class: string;
}

export interface ScheduleAssignmentParams {
  date: DateString;
  shiftType: ShiftType;
  availableEmployees: Employee[];
  consecutiveDays: Record<EmployeeId, number>;
  weekNum: number;
  dates: DateString[];
  offDaysCount: Record<EmployeeId, number>;
}

export interface Schedule {
  id: ScheduleId;
  name: string;
  employeeData: Record<EmployeeId, Employee>;
  scheduleData: Record<DateString, Record<EmployeeId, ShiftType>>;
  leaveRequests: Record<EmployeeId, DateString[]>;
  startDate: DateString;
  createdAt: string;
  updatedAt: string;
}

// Configuration types
export interface ShiftConfig {
  [key: string]: Shift;
}

export interface DepartmentConfig {
  [department: string]: {
    shifts: ShiftType[];
    requiredEmployees: number;
  };
}
