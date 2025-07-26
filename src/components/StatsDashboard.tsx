"use client";

import React from "react";
import type { StatsDashboardProps } from "@/types/components";

export function StatsDashboard({
  totalEmployees,
  totalHours,
  otHours,
  violations,
}: StatsDashboardProps) {
  return (
    <div className="stats-container">
      <div className="stats-card">
        <div className="stats-title">Total Employees</div>
        <div className="stats-value">{totalEmployees}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">Working Hours</div>
        <div className="stats-value">{totalHours}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">OT Hours</div>
        <div className="stats-value">{otHours}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">Violations</div>
        <div
          className="stats-value"
          style={{ color: violations > 0 ? "#e74c3c" : "inherit" }}
        >
          {violations}
        </div>
      </div>
    </div>
  );
}
