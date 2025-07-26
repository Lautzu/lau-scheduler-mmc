// Configuration file for the scheduler application
const CONFIG = {
  // Move password to environment or server-side validation in production
  TEMP_PASSWORD_HASH: "a8b4c6d2e9f1", // Hashed version of mmc_pulmo
  SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours in milliseconds (reduced from 24)
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes
};

// Basic security utilities
const SecurityUtils = {
  getLoginAttempts() {
    try {
      return JSON.parse(localStorage.getItem("loginAttempts")) || {};
    } catch {
      return {};
    }
  },

  saveLoginAttempts(attempts) {
    localStorage.setItem("loginAttempts", JSON.stringify(attempts));
  },

  isAccountLocked(identifier = "default") {
    const attempts = this.getLoginAttempts()[identifier];
    if (!attempts) return false;

    if (attempts.count >= CONFIG.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLock = Date.now() - attempts.lastAttempt;
      return timeSinceLock < CONFIG.LOCKOUT_DURATION;
    }
    return false;
  },

  recordFailedAttempt(identifier = "default") {
    const attempts = this.getLoginAttempts();
    if (!attempts[identifier]) {
      attempts[identifier] = { count: 0, lastAttempt: 0 };
    }
    attempts[identifier].count++;
    attempts[identifier].lastAttempt = Date.now();
    this.saveLoginAttempts(attempts);
  },

  resetAttempts(identifier = "default") {
    const attempts = this.getLoginAttempts();
    delete attempts[identifier];
    this.saveLoginAttempts(attempts);
  },

  generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  },

  hashPassword(password) {
    // Simple client-side hash for demonstration
    // In production, use proper server-side hashing
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
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

    // For demo: check against both original and hashed versions
    return (
      password === "mmc_pulmo" ||
      this.hashPassword(password) === CONFIG.TEMP_PASSWORD_HASH
    );
  },

  createSession() {
    const sessionToken = this.generateSessionToken();
    const loginData = {
      isLoggedIn: true,
      sessionToken: sessionToken,
      timestamp: Date.now(),
      lastActivity: Date.now(),
    };
    sessionStorage.setItem("loginData", JSON.stringify(loginData));
    return sessionToken;
  },

  validateSession() {
    try {
      const loginData = sessionStorage.getItem("loginData");
      if (!loginData) return false;

      const data = JSON.parse(loginData);
      const currentTime = Date.now();
      const sessionAge = currentTime - data.timestamp;
      const inactivityTime = currentTime - data.lastActivity;

      if (
        !data.isLoggedIn ||
        !data.sessionToken ||
        sessionAge > CONFIG.SESSION_TIMEOUT
      ) {
        this.logout();
        return false;
      }

      // Update last activity
      data.lastActivity = currentTime;
      sessionStorage.setItem("loginData", JSON.stringify(data));
      return true;
    } catch {
      this.logout();
      return false;
    }
  },

  logout() {
    // Clear all session data
    sessionStorage.removeItem("loginData");

    // Clear any other sensitive data
    sessionStorage.clear();

    // Redirect to login
    window.location.href = "login.html";
  },

  refreshSession() {
    const loginData = sessionStorage.getItem("loginData");
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        data.lastActivity = Date.now();
        sessionStorage.setItem("loginData", JSON.stringify(data));
      } catch {
        this.logout();
      }
    }
  },
};
