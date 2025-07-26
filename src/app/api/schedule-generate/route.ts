import { NextRequest, NextResponse } from "next/server";

function generateDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < 14; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

function initializeSchedule(
  employees: any[],
  dates: string[],
  leaveRequests: Record<string, string[]> = {},
) {
  const schedule: Record<string, Record<string, string>> = {};

  dates.forEach((date) => {
    schedule[date] = {};
    employees.forEach((emp) => {
      const empLeaves = leaveRequests[emp.id] || [];
      schedule[date][emp.id] = empLeaves.includes(date) ? "leave" : "off";
    });
  });

  return schedule;
}

function generateBasicSchedule(
  employees: any[],
  schedule: Record<string, Record<string, string>>,
  dates: string[],
) {
  const shiftTypes = ["day", "evening", "night"];
  const employeeAssignments: Record<string, number> = {};

  employees.forEach((emp) => {
    employeeAssignments[emp.id] = 0;
  });

  dates.forEach((date, dayIndex) => {
    shiftTypes.forEach((shiftType) => {
      const availableEmployees = employees.filter(
        (emp) => schedule[date][emp.id] === "off",
      );

      const sortedEmployees = availableEmployees.sort(
        (a, b) => employeeAssignments[a.id] - employeeAssignments[b.id],
      );

      for (let i = 0; i < Math.min(5, sortedEmployees.length); i++) {
        const emp = sortedEmployees[i];
        schedule[date][emp.id] = shiftType;
        employeeAssignments[emp.id]++;
      }
    });
  });

  return schedule;
}

export async function POST(request: NextRequest) {
  try {
    const { employees, startDate, leaveRequests } = await request.json();

    if (!employees || !startDate) {
      return NextResponse.json(
        { error: "Employees and start date are required" },
        { status: 400 },
      );
    }

    const employeeList = Object.values(employees);
    const dates = generateDates(startDate);

    let schedule = initializeSchedule(employeeList, dates, leaveRequests || {});
    schedule = generateBasicSchedule(employeeList, schedule, dates);

    return NextResponse.json({
      schedule,
      dates,
      validation: { violations: [] },
      stats: {
        totalEmployees: Object.keys(employees).length,
        totalHours: 0,
        otHours: 0,
        violations: 0,
      },
    });
  } catch (error) {
    console.error("Failed to generate schedule:", error);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 },
    );
  }
}
