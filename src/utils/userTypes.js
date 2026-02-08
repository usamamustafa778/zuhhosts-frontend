/**
 * USER TYPE DEFINITIONS & ROUTING
 *
 * User roleType from API: owner | manager | front_desk | operations | superadmin.
 * Signups get roleType: 'owner' (owner of their tenant), not "host".
 * "Host" in superadmin context = platform-level tenant/host (separate concept).
 */

/**
 * User Types:
 *
 * 1. OWNER (Business Owner – what signups get)
 *    - roleType: 'owner'
 *    - Dashboard: /dashboard (owner dashboard)
 *
 * 2. HOST STAFF (Team Member)
 *    - roleType: manager | front_desk | operations
 *    - hostId: <ObjectId> (not "superadmin")
 *    - Dashboard: /staff/dashboard
 *
 * 3. SUPERADMIN (Platform Admin)
 *    - role: "superadmin" or role.name: "superadmin"
 *    - Dashboard: /superadmin/dashboard
 *
 * 4. PLATFORM STAFF (Superadmin Staff)
 *    - hostId: "superadmin"
 *    - Dashboard: /platform-staff/dashboard
 */

export const USER_TYPES = {
  /** Owner of their tenant (signups get this). Dashboard: /dashboard */
  OWNER: 'OWNER',
  HOST_STAFF: 'HOST_STAFF',
  SUPERADMIN: 'SUPERADMIN',
  PLATFORM_STAFF: 'PLATFORM_STAFF',
  UNKNOWN: 'UNKNOWN',
};

export const USER_TYPE_LABELS = {
  [USER_TYPES.OWNER]: 'Owner (Business Owner)',
  [USER_TYPES.HOST_STAFF]: 'Staff (Team Member)',
  [USER_TYPES.SUPERADMIN]: 'Superadmin',
  [USER_TYPES.PLATFORM_STAFF]: 'Platform Staff',
};

export const USER_TYPE_DASHBOARDS = {
  [USER_TYPES.OWNER]: '/dashboard',
  [USER_TYPES.HOST_STAFF]: '/staff/dashboard',
  [USER_TYPES.SUPERADMIN]: '/superadmin/dashboard',
  [USER_TYPES.PLATFORM_STAFF]: '/platform-staff/dashboard',
};

/**
 * Determine user type from user object
 * @param {Object} user - User object from API
 * @returns {string} USER_TYPES constant
 */
export function getUserType(user) {
  if (!user) return USER_TYPES.UNKNOWN;

  // Check for SUPERADMIN first
  if (user.role === 'superadmin' || user.role?.name === 'superadmin') {
    return USER_TYPES.SUPERADMIN;
  }

  // Check for PLATFORM STAFF
  if (user.hostId === 'superadmin') {
    return USER_TYPES.PLATFORM_STAFF;
  }

  // Check for OWNER (business owner – what signups get; roleType from API)
  if (user.roleType === 'owner') {
    return USER_TYPES.OWNER;
  }
  // Backward compat: legacy host flag
  if (user.host === true && user.hostId == null) {
    return USER_TYPES.OWNER;
  }

  // Check for HOST STAFF (team member: manager, front_desk, operations)
  if (user.hostId && user.hostId !== 'superadmin') {
    return USER_TYPES.HOST_STAFF;
  }

  return USER_TYPES.UNKNOWN;
}

/**
 * Get dashboard route for user
 * @param {Object} user - User object from API
 * @returns {string} Dashboard route
 */
export function getUserDashboard(user) {
  const userType = getUserType(user);
  return USER_TYPE_DASHBOARDS[userType] || '/login';
}

/**
 * Get user type label
 * @param {Object} user - User object from API
 * @returns {string} User type label
 */
export function getUserTypeLabel(user) {
  const userType = getUserType(user);
  return USER_TYPE_LABELS[userType] || 'Unknown';
}

/**
 * Check if user is an OWNER (business owner – tenant owner; what signups get).
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isOwner(user) {
  return getUserType(user) === USER_TYPES.OWNER;
}

/** Alias: isHost = isOwner (owner dashboard was previously called "host") */
export function isHost(user) {
  return isOwner(user);
}

/**
 * Check if user is HOST STAFF
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isHostStaff(user) {
  return getUserType(user) === USER_TYPES.HOST_STAFF;
}

/**
 * Check if user is SUPERADMIN
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isSuperadmin(user) {
  return getUserType(user) === USER_TYPES.SUPERADMIN;
}

/**
 * Check if user is PLATFORM STAFF
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isPlatformStaff(user) {
  return getUserType(user) === USER_TYPES.PLATFORM_STAFF;
}

/**
 * Get available navigation items based on user type
 * @param {Object} user - User object
 * @returns {Array} Navigation items
 */
export function getNavigationItems(user) {
  const userType = getUserType(user);

  const navItems = {
    [USER_TYPES.OWNER]: [
      { label: 'Dashboard', icon: '📊', path: '/dashboard' },
      { label: 'Properties', icon: '🏘️', path: '/properties' },
      { label: 'Bookings', icon: '📅', path: '/bookings' },
      { label: 'Team', icon: '👥', path: '/roles' },
      { label: 'Guests', icon: '🎫', path: '/guests' },
      { label: 'Payments', icon: '💰', path: '/payments' },
      { label: 'Tasks', icon: '✅', path: '/tasks' },
      { label: 'Settings', icon: '⚙️', path: '/website' },
    ],
    [USER_TYPES.HOST_STAFF]: [
      { label: 'Dashboard', icon: '📊', path: '/staff/dashboard' },
      { label: 'My Tasks', icon: '✅', path: '/staff/tasks' },
      { label: 'Bookings', icon: '📅', path: '/staff/bookings', permission: 'view_bookings' },
      { label: 'My Profile', icon: '👤', path: '/staff/profile' },
    ],
    [USER_TYPES.SUPERADMIN]: [
      { label: 'Dashboard', icon: '📊', path: '/superadmin/dashboard' },
      { label: 'Hosts', icon: '🏠', path: '/superadmin/hosts' },
      { label: 'Platform Staff', icon: '🛠️', path: '/superadmin/staff' },
      { label: 'Analytics', icon: '📈', path: '/superadmin/analytics' },
      { label: 'Roles', icon: '🔐', path: '/superadmin/roles' },
      { label: 'Permissions', icon: '🔑', path: '/superadmin/permissions' },
    ],
    [USER_TYPES.PLATFORM_STAFF]: [
      { label: 'Dashboard', icon: '📊', path: '/platform-staff/dashboard' },
      { label: 'Hosts', icon: '🏠', path: '/hosts', permission: 'view_all_hosts' },
      { label: 'Support', icon: '🎫', path: '/platform-staff/tickets', permission: 'manage_tickets' },
      { label: 'My Profile', icon: '👤', path: '/platform-staff/profile' },
    ],
  };

  return navItems[userType] || [];
}

