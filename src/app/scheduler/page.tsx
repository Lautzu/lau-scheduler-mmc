"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SchedulerPage() {
  const router = useRouter();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Check authentication
    const loginData = sessionStorage.getItem("loginData");
    if (!loginData) {
      router.push("/login");
      return;
    }

    // Load the original scheduler scripts if not already loaded
    if (!scriptLoaded.current) {
      scriptLoaded.current = true;

      // Dynamically load all the original JS files
      const scripts = [
        "/lib/config.js",
        "/lib/types.js",
        "/lib/validation.js",
        "/lib/schedule-core.js",
        "/lib/schedule-validation.js",
        "/lib/schedule-optimization.js",
        "/lib/schedule-assignment.js",
        "/lib/employee-management.js",
        "/lib/schedule-history.js",
        "/lib/scheduler.js",
      ];

      const loadScript = (src: string) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.type = "module";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      // Load scripts sequentially to maintain dependencies
      const loadAllScripts = async () => {
        for (const src of scripts) {
          try {
            await loadScript(src);
          } catch (error) {
            console.error(`Failed to load script: ${src}`, error);
          }
        }
      };

      loadAllScripts();
    }
  }, [router]);

  return (
    <>
      {/* Preserve the exact HTML structure from scheduler.html */}
      <div className="container">
        <div className="header">
          <div className="logo-section">
            <img
              src="/Makati_Medical_Center_Logo.png"
              alt="Makati Medical Center"
              className="logo"
            />
            <div className="header-text">
              <h1>Makati Medical Center</h1>
              <h2>Staff Scheduler - Pulmonary Laboratory Division</h2>
            </div>
          </div>
          <div className="controls">
            <div className="start-date-container">
              <label htmlFor="startDate">Start Date:</label>
              <input type="date" id="startDate" />
            </div>
            <button id="logoutBtn" className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="action-section">
          <div className="main-actions">
            <button id="generateBtn" className="btn btn-primary">
              Generate Schedule
            </button>
            <button id="manageEmployeesBtn" className="btn btn-secondary">
              Manage Employees
            </button>
            <button id="leaveRequestBtn" className="btn btn-secondary">
              Leave Request
            </button>
          </div>
          <div className="schedule-actions">
            <select id="savedScheduleSelect" className="form-control">
              <option value="">Select Saved Schedule</option>
            </select>
            <button id="loadScheduleBtn" className="btn btn-secondary">
              Load
            </button>
            <button id="saveScheduleBtn" className="btn btn-secondary">
              Save Schedule
            </button>
            <button id="deleteScheduleBtn" className="btn btn-danger">
              Delete
            </button>
            <button id="exportScheduleBtn" className="btn btn-secondary">
              Export
            </button>
          </div>
        </div>

        <div id="alertSection" className="alert-section"></div>

        <div className="stats-container">
          <div className="stats-card">
            <div className="stats-title">Total Employees</div>
            <div id="totalEmployees" className="stats-value">
              0
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-title">Working Hours</div>
            <div id="totalHours" className="stats-value">
              0
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-title">OT Hours</div>
            <div id="totalOT" className="stats-value">
              0
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-title">Violations</div>
            <div id="violationCount" className="stats-value">
              0
            </div>
          </div>
        </div>

        <div id="scheduleContainer" className="schedule-container"></div>
      </div>

      {/* Employee Modal */}
      <div id="employeeModal" className="modal">
        <div className="modal-content">
          <span className="close" id="closeEmployeeModal">
            &times;
          </span>
          <h2>Employee Management</h2>
          <div className="form-group">
            <label htmlFor="employeeSelect">Select Employee:</label>
            <select id="employeeSelect" className="form-control">
              <option value="">➕ Add New Employee</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="employeeName">Name:</label>
            <input type="text" id="employeeName" className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="employeeRole">Role:</label>
            <select id="employeeRole" className="form-control">
              <option value="Senior-on-Duty">Senior-on-Duty</option>
              <option value="ICU">ICU</option>
              <option value="WARDS">WARDS</option>
              <option value="Emergency">Emergency</option>
              <option value="Outpatient">Outpatient</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" id="employeeCanSeniorDuty" />
              Can perform Senior-on-Duty
            </label>
          </div>
          <div className="form-actions">
            <button id="saveEmployeeBtn" className="btn btn-primary">
              Save
            </button>
            <button id="deleteEmployeeBtn" className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      <div id="leaveModal" className="modal">
        <div className="modal-content">
          <span className="close" id="closeLeaveModal">
            &times;
          </span>
          <h2>Leave Request</h2>
          <div className="form-group">
            <label htmlFor="leaveEmployee">Employee:</label>
            <select id="leaveEmployee" className="form-control">
              <option value="">Select Employee</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="leaveStartDate">Start Date:</label>
            <input type="date" id="leaveStartDate" className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="leaveEndDate">End Date:</label>
            <input type="date" id="leaveEndDate" className="form-control" />
          </div>
          <div className="form-actions">
            <button id="addLeaveBtn" className="btn btn-primary">
              Add Leave
            </button>
            <button id="clearLeaveBtn" className="btn btn-secondary">
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Add the original scheduler styles inline to preserve exact appearance */}
      <style jsx global>{`
        .container {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo {
          max-height: 60px;
          width: auto;
        }

        .header-text h1 {
          color: #2e5db7;
          font-size: 1.8em;
          margin: 0;
          font-weight: 700;
        }

        .header-text h2 {
          color: #666;
          font-size: 1em;
          margin: 5px 0 0 0;
          font-weight: 400;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .start-date-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background-color: #2e5db7;
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .action-section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .main-actions,
        .schedule-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .schedule-actions:last-child {
          margin-bottom: 0;
        }

        .form-control {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stats-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stats-title {
          font-size: 0.9em;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stats-value {
          font-size: 2em;
          font-weight: bold;
          color: #2e5db7;
        }

        .schedule-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .alert-section {
          margin-bottom: 20px;
        }

        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          background-color: white;
          margin: 10% auto;
          padding: 30px;
          border-radius: 10px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          line-height: 1;
        }

        .close:hover {
          color: #000;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 15px;
          }

          .main-actions,
          .schedule-actions {
            flex-wrap: wrap;
          }

          .stats-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
