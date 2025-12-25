"use client";

import { useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  filterByPermission,
  getModulePermissions,
} from "@/lib/permissions";

/**
 * Hook to check user permissions
 * @returns {Object} - Permission checking utilities
 */
export function usePermissions() {
  const { user } = useAuth();

  // Get user permissions (memoized)
  const userPermissions = useMemo(() => {
    return getUserPermissions(user);
  }, [user]);

  // Permission checking functions
  const checkPermission = (permission) => hasPermission(userPermissions, permission);
  
  const checkAnyPermission = (permissions) => hasAnyPermission(userPermissions, permissions);
  
  const checkAllPermissions = (permissions) => hasAllPermissions(userPermissions, permissions);
  
  const filterItems = (items, permissionKey) => filterByPermission(items, userPermissions, permissionKey);
  
  const getPermissions = (module) => getModulePermissions(userPermissions, module);

  return {
    permissions: userPermissions,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    filterByPermission: filterItems,
    getModulePermissions: getPermissions,
  };
}

/**
 * HOC to wrap component with permission check
 * @param {React.Component} Component - Component to wrap
 * @param {string|Array<string>} requiredPermission - Required permission(s)
 * @param {React.Component} FallbackComponent - Component to show if no permission
 * @returns {React.Component}
 */
export function withPermission(Component, requiredPermission, FallbackComponent = null) {
  return function PermissionWrappedComponent(props) {
    const { hasPermission, hasAnyPermission } = usePermissions();

    const hasAccess = Array.isArray(requiredPermission)
      ? hasAnyPermission(requiredPermission)
      : hasPermission(requiredPermission);

    if (!hasAccess) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <Component {...props} />;
  };
}

