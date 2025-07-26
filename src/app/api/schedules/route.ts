import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Schedule } from "@/types/scheduler";
import { createScheduleId } from "@/types/branded";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const schedules: Schedule[] = data.map((schedule) => ({
      id: createScheduleId(schedule.id),
      name: schedule.name,
      employeeData: schedule.employee_data,
      scheduleData: schedule.schedule_data,
      leaveRequests: schedule.leave_requests || {},
      startDate: schedule.start_date,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
    }));

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, employeeData, scheduleData, leaveRequests, startDate } =
      await request.json();

    if (!name || !employeeData || !scheduleData || !startDate) {
      return NextResponse.json(
        {
          error:
            "Name, employee data, schedule data, and start date are required",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        name,
        employee_data: employeeData,
        schedule_data: scheduleData,
        leave_requests: leaveRequests || {},
        start_date: startDate,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const savedSchedule: Schedule = {
      id: createScheduleId(data.id),
      name: data.name,
      employeeData: data.employee_data,
      scheduleData: data.schedule_data,
      leaveRequests: data.leave_requests || {},
      startDate: data.start_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(savedSchedule, { status: 201 });
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 },
    );
  }
}
