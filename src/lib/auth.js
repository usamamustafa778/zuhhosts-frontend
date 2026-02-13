"use client";

const TOKEN_KEY = "luxeboard.authToken";
const REFRESH_TOKEN_KEY = "luxeboard.refreshToken";
const USER_KEY = "luxeboard.authUser";

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // Dispatch custom event to notify auth state change
  window.dispatchEvent(new Event("auth-change"));
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  // Dispatch custom event to notify auth state change
  window.dispatchEvent(new Event("auth-change"));
};

export const getAuthUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setAuthUser = (user) => {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("defaultCurrency");
    window.dispatchEvent(new Event("auth-change"));
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  // Store currency from user object
  if (user.defaultCurrency) {
    localStorage.setItem("defaultCurrency", user.defaultCurrency);
  }
  
  // Dispatch custom event to notify auth state change
  window.dispatchEvent(new Event("auth-change"));
};

export const clearAuthUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("defaultCurrency");
  localStorage.removeItem("defaultCurrency_name");
  // Dispatch custom event to notify auth state change
  window.dispatchEvent(new Event("auth-change"));
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (refreshToken) => {
  if (typeof window === "undefined") return;
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const clearRefreshToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Determine the user type based on user properties.
 * Signups get roleType: 'owner' (owner of their tenant); no roleType: 'host' on User model.
 * @param {Object} user - User object
 * @returns {"superadmin" | "host" | "team_member" | null} "host" = owner dashboard
 */
export const getUserType = (user) => {
  if (!user) return null;

  // Check if superadmin by role
  if (user.role === "superadmin" || user.role?.name === "superadmin") {
    return "superadmin";
  }

  // Owner (business owner – what signups get). Dashboard: /dashboard.
  if (user.roleType === "owner") {
    return "host";
  }
  if (user.host === true || user.isHost === true) {
    return "host";
  }

  // Team member (has a hostId)
  if (user.hostId) {
    return "team_member";
  }

  return null;
};

/**
 * Check if user is a superadmin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  return getUserType(user) === "superadmin";
};

/**
 * Check if user is owner (business owner – tenant owner; what signups get).
 * Internally still "host" for dashboard routing.
 */
export const isHost = (user) => {
  return getUserType(user) === "host";
};

/**
 * Check if user is a team member
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isTeamMember = (user) => {
  return getUserType(user) === "team_member";
};

/**
 * Get the user's effective role name
 * @param {Object} user - User object
 * @returns {string}
 */
export const getUserRoleName = (user) => {
  if (!user) return "Guest";
  
  const userType = getUserType(user);
  if (userType === "superadmin") return "Superadmin";
  if (userType === "host") return "Owner";
  if (userType === "team_member") {
    // Return the actual role if available
    if (user.role?.name) return user.role.name;
    if (typeof user.role === "string") return user.role;
    return "Team Member";
  }
  
  return "User";
};

