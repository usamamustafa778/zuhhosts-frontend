/**
 * USER TYPE DEFINITIONS & ROUTING
 * 
 * Clear separation between the 4 user types in the system
 */

/**
 * User Types:
 * 
 * 1. HOST (Property Owner)
 *    - host: true
 *    - hostId: null
 *    - Dashboard: /host/dashboard
 * 
 * 2. HOST STAFF (Team Member)
 *    - host: false
 *    - hostId: <ObjectId> (not "superadmin")
 *    - Dashboard: /staff/dashboard
 * 
 * 3. SUPERADMIN (Platform Admin)
 *    - role: "superadmin" or role.name: "superadmin"
 *    - Dashboard: /superadmin/dashboard
 * 
 * 4. PLATFORM STAFF (Superadmin Staff)
 *    - host: false
 *    - hostId: "superadmin"
 *    - Dashboard: /platform-staff/dashboard
 */

export const USER_TYPES = {
  HOST: 'HOST',
  HOST_STAFF: 'HOST_STAFF',
  SUPERADMIN: 'SUPERADMIN',
  PLATFORM_STAFF: 'PLATFORM_STAFF',
  UNKNOWN: 'UNKNOWN',
};

export const USER_TYPE_LABELS = {
  [USER_TYPES.HOST]: '🏠 Host (Property Owner)',
  [USER_TYPES.HOST_STAFF]: '👤 Staff (Team Member)',
  [USER_TYPES.SUPERADMIN]: '⭐ Superadmin',
  [USER_TYPES.PLATFORM_STAFF]: '🛠️ Platform Staff',
};

export const USER_TYPE_DASHBOARDS = {
  [USER_TYPES.HOST]: '/host/dashboard',
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

  // Check for HOST (property owner)
  if (user.host === true && user.hostId === null) {
    return USER_TYPES.HOST;
  }

  // Check for HOST STAFF (team member)
  if (user.host === false && user.hostId && user.hostId !== 'superadmin') {
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
 * Check if user is a HOST
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isHost(user) {
  return getUserType(user) === USER_TYPES.HOST;
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
    [USER_TYPES.HOST]: [
      { label: 'Dashboard', icon: '📊', path: '/host/dashboard' },
      { label: 'Properties', icon: '🏘️', path: '/host/properties' },
      { label: 'Bookings', icon: '📅', path: '/host/bookings' },
      { label: 'Team', icon: '👥', path: '/host/team' },
      { label: 'Guests', icon: '🎫', path: '/guests' },
      { label: 'Payments', icon: '💰', path: '/host/payments' },
      { label: 'Tasks', icon: '✅', path: '/host/tasks' },
      { label: 'Settings', icon: '⚙️', path: '/host/settings' },
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

