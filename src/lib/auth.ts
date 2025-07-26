// Authentication utilities - Next.js compatible version
// Following CLAUDE.md C-4: Simple, composable functions

// Following CLAUDE.md C-5: Branded types for session data
interface LegacySessionData {
  isLoggedIn: boolean;
  timestamp: number;
  legacy: boolean;
  expiresAt: number;
}

export const AuthUtils = {
  // For backward compatibility with existing password system
  // TODO: Remove this once proper Supabase Auth is fully implemented
  async validateLegacyPassword(password: string): Promise<boolean> {
    // In production, this should be replaced with proper email/password auth
    // This is a temporary migration helper
    const validPasswords = process.env.LEGACY_PASSWORDS?.split(",") || [
      "mmc_pulmo",
    ];
    return validPasswords.includes(password);
  },

  // Simple session management for legacy system
  createLegacySession(): LegacySessionData {
    return {
      isLoggedIn: true,
      timestamp: Date.now(),
      legacy: true,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
  },

  // Validate legacy session
  validateLegacySession(sessionData: unknown): boolean {
    if (!sessionData || typeof sessionData !== "object") {
      return false;
    }

    const now = Date.now();
    const session = sessionData as LegacySessionData;

    return !!(
      session.isLoggedIn &&
      session.expiresAt &&
      now < session.expiresAt
    );
  },

  // Helper to check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    try {
      const loginData = sessionStorage.getItem("loginData");
      if (!loginData) return false;

      const session = JSON.parse(loginData);
      return this.validateLegacySession(session);
    } catch {
      return false;
    }
  },
};
