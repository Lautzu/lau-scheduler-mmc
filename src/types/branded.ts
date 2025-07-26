// Branded types for type safety - following CLAUDE.md C-5
// Use branded types for IDs to prevent mixing different ID types

declare const __brand: unique symbol;

type Brand<T, TBrand> = T & { [__brand]: TBrand };

// Employee ID type
export type EmployeeId = Brand<string, "EmployeeId">;

// Schedule ID type
export type ScheduleId = Brand<string, "ScheduleId">;

// User ID type for Supabase auth
export type UserId = Brand<string, "UserId">;

// Helper functions to create branded types
export const createEmployeeId = (id: string): EmployeeId => id as EmployeeId;
export const createScheduleId = (id: string): ScheduleId => id as ScheduleId;
export const createUserId = (id: string): UserId => id as UserId;

// Helper to extract string value from branded types
export const extractId = <T extends Brand<string, string>>(id: T): string =>
  id as string;
