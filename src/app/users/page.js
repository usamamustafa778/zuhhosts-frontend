"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import { useDashboard } from "@/components/layout/DashboardShell";
import {
  getAllUsers,
  deleteUser as deleteUserApi,
  getAllRoles,
  createUser,
  updateUser,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const formatPermissions = (permissions) =>
  (permissions ?? [])
    .map((permission) =>
      typeof permission === "string" ? permission : permission?.name ?? ""
    )
    .filter(Boolean);

export default function UsersPage() {
  const { role } = useDashboard();
  const {
    isAuthenticated,
    isLoading: authLoading,
    isSuperAdmin,
    isHost,
  } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [usersData, setUsersData] = useState([]);
  const [rolesData, setRolesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [userPendingDelete, setUserPendingDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for create
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    host: false,
  });

  // Form states for edit
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    host: false,
  });

  useEffect(() => {
    // Allow access for superadmin, host, and Admin role
    if (!isAuthenticated || !(isSuperAdmin || isHost || role === "Admin")) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch users and roles in parallel
        const [usersResponse, rolesResponse] = await Promise.all([
          getAllUsers(),
          getAllRoles(),
        ]);

        if (isMounted) {
          setUsersData(Array.isArray(usersResponse) ? usersResponse : []);
          // Handle both direct array and nested response
          const rolesArray = Array.isArray(rolesResponse)
            ? rolesResponse
            : rolesResponse?.roles ?? [];
          setRolesData(rolesArray);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [role, isAuthenticated, isSuperAdmin, isHost]);

  // Initialize create form role when roles are loaded
  useEffect(() => {
    if (rolesData.length > 0 && !createForm.role) {
      setCreateForm((prev) => ({
        ...prev,
        role: rolesData[0].name,
      }));
    }
  }, [rolesData]);

  // Update edit form when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      const roleName =
        typeof selectedUser.role === "object"
          ? selectedUser.role?.name
          : selectedUser.role;

      setEditForm({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        role: roleName || "",
        host: selectedUser.host || false,
      });
    }
  }, [selectedUser]);

  const handleCreateUser = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Find role ID from role name
      const selectedRole = rolesData.find(
        (r) => r.name.toLowerCase() === createForm.role.toLowerCase()
      );

      // Prepare data for API
      const userData = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        ...(createForm.phone && { phone: createForm.phone }),
        ...(selectedRole && { role: selectedRole._id || selectedRole.id }),
        ...(isSuperAdmin && { host: createForm.host }), // Only superadmin can create hosts
      };

      const result = await createUser(userData);

      setUsersData((prev) => [...prev, result]);
      setCreateOpen(false);

      // Reset form
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
        host: false,
      });
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      setError(null);

      const userId = selectedUser.id || selectedUser._id;

      // Find role ID from role name
      const selectedRole = rolesData.find(
        (r) => r.name.toLowerCase() === editForm.role.toLowerCase()
      );

      // Prepare data for API
      const userData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        role: selectedRole ? selectedRole._id || selectedRole.id : null,
        ...(isSuperAdmin && { host: editForm.host }), // Only superadmin can modify host status
      };

      const result = await updateUser(userId, userData);

      setUsersData((prev) =>
        prev.map((u) => ((u.id || u._id) === userId ? { ...u, ...result } : u))
      );
      setSelectedUser(null);
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setIsDeletingId(userId);
      await deleteUserApi(userId);
      setUsersData((prev) =>
        prev.filter((user) => (user.id || user._id) !== userId)
      );
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userPendingDelete) return;
    const userId = userPendingDelete.id || userPendingDelete._id;
    await handleDeleteUser(userId);
    setUserPendingDelete(null);
  };

  const rows = usersData.map((user, index) => {
    const userId = user.id || user._id || `user-${index}`;
    const roleName =
      typeof user.role === "object" ? user.role?.name : user.role;

    return {
      id: userId,
      cells: [
        user.name,
        user.email,
        <div key={`role-${userId}`} className="flex flex-col gap-1">
          {user.host ? (
            <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold capitalize text-green-700 w-fit">
              Host
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold capitalize text-blue-700 w-fit">
              {roleName || "—"}
            </span>
          )}
        </div>,
        <StatusPill key={`status-${userId}`} label={user.status || "Active"} />,
        <div className="flex items-center gap-3" key={`actions-${userId}`}>
          <button
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            onClick={() => {
              setError(null);
              setSelectedUser(user);
            }}
          >
            Edit
          </button>
          <button
            className="text-sm text-rose-500 underline-offset-2 hover:text-rose-700 hover:underline disabled:opacity-50"
            disabled={isDeletingId === userId}
            onClick={() => setUserPendingDelete(user)}
          >
            {isDeletingId === userId ? "Deleting..." : "Delete"}
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

  // Check access - allow superadmin, host, or Admin role
  if (!isSuperAdmin && !isHost && role !== "Admin") {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        Access denied. Only hosts and administrators can manage users.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading users…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {isSuperAdmin
            ? "User Management"
            : isHost
            ? "Team Management"
            : "User Management"}
        </h1>

        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
        >
          Create user
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        headers={["Name", "Email", "Role", "Status", ""]}
        rows={rows}
      />

      <Modal
        title="Edit user"
        description="Adjust level of access instantly."
        isOpen={Boolean(selectedUser)}
        onClose={() => {
          setError(null);
          setSelectedUser(null);
        }}
        primaryActionLabel={isSaving ? "Saving..." : "Save changes"}
        primaryAction={handleUpdateUser}
      >
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <FormField
            label="Full name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Enter full name"
          />
          <FormField
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
            placeholder="Enter email"
          />
          <FormField
            label="Phone (optional)"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
            placeholder="Enter phone number"
          />
          <FormField
            label="Role"
            as="select"
            value={
              editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1)
            }
            onChange={(e) =>
              setEditForm({ ...editForm, role: e.target.value.toLowerCase() })
            }
            options={rolesData.map(
              (r) => r.name.charAt(0).toUpperCase() + r.name.slice(1)
            )}
          />
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-host-checkbox"
                checked={editForm.host}
                onChange={(e) =>
                  setEditForm({ ...editForm, host: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor="edit-host-checkbox"
                className="text-sm font-medium text-slate-700"
              >
                Host (Can manage properties and team members)
              </label>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Create user"
        description="Create a new user with role."
        isOpen={isCreateOpen}
        onClose={() => {
          setError(null);
          setCreateOpen(false);
        }}
        primaryActionLabel={isSaving ? "Creating..." : "Create user"}
        primaryAction={handleCreateUser}
      >
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <FormField
            label="Full name"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            placeholder="Enter full name"
          />
          <FormField
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm({ ...createForm, email: e.target.value })
            }
            placeholder="Enter email"
          />
          <FormField
            label="Phone (optional)"
            value={createForm.phone}
            onChange={(e) =>
              setCreateForm({ ...createForm, phone: e.target.value })
            }
            placeholder="Enter phone number"
          />
          <FormField
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) =>
              setCreateForm({ ...createForm, password: e.target.value })
            }
            placeholder="Enter password (min 6 characters)"
          />
          <FormField
            label="Role"
            as="select"
            value={
              createForm.role
                ? createForm.role.charAt(0).toUpperCase() +
                  createForm.role.slice(1)
                : rolesData.length > 0
                ? rolesData[0].name.charAt(0).toUpperCase() +
                  rolesData[0].name.slice(1)
                : ""
            }
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                role: e.target.value.toLowerCase(),
              })
            }
            options={rolesData.map(
              (r) => r.name.charAt(0).toUpperCase() + r.name.slice(1)
            )}
          />
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-host-checkbox"
                checked={createForm.host}
                onChange={(e) =>
                  setCreateForm({ ...createForm, host: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor="create-host-checkbox"
                className="text-sm font-medium text-slate-700"
              >
                Host (Can manage properties and team members)
              </label>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Delete user"
        description={`Are you sure you want to delete ${
          userPendingDelete?.name || "this user"
        }?`}
        isOpen={Boolean(userPendingDelete)}
        onClose={() => setUserPendingDelete(null)}
        primaryActionLabel="Delete"
        primaryAction={handleConfirmDelete}
      >
        <p className="text-sm text-slate-500">
          This action cannot be undone. The user will lose access immediately.
        </p>
      </Modal>
    </div>
  );
}
