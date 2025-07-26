// Component prop types for scheduler React components
// Following CLAUDE.md C-6: Use import type for type-only imports

import type { EmployeeId, ScheduleId } from "./branded";
import type { Employee, Schedule, ShiftType, DateString } from "./scheduler";

export interface ScheduleGridProps {
  schedule: Record<DateString, Record<EmployeeId, ShiftType>>;
  employees: Record<EmployeeId, Employee>;
  dates: DateString[];
  onShiftChange: (
    empId: EmployeeId,
    date: DateString,
    shift: ShiftType,
  ) => void;
  onCellClick: (empId: EmployeeId, date: DateString) => void;
}

export interface EmployeeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Record<EmployeeId, Employee>;
  onSave: (employee: Employee) => Promise<void>;
  onDelete: (empId: EmployeeId) => Promise<void>;
  selectedEmployeeId?: EmployeeId;
}

export interface LeaveRequestManagerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Record<EmployeeId, Employee>;
  leaveRequests: Record<EmployeeId, DateString[]>;
  onAddLeave: (
    empId: EmployeeId,
    startDate: DateString,
    endDate: DateString,
    type: string,
  ) => Promise<void>;
  onClearLeave: () => Promise<void>;
}

export interface StatsDashboardProps {
  totalEmployees: number;
  totalHours: number;
  otHours: number;
  violations: number;
}

export interface ScheduleActionsProps {
  savedSchedules: Schedule[];
  selectedScheduleId?: ScheduleId;
  onLoad: (scheduleId: ScheduleId) => Promise<void>;
  onSave: (name: string) => Promise<void>;
  onDelete: (scheduleId: ScheduleId) => Promise<void>;
  onExport: () => void;
}

export interface ScheduleState {
  employees: Record<EmployeeId, Employee>;
  schedule: Record<DateString, Record<EmployeeId, ShiftType>>;
  leaveRequests: Record<EmployeeId, DateString[]>;
  dates: DateString[];
  startDate: DateString;
  savedSchedules: Schedule[];
  isLoading: boolean;
  error?: string;
}

export interface ScheduleActions {
  generateSchedule: () => Promise<void>;
  updateShift: (empId: EmployeeId, date: DateString, shift: ShiftType) => void;
  saveEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (empId: EmployeeId) => Promise<void>;
  addLeaveRequest: (
    empId: EmployeeId,
    startDate: DateString,
    endDate: DateString,
    type: string,
  ) => Promise<void>;
  clearLeaveRequests: () => Promise<void>;
  loadSchedule: (scheduleId: ScheduleId) => Promise<void>;
  saveSchedule: (name: string) => Promise<void>;
  deleteSchedule: (scheduleId: ScheduleId) => Promise<void>;
  setStartDate: (date: DateString) => void;
}
