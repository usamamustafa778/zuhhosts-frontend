"use client";

// Static permissions list based on API structure
export const PERMISSIONS = {
  // Properties
  PROPERTIES: "Properties",
  PROPERTIES_VIEW: "Properties.View Properties",
  PROPERTIES_ADD: "Properties.Add Properties",
  PROPERTIES_EDIT: "Properties.Edit Properties",
  PROPERTIES_DELETE: "Properties.Delete Properties",

  // Bookings
  BOOKINGS: "Bookings",
  BOOKINGS_VIEW: "Bookings.View Bookings",
  BOOKINGS_ADD: "Bookings.Add Bookings",
  BOOKINGS_EDIT: "Bookings.Edit Bookings",
  BOOKINGS_DELETE: "Bookings.Delete Bookings",

  // Guests
  GUESTS: "Guests",
  GUESTS_VIEW: "Guests.View Guests",
  GUESTS_ADD: "Guests.Add Guests",
  GUESTS_EDIT: "Guests.Edit Guests",
  GUESTS_DELETE: "Guests.Delete Guests",

  // Tasks
  TASKS: "Tasks",
  TASKS_VIEW: "Tasks.View Tasks",
  TASKS_ADD: "Tasks.Add Tasks",
  TASKS_EDIT: "Tasks.Edit Tasks",
  TASKS_DELETE: "Tasks.Delete Tasks",

  // Users
  USERS: "Users",
  USERS_VIEW: "Users.View Users",
  USERS_ADD: "Users.Add User",
  USERS_EDIT: "Users.Edit User",
  USERS_DELETE: "Users.Delete User",

  // Hosts (Superadmin only)
  HOSTS: "Hosts",
  HOSTS_VIEW: "Hosts.View Hosts",
  HOSTS_ADD: "Hosts.Add Host",
  HOSTS_EDIT: "Hosts.Edit Host",
  HOSTS_DELETE: "Hosts.Delete Host",
};

/**
 * Get user permissions from user object
 * @param {Object} user - User object from localStorage
 * @returns {Array<string>} - Array of permission strings
 */
export const getUserPermissions = (user) => {
  if (!user) return [];

  // Superadmin has all permissions
  if (user.role === "superadmin" || user.role?.name === "superadmin") {
    return Object.values(PERMISSIONS);
  }

  // Get permissions from role object
  if (user.role && typeof user.role === "object" && user.role.permissions) {
    return user.role.permissions;
  }

  // Fallback to user.permissions
  return user.permissions || [];
};

/**
 * Check if user has a specific permission
 * @param {Array<string>} userPermissions - User's permissions array
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (!requiredPermission) return true; // No permission required

  // Check exact match
  if (userPermissions.includes(requiredPermission)) return true;

  // Check parent permission (e.g., "Properties" covers all "Properties.*")
  const parts = requiredPermission.split(".");
  if (parts.length > 1) {
    const parentPermission = parts[0];
    if (userPermissions.includes(parentPermission)) return true;
  }

  return false;
};

/**
 * Check if user has ANY of the required permissions
 * @param {Array<string>} userPermissions - User's permissions array
 * @param {Array<string>} requiredPermissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.some((perm) => hasPermission(userPermissions, perm));
};

/**
 * Check if user has ALL of the required permissions
 * @param {Array<string>} userPermissions - User's permissions array
 * @param {Array<string>} requiredPermissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.every((perm) => hasPermission(userPermissions, perm));
};

/**
 * Filter array of items based on permissions
 * @param {Array} items - Array of items with permission property
 * @param {Array<string>} userPermissions - User's permissions array
 * @param {string} permissionKey - Key to get permission from item (default: "permission")
 * @returns {Array} - Filtered array
 */
export const filterByPermission = (items, userPermissions, permissionKey = "permission") => {
  return items.filter((item) => {
    const requiredPermission = item[permissionKey];
    if (!requiredPermission) return true; // No permission required
    return hasPermission(userPermissions, requiredPermission);
  });
};

/**
 * Get permission level for CRUD operations
 * @param {Array<string>} userPermissions - User's permissions array
 * @param {string} module - Module name (e.g., "Properties", "Users")
 * @returns {Object} - Object with canView, canAdd, canEdit, canDelete
 */
export const getModulePermissions = (userPermissions, module) => {
  return {
    canView: hasPermission(userPermissions, `${module}.View ${module}`) || 
             hasPermission(userPermissions, module),
    canAdd: hasPermission(userPermissions, `${module}.Add ${module}`) || 
            hasPermission(userPermissions, module),
    canEdit: hasPermission(userPermissions, `${module}.Edit ${module}`) || 
             hasPermission(userPermissions, module),
    canDelete: hasPermission(userPermissions, `${module}.Delete ${module}`) || 
               hasPermission(userPermissions, module),
  };
};

