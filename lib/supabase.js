// Supabase client configuration
// Following CLAUDE.md C-4: Simple, composable functions

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage utilities to replace localStorage functionality
export const StorageUtils = {
  async getEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  async saveEmployee(employee) {
    const { data, error } = await supabase
      .from("employees")
      .upsert(employee)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteEmployee(id) {
    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) throw error;
  },

  async getSchedules() {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async saveSchedule(schedule) {
    const { data, error } = await supabase
      .from("schedules")
      .upsert(schedule)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteSchedule(name) {
    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("name", name);

    if (error) throw error;
  },

  // Migration helper to import localStorage data
  async migrateLocalStorageData() {
    if (typeof window === "undefined") return;

    try {
      // Migrate employees
      const employeesData = localStorage.getItem("employees");
      if (employeesData) {
        const employees = JSON.parse(employeesData);
        for (const employee of employees) {
          await this.saveEmployee(employee);
        }
        localStorage.removeItem("employees");
      }

      // Migrate saved schedules
      const schedulesData = localStorage.getItem("savedSchedules");
      if (schedulesData) {
        const schedules = JSON.parse(schedulesData);
        for (const schedule of schedules) {
          await this.saveSchedule(schedule);
        }
        localStorage.removeItem("savedSchedules");
      }
    } catch (error) {
      console.warn("Migration from localStorage failed:", error);
    }
  },
};
