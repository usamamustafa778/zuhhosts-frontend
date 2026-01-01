"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import { useDashboard } from "@/components/layout/DashboardShell";
import {
  getAllRoles,
  deleteRole as deleteRoleApi,
  createRole,
  updateRolePermissions,
  getAllPermissions,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

// Helper function to flatten nested permissions
const flattenPermissions = (permissions, prefix = "") => {
  let flat = [];

  permissions.forEach((perm) => {
    const fullName = prefix ? `${prefix}.${perm.name}` : perm.name;
    flat.push({
      id: fullName,
      name: fullName,
      display: perm.name,
      level: prefix.split(".").filter(Boolean).length,
    });

    if (perm.sub_permissions && Array.isArray(perm.sub_permissions)) {
      flat = flat.concat(flattenPermissions(perm.sub_permissions, fullName));
    }
  });

  return flat;
};

const formatPermissions = (permissions) =>
  (permissions ?? [])
    .map((permission) =>
      typeof permission === "string" ? permission : permission?.name ?? ""
    )
    .filter(Boolean);

// Helper to organize permissions into tree structure with parent-child relationships
const organizePermissions = (permissions) => {
  const organized = [];
  
  permissions.forEach((perm) => {
    const flatPermissions = flattenPermissions([perm]);
    const rootPerm = {
      ...perm,
      flatChildren: flatPermissions,
    };
    organized.push(rootPerm);
  });
  
  return organized;
};

// Permissions Sidebar Component
const PermissionsSidebar = ({
  isOpen,
  onClose,
  roleName,
  currentPermissions,
  allPermissions,
  onSave,
  isSaving,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPermissions, setExpandedPermissions] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedPermissions(currentPermissions || []);
      // Auto-expand all permissions initially
      const allRootPermissions = allPermissions.map((p) => p._id || p.name);
      setExpandedPermissions(new Set(allRootPermissions));
    }
  }, [isOpen, currentPermissions, allPermissions]);

  const organizedPermissions = organizePermissions(allPermissions);
  
  // Filter based on search
  const filteredPermissions = searchTerm
    ? organizedPermissions.filter((perm) => {
        const flatPerms = perm.flatChildren || [];
        return flatPerms.some((fp) =>
          fp.display.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : organizedPermissions;

  const allFlatPermissions = organizedPermissions.flatMap((p) => p.flatChildren || []);

  // Get all child permissions for a given permission path
  const getAllChildPermissions = (permissionPath) => {
    const children = [];
    
    // Find all permissions that start with this path
    allFlatPermissions.forEach((perm) => {
      if (perm.name.startsWith(permissionPath + '.')) {
        children.push(perm.name);
      }
    });
    
    return children;
  };

  // Get parent permission path
  const getParentPermission = (permissionPath) => {
    const lastDotIndex = permissionPath.lastIndexOf('.');
    if (lastDotIndex === -1) return null;
    return permissionPath.substring(0, lastDotIndex);
  };

  // Get direct children (not nested grandchildren)
  const getDirectChildren = (permissionPath) => {
    const children = [];
    const pathDepth = permissionPath.split('.').length;
    
    allFlatPermissions.forEach((perm) => {
      if (perm.name.startsWith(permissionPath + '.')) {
        const permDepth = perm.name.split('.').length;
        // Only direct children (one level deeper)
        if (permDepth === pathDepth + 1) {
          children.push(perm.name);
        }
      }
    });
    
    return children;
  };

  const togglePermission = (permName) => {
    setSelectedPermissions((prev) => {
      const isCurrentlySelected = prev.includes(permName);
      
      if (isCurrentlySelected) {
        // Deselecting: remove this permission, all its children, and deselect parents
        const childPermissions = getAllChildPermissions(permName);
        let newSelections = prev.filter((p) => p !== permName && !childPermissions.includes(p));
        
        // Also deselect all parent permissions
        let parent = getParentPermission(permName);
        while (parent) {
          newSelections = newSelections.filter((p) => p !== parent);
          parent = getParentPermission(parent);
        }
        
        return newSelections;
      } else {
        // Selecting: add this permission and all its children
        const childPermissions = getAllChildPermissions(permName);
        let newSelections = [...new Set([...prev, permName, ...childPermissions])];
        
        // Check if we should auto-select parent permissions
        let parent = getParentPermission(permName);
        while (parent) {
          const siblings = getDirectChildren(parent);
          const allSiblingsSelected = siblings.every((sibling) => newSelections.includes(sibling));
          
          if (allSiblingsSelected && siblings.length > 0) {
            newSelections.push(parent);
          }
          
          parent = getParentPermission(parent);
        }
        
        return [...new Set(newSelections)];
      }
    });
  };

  const toggleExpanded = (permId) => {
    setExpandedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  // Check if a permission is partially selected (some children selected, but not all)
  const isPartiallySelected = (permName) => {
    const childPermissions = getAllChildPermissions(permName);
    if (childPermissions.length === 0) return false;
    
    const selectedChildren = childPermissions.filter((child) =>
      selectedPermissions.includes(child)
    );
    
    return selectedChildren.length > 0 && selectedChildren.length < childPermissions.length;
  };

  const toggleSelectAll = () => {
    if (selectedPermissions.length === allFlatPermissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allFlatPermissions.map((p) => p.name));
    }
  };

  const handleSave = () => {
    onSave(selectedPermissions);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-hidden bg-white shadow-2xl sm:max-w-lg">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Update Permissions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Role: <span className="font-semibold capitalize">{roleName}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search & Select All */}
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {selectedPermissions.length === allFlatPermissions.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <span className="text-sm text-slate-600">
                {selectedPermissions.length} of {allFlatPermissions.length} selected
              </span>
            </div>
          </div>

          {/* Permissions List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              {filteredPermissions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {searchTerm
                    ? "No permissions found matching your search"
                    : "No permissions available"}
                </p>
              ) : (
                filteredPermissions.map((permission) => {
                  const permId = permission._id || permission.name;
                  const isExpanded = expandedPermissions.has(permId);
                  const hasChildren = permission.sub_permissions && permission.sub_permissions.length > 0;
                  
                  return (
                    <div key={permId} className="space-y-1">
                      {/* Root Permission */}
                      <div
                        className={`flex items-center gap-2 rounded-lg border border-slate-200 p-3 transition-colors ${
                          selectedPermissions.includes(permission.name)
                            ? "border-blue-500 bg-blue-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        {/* Expand/Collapse Button */}
                        {hasChildren && (
                          <button
                            onClick={() => toggleExpanded(permId)}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        {!hasChildren && <div className="w-4" />}
                        
                        {/* Checkbox */}
                        <label className="flex flex-1 cursor-pointer items-center gap-3">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.name)}
                              onChange={() => togglePermission(permission.name)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate = !selectedPermissions.includes(permission.name) && isPartiallySelected(permission.name);
                                }
                              }}
                            />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-slate-900">
                            {permission.name}
                          </span>
                          {hasChildren && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              selectedPermissions.includes(permission.name)
                                ? 'bg-blue-100 text-blue-700'
                                : isPartiallySelected(permission.name)
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-900/10 text-slate-600'
                            }`}>
                              {permission.sub_permissions.length}
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Sub-Permissions (Level 1+) */}
                      {hasChildren && isExpanded && (
                        <div className="ml-6 space-y-1">
                          {permission.sub_permissions.map((subPerm, subIdx) => {
                            const subPermName = `${permission.name}.${subPerm.name}`;
                            const hasSubChildren = subPerm.sub_permissions && subPerm.sub_permissions.length > 0;
                            const subPermId = `${permId}-${subIdx}`;
                            const isSubExpanded = expandedPermissions.has(subPermId);
                            
                            return (
                              <div key={subPermId} className="space-y-1">
                                {/* Level 1 Sub-Permission */}
                                <div
                                  className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                                    selectedPermissions.includes(subPermName)
                                      ? "border-blue-400 bg-blue-50/50"
                                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                                  }`}
                                >
                                  {hasSubChildren && (
                                    <button
                                      onClick={() => toggleExpanded(subPermId)}
                                      className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                                      aria-label={isSubExpanded ? "Collapse" : "Expand"}
                                    >
                                      {isSubExpanded ? (
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      ) : (
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                  
                                  {!hasSubChildren && <div className="w-3.5" />}
                                  
                                  <label className="flex flex-1 cursor-pointer items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.includes(subPermName)}
                                      onChange={() => togglePermission(subPermName)}
                                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                      ref={(el) => {
                                        if (el) {
                                          el.indeterminate = !selectedPermissions.includes(subPermName) && isPartiallySelected(subPermName);
                                        }
                                      }}
                                    />
                                    <span className="flex-1 text-xs font-medium text-slate-700">
                                      {subPerm.name}
                                    </span>
                                    {hasSubChildren && (
                                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                        selectedPermissions.includes(subPermName)
                                          ? 'bg-blue-100 text-blue-700'
                                          : isPartiallySelected(subPermName)
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-200 text-slate-600'
                                      }`}>
                                        {subPerm.sub_permissions.length}
                                      </span>
                                    )}
                                  </label>
                                </div>

                                {/* Level 2+ Sub-Permissions */}
                                {hasSubChildren && isSubExpanded && (
                                  <div className="ml-5 space-y-1">
                                    {subPerm.sub_permissions.map((deepSubPerm, deepIdx) => {
                                      const deepSubPermName = `${subPermName}.${deepSubPerm.name}`;
                                      
                                      return (
                                        <label
                                          key={`${subPermId}-${deepIdx}`}
                                          className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                                            selectedPermissions.includes(deepSubPermName)
                                              ? "border-blue-300 bg-blue-50/30"
                                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
                                          }`}
                                        >
                                          <div className="w-3.5" />
                                          <input
                                            type="checkbox"
                                            checked={selectedPermissions.includes(deepSubPermName)}
                                            onChange={() => togglePermission(deepSubPermName)}
                                            className="h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                          />
                                          <span className="flex-1 text-xs text-slate-600">
                                            {deepSubPerm.name}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save & Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function RolesPage() {
  useDashboard(); // Ensure we're in dashboard context
  const { isAuthenticated, isLoading: authLoading, user, isSuperAdmin } = useRequireAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [rolesData, setRolesData] = useState([]);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [error, setError] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [rolePendingDelete, setRolePendingDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionsSidebarOpen, setPermissionsSidebarOpen] = useState(false);
  const [roleForPermissions, setRoleForPermissions] = useState(null);

  // Form states for create (only name now)
  const [createForm, setCreateForm] = useState({
    name: "",
  });

  useEffect(() => {
    // Only load roles if user is authenticated and is superadmin
    if (!isAuthenticated) {
      return;
    }

    // Check if user is superadmin
    const userIsSuperadmin = user?.role === "superadmin" || user?.role?.name === "superadmin";
    if (!userIsSuperadmin) {
      return;
    }

    let isMounted = true;

    const loadRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllRoles();
        if (isMounted) {
          // Handle both direct array and nested response
          const rolesArray = Array.isArray(data) ? data : data?.roles ?? [];
          setRolesData(rolesArray);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load roles");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Load permissions when sidebar is opened
  useEffect(() => {
    if (permissionsSidebarOpen && permissionsData.length === 0) {
      loadPermissions();
    }
  }, [permissionsSidebarOpen]);

  const loadPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const data = await getAllPermissions();
      const permissionsArray = Array.isArray(data)
        ? data
        : data?.data ?? data?.permissions ?? [];
      setPermissionsData(permissionsArray);
    } catch (err) {
      setError(err.message || "Failed to load permissions");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      setIsDeletingId(roleId);
      await deleteRoleApi(roleId);
      setRolesData((prev) => prev.filter((r) => (r.id || r._id) !== roleId));
    } catch (err) {
      setError(err.message || "Failed to delete role");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!rolePendingDelete) return;
    const roleId = rolePendingDelete.id || rolePendingDelete._id;
    await handleDeleteRole(roleId);
    setRolePendingDelete(null);
  };

  const handleCreateRole = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate
      if (!createForm.name.trim()) {
        setError("Role name is required");
        return;
      }

      // Prepare data for API - only name, no permissions
      const roleData = {
        name: createForm.name.trim(),
      };

      const result = await createRole(roleData);
      const newRole = result.role || result;

      setRolesData((prev) => [...prev, newRole]);
      setCreateOpen(false);

      // Reset form
      setCreateForm({
        name: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPermissionsSidebar = (roleItem) => {
    setRoleForPermissions(roleItem);
    setPermissionsSidebarOpen(true);
  };

  const handleSavePermissions = async (selectedPermissions) => {
    if (!roleForPermissions) return;

    try {
      setIsSaving(true);
      setError(null);

      const roleId = roleForPermissions.id || roleForPermissions._id;

      const result = await updateRolePermissions(roleId, selectedPermissions);
      const updatedRole = result.role || result;

      setRolesData((prev) =>
        prev.map((r) =>
          (r.id || r._id) === roleId ? { ...r, ...updatedRole } : r
        )
      );

      setPermissionsSidebarOpen(false);
      setRoleForPermissions(null);
    } catch (err) {
      setError(err.message || "Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const rows = rolesData.map((roleItem, index) => {
    const permissionLabels = formatPermissions(roleItem.permissions);
    const roleId = roleItem.id || roleItem._id || `role-${index}`;

    return {
      id: roleId,
      cells: [
        <span
          key={`name-${roleId}`}
          className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold capitalize text-blue-700"
        >
          {roleItem.name}
        </span>,
        <div key={`permissions-${roleId}`} className="flex flex-wrap gap-1">
          {permissionLabels.length > 0 ? (
            permissionLabels.slice(0, 4).map((permission, permIndex) => (
              <span
                key={`${roleId}-permission-${permIndex}-${permission}`}
                className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
              >
                {permission}
              </span>
            ))
          ) : (
            <span className="text-xs uppercase tracking-wide text-slate-400">
              None
            </span>
          )}
          {permissionLabels.length > 4 && (
            <span className="text-[10px] font-semibold text-slate-400">
              +{permissionLabels.length - 4} more
            </span>
          )}
        </div>,
        <span key={`count-${roleId}`} className="text-sm text-slate-600">
          {permissionLabels.length}{" "}
          {permissionLabels.length === 1 ? "permission" : "permissions"}
        </span>,
        <div className="flex items-center gap-3" key={`actions-${roleId}`}>
          <button
            className="text-sm text-blue-600 underline-offset-2 hover:text-blue-800 hover:underline"
            onClick={() => handleOpenPermissionsSidebar(roleItem)}
          >
            Update Permissions
          </button>
          <button
            className="text-sm text-rose-500 underline-offset-2 hover:text-rose-700 hover:underline disabled:opacity-50"
            disabled={isDeletingId === roleId}
            onClick={() => setRolePendingDelete(roleItem)}
          >
            {isDeletingId === roleId ? "Deleting..." : "Delete"}
          </button>
        </div>,
      ],
    };
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  // Check if user is superadmin
  const userIsSuperadmin = user?.role === "superadmin" || user?.role?.name === "superadmin";
  
  if (!userIsSuperadmin) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        Access denied. This module is only accessible to superadmin users.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading roles…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Roles Management
          </h1>
          <p className="text-sm text-slate-500">
            Define roles and assign permissions to control access levels.
          </p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => setCreateOpen(true)}
        >
          Create role
        </button>
      </div>

      <DataTable
        headers={["Role Name", "Permissions", "Total", ""]}
        rows={rows}
      />

      {/* Create Role Modal - Simplified */}
      <Modal
        title="Create role"
        description="Create a new role. You can assign permissions after creation using the 'Update Permissions' button."
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        primaryActionLabel={isSaving ? "Creating..." : "Create role"}
        primaryAction={handleCreateRole}
      >
        <div className="flex flex-col gap-4">
          <FormField
            label="Role Name"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            placeholder="admin, manager, or staff"
          />
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Roles are created without permissions. After
              creation, use the "Update Permissions" button to assign permissions.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete role"
        description={`Are you sure you want to delete the "${rolePendingDelete?.name}" role?`}
        isOpen={Boolean(rolePendingDelete)}
        onClose={() => setRolePendingDelete(null)}
        primaryActionLabel="Delete"
        primaryAction={handleConfirmDelete}
      >
        <p className="text-sm text-slate-500">
          This action cannot be undone. Users with this role may lose access to
          certain features.
        </p>
      </Modal>

      {/* Permissions Sidebar */}
      <PermissionsSidebar
        isOpen={permissionsSidebarOpen}
        onClose={() => {
          setPermissionsSidebarOpen(false);
          setRoleForPermissions(null);
        }}
        roleName={roleForPermissions?.name}
        currentPermissions={formatPermissions(roleForPermissions?.permissions)}
        allPermissions={permissionsData}
        onSave={handleSavePermissions}
        isSaving={isSaving}
      />
    </div>
  );
}
