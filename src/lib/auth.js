"use client";

const TOKEN_KEY = "luxeboard.authToken";
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
    window.dispatchEvent(new Event("auth-change"));
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Dispatch custom event to notify auth state change
  window.dispatchEvent(new Event("auth-change"));
};

export const clearAuthUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  // Dispatch custom event to notify auth state change
  window.dispatchEvent(new Event("auth-change"));
};

/**
 * Determine the user type based on user properties
 * @param {Object} user - User object
 * @returns {"superadmin" | "host" | "team_member" | null}
 */
export const getUserType = (user) => {
  if (!user) return null;
  
  // Check if superadmin by role
  if (user.role === "superadmin" || user.role?.name === "superadmin") {
    return "superadmin";
  }
  
  // Check if host
  if (user.host === true || user.isHost === true) {
    return "host";
  }
  
  // Check if team member (has a hostId)
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
 * Check if user is a host
 * @param {Object} user - User object
 * @returns {boolean}
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
  if (userType === "host") return "Host";
  if (userType === "team_member") {
    // Return the actual role if available
    if (user.role?.name) return user.role.name;
    if (typeof user.role === "string") return user.role;
    return "Team Member";
  }
  
  return "User";
};

