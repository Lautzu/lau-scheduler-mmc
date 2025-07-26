// Authentication utilities using Supabase Auth
// Following CLAUDE.md C-4: Simple, composable functions

import { supabase } from "./supabase.js";

export const AuthUtils = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  // For backward compatibility with existing password system
  async validateLegacyPassword(password) {
    // Simple validation for migration period
    return password === "mmc_pulmo";
  },

  // Helper to check if user is authenticated
  async isAuthenticated() {
    const session = await this.getCurrentSession();
    return !!session;
  },
};
