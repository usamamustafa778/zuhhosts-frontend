// Centralized metadata configuration for Zuha Host
export const siteConfig = {
  name: "Zuha Host",
  description: "Modern property management platform for Airbnb hosts. Manage bookings, properties, guests, and earnings all in one place.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://zuhahost.com",
  ogImage: "/og-image.jpg",
  keywords: [
    "property management",
    "Airbnb host",
    "vacation rental",
    "booking management",
    "property rental",
    "host dashboard",
    "rental income tracking",
    "guest management",
    "property listings",
  ],
};

export const pageMetadata = {
  // Auth Pages
  login: {
    title: "Login",
    description: "Sign in to your Zuha Host account to manage your properties and bookings.",
    keywords: "login, sign in, host login, property management login",
  },
  register: {
    title: "Register",
    description: "Create your Zuha Host account and start managing your vacation rental properties today.",
    keywords: "register, sign up, create account, become a host",
  },

  // Dashboard Pages
  dashboard: {
    title: "Dashboard",
    description: "Your property management dashboard. View bookings, earnings, and manage your listings.",
    keywords: "dashboard, overview, property management, host dashboard",
  },
  hostDashboard: {
    title: "Host Dashboard",
    description: "Comprehensive host dashboard with analytics, bookings, and property performance metrics.",
    keywords: "host dashboard, analytics, performance, metrics",
  },
  superadminDashboard: {
    title: "Superadmin Dashboard",
    description: "Platform administration and management dashboard.",
    keywords: "superadmin, administration, platform management",
  },
  staffDashboard: {
    title: "Staff Dashboard",
    description: "Staff member dashboard for managing assigned properties and tasks.",
    keywords: "staff dashboard, team member, property staff",
  },
  platformStaffDashboard: {
    title: "Platform Staff Dashboard",
    description: "Platform staff dashboard for system operations and support.",
    keywords: "platform staff, operations, support dashboard",
  },

  // Bookings
  bookings: {
    title: "Bookings",
    description: "Manage all your property bookings. View, create, and update reservations for your listings.",
    keywords: "bookings, reservations, guest bookings, manage bookings, booking calendar",
  },

  // Properties
  properties: {
    title: "Properties",
    description: "Manage your property listings. Add, edit, and monitor all your vacation rental properties.",
    keywords: "properties, listings, vacation rentals, property management, rental properties",
  },

  // Tasks
  tasks: {
    title: "Tasks",
    description: "Track and manage property maintenance tasks, cleaning schedules, and team assignments.",
    keywords: "tasks, maintenance, cleaning schedule, task management, property tasks",
  },

  // Guests
  guests: {
    title: "Guests",
    description: "Manage your guest database. View guest profiles, booking history, and communication.",
    keywords: "guests, guest management, guest profiles, booking history, guest database",
  },

  // Hosts
  hosts: {
    title: "Hosts",
    description: "Manage host accounts and monitor property performance across the platform.",
    keywords: "hosts, host management, property owners, host accounts",
  },

  // Users
  users: {
    title: "Users",
    description: "User management dashboard. Manage team members, permissions, and roles.",
    keywords: "users, user management, team members, staff management",
  },

  // Earnings
  earnings: {
    title: "Earnings",
    description: "Track your rental income, view transaction history, and manage payouts.",
    keywords: "earnings, income, revenue, payouts, transaction history, rental income",
  },

  // Payments
  payments: {
    title: "Payments",
    description: "Manage payments, view transaction history, and process refunds.",
    keywords: "payments, transactions, payment processing, refunds, payment history",
  },

  // Permissions & Roles
  permissions: {
    title: "Permissions",
    description: "Configure user permissions and access control for your team members.",
    keywords: "permissions, access control, user permissions, authorization",
  },
  roles: {
    title: "Roles",
    description: "Manage user roles and define permission sets for different team members.",
    keywords: "roles, user roles, role management, team roles",
  },

  // Profile Pages
  profile: {
    title: "Account Settings",
    description: "Manage your account settings, preferences, and personal information.",
    keywords: "account settings, profile, user settings, preferences",
  },
  personalInfo: {
    title: "Personal Information",
    description: "Update your personal information, contact details, and profile data.",
    keywords: "personal information, profile details, contact information, user profile",
  },
  security: {
    title: "Login & Security",
    description: "Manage your password, two-factor authentication, and security settings.",
    keywords: "security, password, two-factor authentication, login security, account security",
  },
  privacy: {
    title: "Privacy Settings",
    description: "Control your privacy preferences and data sharing settings.",
    keywords: "privacy, privacy settings, data privacy, privacy preferences",
  },
  notifications: {
    title: "Notification Settings",
    description: "Customize your notification preferences for bookings, payments, and updates.",
    keywords: "notifications, notification settings, alerts, email notifications",
  },
};

// Helper function to generate metadata for a page
export function getPageMetadata(pageKey) {
  const page = pageMetadata[pageKey] || {};
  return {
    title: page.title ? `${page.title} | ${siteConfig.name}` : siteConfig.name,
    description: page.description || siteConfig.description,
    keywords: page.keywords || siteConfig.keywords.join(", "),
  };
}
