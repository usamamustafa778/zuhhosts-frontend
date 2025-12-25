"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import { useDashboard } from "@/components/layout/DashboardShell";
import {
  getAllPermissions,
  deletePermission as deletePermissionApi,
  createPermission,
  updatePermission,
  addSubPermission,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

// Recursive component to render permission tree
const PermissionNode = ({
  permission,
  level = 0,
  onEdit,
  onDelete,
  onAddSubPermission,
  isDeletingId,
  parentPath = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasSubPermissions =
    permission.sub_permissions && permission.sub_permissions.length > 0;

  const bgColor =
    level === 0
      ? "bg-blue-50"
      : level === 1
        ? "bg-slate-50"
        : "bg-slate-50/50";
  const textColor =
    level === 0
      ? "text-blue-900"
      : level === 1
        ? "text-slate-900"
        : "text-slate-700";

  return (
    <div className={`rounded-lg border border-slate-200 ${bgColor} p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasSubPermissions && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-500 hover:text-slate-700"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
          )}
          <span className={`text-sm font-semibold ${textColor}`}>
            {permission.name}
          </span>
          {hasSubPermissions && (
            <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {permission.sub_permissions.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {level === 0 && (
            <>
              <button
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => onAddSubPermission(permission, [])}
              >
                + Sub
              </button>
              <button
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                onClick={() => onEdit(permission)}
              >
                Edit
              </button>
              <button
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                disabled={isDeletingId === permission._id}
                onClick={() => onDelete(permission)}
              >
                {isDeletingId === permission._id ? "..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && hasSubPermissions && (
        <div className="ml-6 mt-3 space-y-2">
          {permission.sub_permissions.map((subPerm, index) => (
            <PermissionNode
              key={`${permission._id}-${index}-${subPerm.name}`}
              permission={subPerm}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubPermission={onAddSubPermission}
              isDeletingId={isDeletingId}
              parentPath={[...parentPath, index]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component to build sub-permissions in the form
const SubPermissionBuilder = ({ subPermissions, onChange }) => {
  const addSubPermission = () => {
    onChange([
      ...subPermissions,
      { name: "", sub_permissions: null },
    ]);
  };

  const removeSubPermission = (index) => {
    onChange(subPermissions.filter((_, i) => i !== index));
  };

  const updateSubPermission = (index, value) => {
    const updated = [...subPermissions];
    updated[index] = { ...updated[index], name: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          Sub-Permissions
        </label>
        <button
          type="button"
          onClick={addSubPermission}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          + Add Sub-Permission
        </button>
      </div>
      {subPermissions.map((subPerm, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={subPerm.name}
            onChange={(e) => updateSubPermission(index, e.target.value)}
            placeholder={`Sub-permission ${index + 1}`}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeSubPermission(index)}
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
          >
            Remove
          </button>
        </div>
      ))}
      {subPermissions.length === 0 && (
        <p className="text-xs text-slate-500">
          No sub-permissions added. Click "Add Sub-Permission" to create one.
        </p>
      )}
    </div>
  );
};

export default function PermissionsPage() {
  const { role } = useDashboard();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isAddSubPermOpen, setAddSubPermOpen] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [permissionPendingDelete, setPermissionPendingDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [subPermParent, setSubPermParent] = useState(null);
  const [subPermPath, setSubPermPath] = useState([]);

  // Form states for create
  const [createForm, setCreateForm] = useState({
    name: "",
    sub_permissions: [],
  });

  // Form states for edit
  const [editForm, setEditForm] = useState({
    name: "",
    sub_permissions: [],
  });

  // Form state for adding sub-permission
  const [subPermForm, setSubPermForm] = useState({
    name: "",
  });

  useEffect(() => {
    if (role !== "Admin" || !isAuthenticated) {
      return;
    }

    let isMounted = true;

    const loadPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllPermissions();
        if (isMounted) {
          // Handle both direct array and nested response
          const permissionsArray = Array.isArray(data)
            ? data
            : data?.data ?? data?.permissions ?? [];
          setPermissionsData(permissionsArray);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load permissions");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [role, isAuthenticated]);

  // Update edit form when selectedPermission changes
  useEffect(() => {
    if (selectedPermission) {
      setEditForm({
        name: selectedPermission.name,
        sub_permissions: selectedPermission.sub_permissions || [],
      });
    }
  }, [selectedPermission]);

  const handleDeletePermission = async (permissionId) => {
    try {
      setIsDeletingId(permissionId);
      await deletePermissionApi(permissionId);
      setPermissionsData((prev) =>
        prev.filter((p) => (p.id || p._id) !== permissionId)
      );
    } catch (err) {
      setError(err.message || "Failed to delete permission");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!permissionPendingDelete) return;
    const permissionId = permissionPendingDelete.id || permissionPendingDelete._id;
    await handleDeletePermission(permissionId);
    setPermissionPendingDelete(null);
  };

  const handleCreatePermission = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate
      if (!createForm.name.trim()) {
        setError("Permission name is required");
        return;
      }

      // Prepare data for API
      const permissionData = {
        name: createForm.name.trim(),
        sub_permissions: createForm.sub_permissions
          .filter((sp) => sp.name.trim())
          .map((sp) => ({ name: sp.name.trim(), sub_permissions: null })),
      };

      const result = await createPermission(permissionData);
      const newPermission = result.data || result.permission || result;

      setPermissionsData((prev) => [...prev, newPermission]);
      setCreateOpen(false);

      // Reset form
      setCreateForm({
        name: "",
        sub_permissions: [],
      });
    } catch (err) {
      setError(err.message || "Failed to create permission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePermission = async () => {
    if (!selectedPermission) return;

    try {
      setIsSaving(true);
      setError(null);

      const permissionId = selectedPermission.id || selectedPermission._id;

      // Prepare data for API
      const permissionData = {
        name: editForm.name.trim(),
        sub_permissions: editForm.sub_permissions,
      };

      const result = await updatePermission(permissionId, permissionData);
      const updatedPermission = result.data || result.permission || result;

      setPermissionsData((prev) =>
        prev.map((p) =>
          (p.id || p._id) === permissionId ? { ...p, ...updatedPermission } : p
        )
      );
      setSelectedPermission(null);
    } catch (err) {
      setError(err.message || "Failed to update permission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubPermission = async () => {
    if (!subPermParent) return;

    try {
      setIsSaving(true);
      setError(null);

      if (!subPermForm.name.trim()) {
        setError("Sub-permission name is required");
        return;
      }

      const permissionId = subPermParent.id || subPermParent._id;

      const result = await addSubPermission(permissionId, {
        path: subPermPath,
        sub_permission: {
          name: subPermForm.name.trim(),
          sub_permissions: null,
        },
      });

      const updatedPermission = result.data || result.permission || result;

      setPermissionsData((prev) =>
        prev.map((p) =>
          (p.id || p._id) === permissionId ? { ...p, ...updatedPermission } : p
        )
      );

      setAddSubPermOpen(false);
      setSubPermForm({ name: "" });
      setSubPermParent(null);
      setSubPermPath([]);
    } catch (err) {
      setError(err.message || "Failed to add sub-permission");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  if (role !== "Admin") {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        This module is limited to Admins. Switch to Admin via the top bar to
        manage permissions.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading permissions…
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
            Permissions Management
          </h1>
          <p className="text-sm text-slate-500">
            Create and manage hierarchical permissions with nested
            sub-permissions.
          </p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => setCreateOpen(true)}
        >
          Create permission
        </button>
      </div>

      <div className="space-y-4">
        {permissionsData.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No permissions found. Create your first permission to get started.
          </div>
        ) : (
          permissionsData.map((permission) => (
            <PermissionNode
              key={permission._id}
              permission={permission}
              onEdit={setSelectedPermission}
              onDelete={setPermissionPendingDelete}
              onAddSubPermission={(perm, path) => {
                setSubPermParent(perm);
                setSubPermPath(path);
                setAddSubPermOpen(true);
              }}
              isDeletingId={isDeletingId}
            />
          ))
        )}
      </div>

      {/* Edit Permission Modal */}
      <Modal
        title="Edit permission"
        description="Update the permission name and its structure. Note: This replaces the entire sub-permissions array."
        isOpen={Boolean(selectedPermission)}
        onClose={() => setSelectedPermission(null)}
        primaryActionLabel={isSaving ? "Saving..." : "Save changes"}
        primaryAction={handleUpdatePermission}
      >
        <div className="space-y-4">
          <FormField
            label="Permission Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Enter permission name"
          />
          <SubPermissionBuilder
            subPermissions={editForm.sub_permissions}
            onChange={(subs) =>
              setEditForm({ ...editForm, sub_permissions: subs })
            }
          />
          <p className="text-xs text-amber-600">
            Warning: Editing sub-permissions here replaces the entire structure.
            For incremental additions, use the "+ Sub" button on the permission
            node.
          </p>
        </div>
      </Modal>

      {/* Create Permission Modal */}
      <Modal
        title="Create permission"
        description="Define a new permission with optional sub-permissions. You can add more sub-permissions later."
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        primaryActionLabel={isSaving ? "Creating..." : "Create permission"}
        primaryAction={handleCreatePermission}
      >
        <div className="flex flex-col gap-4">
          <FormField
            label="Permission Name"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            placeholder="e.g., settings, reports, users"
          />
          <SubPermissionBuilder
            subPermissions={createForm.sub_permissions}
            onChange={(subs) =>
              setCreateForm({ ...createForm, sub_permissions: subs })
            }
          />
        </div>
      </Modal>

      {/* Add Sub-Permission Modal */}
      <Modal
        title="Add sub-permission"
        description={`Add a new sub-permission to "${subPermParent?.name}"`}
        isOpen={isAddSubPermOpen}
        onClose={() => {
          setAddSubPermOpen(false);
          setSubPermForm({ name: "" });
        }}
        primaryActionLabel={isSaving ? "Adding..." : "Add sub-permission"}
        primaryAction={handleAddSubPermission}
      >
        <div className="space-y-4">
          <FormField
            label="Sub-Permission Name"
            value={subPermForm.name}
            onChange={(e) => setSubPermForm({ name: e.target.value })}
            placeholder="e.g., add, edit, delete, view"
          />
          <p className="text-xs text-slate-500">
            This will be added to the "{subPermParent?.name}" permission at path:{" "}
            {subPermPath.length === 0
              ? "root level"
              : `[${subPermPath.join(", ")}]`}
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete permission"
        description={`Are you sure you want to delete the "${permissionPendingDelete?.name}" permission?`}
        isOpen={Boolean(permissionPendingDelete)}
        onClose={() => setPermissionPendingDelete(null)}
        primaryActionLabel="Delete"
        primaryAction={handleConfirmDelete}
      >
        <p className="text-sm text-slate-500">
          This action cannot be undone. This will delete the permission and all
          its sub-permissions. Roles using this permission may be affected.
        </p>
      </Modal>
    </div>
  );
}

