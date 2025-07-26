import { NextRequest, NextResponse } from "next/server";
import type { Employee } from "@/types/scheduler";
import { createEmployeeId } from "@/types/branded";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const employees: Record<string, Employee> = {};
    data.forEach((emp: any) => {
      employees[emp.id] = {
        id: createEmployeeId(emp.id),
        name: emp.name,
        role: emp.role,
        tenure: emp.tenure,
        canSeniorDuty: emp.can_senior_duty,
      };
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const employee: Employee = await request.json();

    if (!employee.name || !employee.role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("employees")
      .insert({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        tenure: employee.tenure,
        can_senior_duty: employee.canSeniorDuty,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const savedEmployee: Employee = {
      id: createEmployeeId(data.id),
      name: data.name,
      role: data.role,
      tenure: data.tenure,
      canSeniorDuty: data.can_senior_duty,
    };

    return NextResponse.json(savedEmployee, { status: 201 });
  } catch (error) {
    console.error("Failed to create employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const employee: Employee = await request.json();

    if (!employee.id || !employee.name || !employee.role) {
      return NextResponse.json(
        { error: "ID, name and role are required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("employees")
      .update({
        name: employee.name,
        role: employee.role,
        tenure: employee.tenure,
        can_senior_duty: employee.canSeniorDuty,
      })
      .eq("id", employee.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updatedEmployee: Employee = {
      id: createEmployeeId(data.id),
      name: data.name,
      role: data.role,
      tenure: data.tenure,
      canSeniorDuty: data.can_senior_duty,
    };

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("id");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 },
    );
  }
}
