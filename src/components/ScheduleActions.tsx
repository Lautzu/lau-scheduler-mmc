"use client";

import React, { useState } from "react";
import type { ScheduleActionsProps } from "@/types/components";
import { extractId } from "@/types/branded";

export function ScheduleActions({
  savedSchedules,
  selectedScheduleId,
  onLoad,
  onSave,
  onDelete,
  onExport,
}: ScheduleActionsProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    if (!selectedScheduleId) {
      alert("Please select a schedule to load");
      return;
    }

    setIsLoading(true);
    try {
      await onLoad(selectedScheduleId);
    } catch (error) {
      console.error("Failed to load schedule:", error);
      alert("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scheduleName.trim()) {
      alert("Please enter a schedule name");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(scheduleName.trim());
      setScheduleName("");
      setSaveDialogOpen(false);
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("Failed to save schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScheduleId) {
      alert("Please select a schedule to delete");
      return;
    }

    const schedule = savedSchedules.find((s) => s.id === selectedScheduleId);
    if (
      !confirm(`Are you sure you want to delete schedule "${schedule?.name}"?`)
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(selectedScheduleId);
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      alert("Failed to delete schedule");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="schedule-actions">
        <select className="form-control" disabled={isLoading}>
          <option value="">Select Saved Schedule</option>
          {savedSchedules.map((schedule) => (
            <option key={extractId(schedule.id)} value={extractId(schedule.id)}>
              {schedule.name} (
              {new Date(schedule.createdAt).toLocaleDateString()})
            </option>
          ))}
        </select>

        <button
          className="btn btn-secondary"
          onClick={handleLoad}
          disabled={isLoading || !selectedScheduleId}
        >
          {isLoading ? "Loading..." : "Load"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setSaveDialogOpen(true)}
          disabled={isLoading}
        >
          Save Schedule
        </button>

        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={isLoading || !selectedScheduleId}
        >
          {isLoading ? "Deleting..." : "Delete"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onExport}
          disabled={isLoading}
        >
          Export
        </button>
      </div>

      {saveDialogOpen && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setSaveDialogOpen(false)}>
              &times;
            </span>
            <h2>Save Schedule</h2>

            <div className="form-group">
              <label htmlFor="scheduleName">Schedule Name:</label>
              <input
                type="text"
                id="scheduleName"
                className="form-control"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="Enter schedule name"
                disabled={isLoading}
              />
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isLoading || !scheduleName.trim()}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSaveDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
