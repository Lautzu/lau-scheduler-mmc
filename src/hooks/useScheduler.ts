"use client";

import { useState, useCallback, useEffect } from "react";
import type { ScheduleState, ScheduleActions } from "@/types/components";
import type {
  Employee,
  Schedule,
  ShiftType,
  DateString,
} from "@/types/scheduler";
import type { EmployeeId, ScheduleId } from "@/types/branded";
import { createEmployeeId, extractId } from "@/types/branded";

const INITIAL_STATE: ScheduleState = {
  employees: {},
  schedule: {},
  leaveRequests: {},
  dates: [],
  startDate: new Date().toISOString().split("T")[0],
  savedSchedules: [],
  isLoading: false,
  error: undefined,
};

export function useScheduler(): [ScheduleState, ScheduleActions] {
  const [state, setState] = useState<ScheduleState>(INITIAL_STATE);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error?: string) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to load employees");

      const employees = await response.json();
      setState((prev) => ({ ...prev, employees }));
    } catch (error) {
      console.error("Failed to load employees:", error);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const loadSavedSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/schedules");
      if (!response.ok) throw new Error("Failed to load schedules");

      const schedules = await response.json();
      setState((prev) => ({ ...prev, savedSchedules: schedules }));
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setError("Failed to load saved schedules");
    }
  }, [setError]);

  useEffect(() => {
    loadEmployees();
    loadSavedSchedules();
  }, [loadEmployees, loadSavedSchedules]);

  const generateSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const response = await fetch("/api/schedule-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employees: state.employees,
          startDate: state.startDate,
          leaveRequests: state.leaveRequests,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate schedule");
      }

      const result = await response.json();
      setState((prev) => ({
        ...prev,
        schedule: result.schedule,
        dates: result.dates,
      }));
    } catch (error) {
      console.error("Failed to generate schedule:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate schedule",
      );
    } finally {
      setLoading(false);
    }
  }, [
    state.employees,
    state.startDate,
    state.leaveRequests,
    setLoading,
    setError,
  ]);

  const updateShift = useCallback(
    (empId: EmployeeId, date: DateString, shift: ShiftType) => {
      setState((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [date]: {
            ...prev.schedule[date],
            [empId]: shift,
          },
        },
      }));
    },
    [],
  );

  const saveEmployee = useCallback(
    async (employee: Employee) => {
      try {
        setLoading(true);

        const existingEmployee = state.employees[employee.id];
        const method = existingEmployee ? "PUT" : "POST";

        const response = await fetch("/api/employees", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employee),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save employee");
        }

        const savedEmployee = await response.json();
        setState((prev) => ({
          ...prev,
          employees: {
            ...prev.employees,
            [savedEmployee.id]: savedEmployee,
          },
        }));
      } catch (error) {
        console.error("Failed to save employee:", error);
        setError(
          error instanceof Error ? error.message : "Failed to save employee",
        );
      } finally {
        setLoading(false);
      }
    },
    [state.employees, setLoading, setError],
  );

  const deleteEmployee = useCallback(
    async (empId: EmployeeId) => {
      try {
        setLoading(true);

        const response = await fetch(`/api/employees?id=${extractId(empId)}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete employee");
        }

        setState((prev) => {
          const newEmployees = { ...prev.employees };
          delete newEmployees[empId];

          const newSchedule = { ...prev.schedule };
          Object.keys(newSchedule).forEach((date) => {
            if (newSchedule[date][empId]) {
              delete newSchedule[date][empId];
            }
          });

          const newLeaveRequests = { ...prev.leaveRequests };
          delete newLeaveRequests[empId];

          return {
            ...prev,
            employees: newEmployees,
            schedule: newSchedule,
            leaveRequests: newLeaveRequests,
          };
        });
      } catch (error) {
        console.error("Failed to delete employee:", error);
        setError(
          error instanceof Error ? error.message : "Failed to delete employee",
        );
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const addLeaveRequest = useCallback(
    async (
      empId: EmployeeId,
      startDate: DateString,
      endDate: DateString,
      type: string,
    ) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: DateString[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
      }

      setState((prev) => ({
        ...prev,
        leaveRequests: {
          ...prev.leaveRequests,
          [empId]: [...(prev.leaveRequests[empId] || []), ...dates],
        },
      }));
    },
    [],
  );

  const clearLeaveRequests = useCallback(async () => {
    setState((prev) => ({ ...prev, leaveRequests: {} }));
  }, []);

  const loadSchedule = useCallback(
    async (scheduleId: ScheduleId) => {
      try {
        setLoading(true);

        const schedule = state.savedSchedules.find((s) => s.id === scheduleId);
        if (!schedule) throw new Error("Schedule not found");

        setState((prev) => ({
          ...prev,
          employees: schedule.employeeData,
          schedule: schedule.scheduleData,
          leaveRequests: schedule.leaveRequests,
          startDate: schedule.startDate,
          dates: Object.keys(schedule.scheduleData).sort(),
        }));
      } catch (error) {
        console.error("Failed to load schedule:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load schedule",
        );
      } finally {
        setLoading(false);
      }
    },
    [state.savedSchedules, setLoading, setError],
  );

  const saveSchedule = useCallback(
    async (name: string) => {
      try {
        setLoading(true);

        const response = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            employeeData: state.employees,
            scheduleData: state.schedule,
            leaveRequests: state.leaveRequests,
            startDate: state.startDate,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save schedule");
        }

        const savedSchedule = await response.json();
        setState((prev) => ({
          ...prev,
          savedSchedules: [savedSchedule, ...prev.savedSchedules],
        }));
      } catch (error) {
        console.error("Failed to save schedule:", error);
        setError(
          error instanceof Error ? error.message : "Failed to save schedule",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      state.employees,
      state.schedule,
      state.leaveRequests,
      state.startDate,
      setLoading,
      setError,
    ],
  );

  const deleteSchedule = useCallback(
    async (scheduleId: ScheduleId) => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/schedules?id=${extractId(scheduleId)}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete schedule");
        }

        setState((prev) => ({
          ...prev,
          savedSchedules: prev.savedSchedules.filter(
            (s) => s.id !== scheduleId,
          ),
        }));
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        setError(
          error instanceof Error ? error.message : "Failed to delete schedule",
        );
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const setStartDate = useCallback((date: DateString) => {
    setState((prev) => ({ ...prev, startDate: date }));
  }, []);

  const actions: ScheduleActions = {
    generateSchedule,
    updateShift,
    saveEmployee,
    deleteEmployee,
    addLeaveRequest,
    clearLeaveRequests,
    loadSchedule,
    saveSchedule,
    deleteSchedule,
    setStartDate,
  };

  return [state, actions];
}
