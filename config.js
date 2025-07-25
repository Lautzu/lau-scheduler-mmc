// Configuration file for the scheduler application
const CONFIG = {
  // Move password to environment or server-side validation in production
  TEMP_PASSWORD: "mmc_pulmo", // TODO: Replace with proper authentication
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};

// Basic security utilities
const SecurityUtils = {
  loginAttempts: {},

  isAccountLocked(identifier = "default") {
    const attempts = this.loginAttempts[identifier];
    if (!attempts) return false;

    if (attempts.count >= CONFIG.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLock = Date.now() - attempts.lastAttempt;
      return timeSinceLock < CONFIG.LOCKOUT_DURATION;
    }
    return false;
  },

  recordFailedAttempt(identifier = "default") {
    if (!this.loginAttempts[identifier]) {
      this.loginAttempts[identifier] = { count: 0, lastAttempt: 0 };
    }
    this.loginAttempts[identifier].count++;
    this.loginAttempts[identifier].lastAttempt = Date.now();
  },

  resetAttempts(identifier = "default") {
    delete this.loginAttempts[identifier];
  },

  validatePassword(password) {
    // Basic input sanitization
    if (typeof password !== "string" || password.length === 0) {
      return false;
    }

    // Simple length check
    if (password.length > 100) {
      return false;
    }

    return password === CONFIG.TEMP_PASSWORD;
  },
};
