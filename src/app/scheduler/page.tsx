"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { EmployeeManager } from "@/components/EmployeeManager";
import { LeaveRequestManager } from "@/components/LeaveRequestManager";
import { StatsDashboard } from "@/components/StatsDashboard";
import { ScheduleActions } from "@/components/ScheduleActions";
import { useScheduler } from "@/hooks/useScheduler";
import type { EmployeeId } from "@/types/branded";
import "./scheduler.css";

export default function SchedulerPage() {
  const router = useRouter();
  const [state, actions] = useScheduler();
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    EmployeeId | undefined
  >();

  useEffect(() => {
    const loginData = sessionStorage.getItem("loginData");
    if (!loginData) {
      router.push("/login");
      return;
    }

    try {
      const session = JSON.parse(loginData);
      const now = Date.now();

      if (session.expiresAt && now > session.expiresAt) {
        sessionStorage.removeItem("loginData");
        router.push("/login");
        return;
      }

      if (!session.isLoggedIn) {
        router.push("/login");
        return;
      }
    } catch {
      sessionStorage.removeItem("loginData");
      router.push("/login");
      return;
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("loginData");
    router.push("/login");
  };

  const handleCellClick = (empId: EmployeeId, date: string) => {
    setSelectedEmployeeId(empId);
  };

  const handleShiftChange = (empId: EmployeeId, date: string, shift: any) => {
    actions.updateShift(empId, date, shift);
  };

  const calculateStats = () => {
    const totalEmployees = Object.keys(state.employees).length;
    let totalHours = 0;
    let otHours = 0;

    Object.values(state.schedule).forEach((daySchedule) => {
      Object.values(daySchedule).forEach((shift) => {
        switch (shift) {
          case "day":
          case "evening":
          case "night":
            totalHours += 8;
            break;
          case "day-ot":
            totalHours += 8;
            otHours += 4;
            break;
          case "night-ot":
            totalHours += 8;
            otHours += 4;
            break;
        }
      });
    });

    return { totalEmployees, totalHours, otHours, violations: 0 };
  };

  const stats = calculateStats();

  return (
    <>
      <div className="scheduler-container">
        <div className="scheduler-header">
          <div className="logo-section">
            <Image
              src="/Makati_Medical_Center_Logo.png"
              alt="Makati Medical Center"
              className="logo"
              width={120}
              height={60}
            />
            <div className="header-text">
              <h1>Makati Medical Center</h1>
              <h2>Staff Scheduler - Pulmonary Laboratory Division</h2>
            </div>
          </div>
          <div className="controls">
            <div className="start-date-container">
              <label htmlFor="scheduleStart">Start Date:</label>
              <input
                type="date"
                id="scheduleStart"
                value={state.startDate}
                onChange={(e) => actions.setStartDate(e.target.value)}
              />
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="action-section">
          <div className="main-actions">
            <button
              onClick={actions.generateSchedule}
              className="btn btn-primary"
              disabled={state.isLoading}
            >
              {state.isLoading ? "Generating..." : "Generate Schedule"}
            </button>
            <button
              onClick={() => setEmployeeModalOpen(true)}
              className="btn btn-secondary"
            >
              Manage Employees
            </button>
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="btn btn-secondary"
            >
              Leave Request
            </button>
          </div>

          <ScheduleActions
            savedSchedules={state.savedSchedules}
            onLoad={actions.loadSchedule}
            onSave={actions.saveSchedule}
            onDelete={actions.deleteSchedule}
            onExport={() => {}} // TODO: Implement export
          />
        </div>

        {state.error && <div className="alert alert-danger">{state.error}</div>}

        <StatsDashboard {...stats} />

        {state.dates.length > 0 && (
          <ScheduleGrid
            schedule={state.schedule}
            employees={state.employees}
            dates={state.dates}
            onShiftChange={handleShiftChange}
            onCellClick={handleCellClick}
          />
        )}
      </div>

      <EmployeeManager
        isOpen={employeeModalOpen}
        onClose={() => {
          setEmployeeModalOpen(false);
          setSelectedEmployeeId(undefined);
        }}
        employees={state.employees}
        onSave={actions.saveEmployee}
        onDelete={actions.deleteEmployee}
        selectedEmployeeId={selectedEmployeeId}
      />

      <LeaveRequestManager
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        employees={state.employees}
        leaveRequests={state.leaveRequests}
        onAddLeave={actions.addLeaveRequest}
        onClearLeave={actions.clearLeaveRequests}
      />

      {state.isLoading && (
        <div className="spinner-overlay" style={{ display: "block" }}>
          <div className="spinner"></div>
        </div>
      )}
    </>
  );
}
