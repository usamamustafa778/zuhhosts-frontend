"use client";

import { usePermissions } from "@/hooks/usePermissions";

/**
 * Component to conditionally render children based on permissions
 * 
 * @param {Object} props
 * @param {string|Array<string>} props.permission - Required permission(s)
 * @param {boolean} props.requireAll - If true, requires ALL permissions (default: false, requires ANY)
 * @param {React.ReactNode} props.children - Content to render if permission granted
 * @param {React.ReactNode} props.fallback - Content to render if permission denied
 * @returns {React.ReactNode}
 */
export default function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (!permission) {
    // No permission required, always show
    hasAccess = true;
  } else if (Array.isArray(permission)) {
    // Multiple permissions
    hasAccess = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    // Single permission
    hasAccess = hasPermission(permission);
  }

  return hasAccess ? children : fallback;
}

