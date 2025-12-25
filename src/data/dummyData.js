// Sidebar menu configuration for different user roles
export const roleMenus = {
  // Superadmin has access to everything + host management
  superadmin: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Hosts",
      href: "/hosts",
      icon: "🏢",
      section: "System Management",
      permission: "Hosts",
    },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Operations",
      permission: "Properties",
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Operations", permission: "Bookings" },
    { label: "Guests", href: "/guests", icon: "👥", section: "People", permission: "Guests" },
    { label: "Payments", href: "/payments", icon: "💳", section: "Finance", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Operations", permission: "Tasks" },
    {
      label: "Users",
      href: "/users",
      icon: "🛡️",
      section: "Administration",
      permission: "Users",
    },
    {
      label: "Roles",
      href: "/roles",
      icon: "🔐",
      section: "Administration",
      permission: null,
    },
    {
      label: "Permissions",
      href: "/permissions",
      icon: "🔑",
      section: "Administration",
      permission: null,
    },
  ],
  // Host can manage their own properties, bookings, guests, tasks, and staff
  host: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Core Features",
      permission: null, // Hosts always have access to core features
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Core Features", permission: null },
    { label: "Guests", href: "/guests", icon: "👥", section: "Core Features", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Core Features", permission: null },
    { label: "Payments", href: "/payments", icon: "💳", section: "Finance", permission: null },
    {
      label: "Staff",
      href: "/users",
      icon: "👥",
      section: "Team Management",
      permission: null,
    },
  ],
  // Legacy Admin role (same as host for backwards compatibility)
  Admin: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Core Features",
      permission: null,
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Core Features", permission: null },
    { label: "Guests", href: "/guests", icon: "👥", section: "Core Features", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Core Features", permission: null },
    { label: "Payments", href: "/payments", icon: "💳", section: "Finance", permission: null },
    {
      label: "Staff",
      href: "/users",
      icon: "👥",
      section: "Team Management",
      permission: null,
    },
  ],
  // Co-Host - Team member with management permissions
  cohost: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Work",
      permission: "Properties",
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Work", permission: "Bookings" },
    { label: "Guests", href: "/guests", icon: "👥", section: "Work", permission: "Guests" },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
  ],
  "co-host": [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Work",
      permission: "Properties",
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Work", permission: "Bookings" },
    { label: "Guests", href: "/guests", icon: "👥", section: "Work", permission: "Guests" },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
  ],
  // Manager - Team member with management permissions
  manager: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Work",
      permission: "Properties",
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Work", permission: "Bookings" },
    { label: "Guests", href: "/guests", icon: "👥", section: "Work", permission: "Guests" },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
  ],
  Manager: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    {
      label: "Properties",
      href: "/properties",
      icon: "🏡",
      section: "Work",
      permission: "Properties",
    },
    { label: "Bookings", href: "/bookings", icon: "📅", section: "Work", permission: "Bookings" },
    { label: "Guests", href: "/guests", icon: "👥", section: "Work", permission: "Guests" },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
  ],
  // Cleaner - Team member with task-focused permissions
  cleaner: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
    { label: "Properties", href: "/properties", icon: "🏡", section: "Work", permission: "Properties.View Properties" },
  ],
  Cleaner: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
    { label: "Properties", href: "/properties", icon: "🏡", section: "Work", permission: "Properties.View Properties" },
  ],
  // Staff - Team member with limited permissions
  staff: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
    { label: "Guests", href: "/guests", icon: "👥", section: "Work", permission: "Guests" },
  ],
  Staff: [
    { label: "Dashboard", href: "/dashboard", icon: "🏠", section: "Overview", permission: null },
    { label: "Tasks", href: "/tasks", icon: "📝", section: "Work", permission: "Tasks" },
    { label: "Guests", href: "/guests", icon: "👥", section: "Work", permission: "Guests" },
  ],
};
