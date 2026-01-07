"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import PhoneInput from "@/components/common/PhoneInput";
import PageLoader from "@/components/common/PageLoader";
import { useDashboard } from "@/components/layout/DashboardShell";
import {
  getAllUsers,
  deleteUser as deleteUserApi,
  getAllRoles,
  createUser,
  updateUser,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const formatPermissions = (permissions) =>
  (permissions ?? [])
    .map((permission) =>
      typeof permission === "string" ? permission : permission?.name ?? ""
    )
    .filter(Boolean);

export default function UsersPage() {
  const router = useRouter();
  useDashboard(); // Ensure we're in dashboard context
  const {
    isAuthenticated,
    isLoading: authLoading,
    isSuperAdmin,
    isHost,
    user,
  } = useAuth();

  // SEO
  useSEO({
    title: "Users | Zuha Host",
    description:
      "User management dashboard. Manage team members, permissions, and roles.",
    keywords: "users, user management, team members, staff management",
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [usersData, setUsersData] = useState([]);
  const [rolesData, setRolesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [userPendingDelete, setUserPendingDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Default to table on desktop, cards on mobile
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? "table" : "cards";
    }
    return "table";
  });

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    // Allow access for superadmin and host
    if (!isAuthenticated || !(isSuperAdmin || isHost)) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const toastId = toast.loading("Loading users and roles...");

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
          toast.success("Users and roles loaded successfully!", {
            id: toastId,
          });
        }
      } catch (err) {
        const errorMessage = err.message || "Failed to load data";
        if (isMounted) {
          setError(errorMessage);
        }
        toast.error(errorMessage);
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
  }, [isAuthenticated, isSuperAdmin, isHost]);

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
      const toastId = toast.loading("Creating user...");

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

      toast.success("User created successfully!", { id: toastId });
    } catch (err) {
      const errorMessage = err.message || "Failed to create user";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      setError(null);
      const toastId = toast.loading("Updating user...");

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

      toast.success("User updated successfully!", { id: toastId });
    } catch (err) {
      const errorMessage = err.message || "Failed to update user";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setIsDeletingId(userId);
      const toastId = toast.loading("Deleting user...");
      await deleteUserApi(userId);
      setUsersData((prev) =>
        prev.filter((user) => (user.id || user._id) !== userId)
      );
      toast.success("User deleted successfully!", { id: toastId });
    } catch (err) {
      const errorMessage = err.message || "Failed to delete user";
      setError(errorMessage);
      toast.error(errorMessage);
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
    return <PageLoader message="Checking your access..." />;
  }

  // Check access - allow superadmin or host
  if (!isSuperAdmin && !isHost) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        Access denied. Only hosts and administrators can manage users.
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader message="Loading users..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg
              className="w-6 h-6 text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="mt-2 text-2xl lg:text-3xl font-semibold text-slate-900">
            {isSuperAdmin ? "User Management" : "Staff Management"}
          </h1>
        </div>

        <div className="flex gap-2">
          {/* View Mode Switcher - Hidden on mobile */}
          <div className="hidden md:flex rounded-full border border-slate-200 p-1">
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("cards")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("table")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>

          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
          >
            <span className="hidden sm:inline">Add new </span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Card View (Mobile) */}
      {viewMode === "cards" && (
        <>
          {usersData.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No users yet
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Get started by creating your first user
              </p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => {
                  setError(null);
                  setCreateOpen(true);
                }}
              >
                Create user
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {usersData.map((user) => {
                const userId = user.id || user._id;
                const roleName =
                  typeof user.role === "object" ? user.role?.name : user.role;

                return (
                  <div
                    key={userId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Avatar */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        {/* Name & Email */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {user.name}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Actions Dropdown */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() =>
                            setOpenDropdownId(
                              openDropdownId === userId ? null : userId
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        >
                          <svg
                            className="w-5 h-5 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownId === userId && (
                          <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                            <button
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                              onClick={() => {
                                setError(null);
                                setSelectedUser(user);
                                setOpenDropdownId(null);
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-100 disabled:opacity-50"
                              disabled={isDeletingId === userId}
                              onClick={() => {
                                setUserPendingDelete(user);
                                setOpenDropdownId(null);
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              {isDeletingId === userId
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role, Phone & Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Role</span>
                        {user.host ? (
                          <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold capitalize text-green-700 w-fit">
                            Host
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold capitalize text-blue-700 w-fit">
                            {roleName || "—"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {user.phone && (
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">
                              Phone
                            </span>
                            <span className="text-sm text-slate-900">
                              {user.phone}
                            </span>
                          </div>
                        )}
                        <StatusPill label={user.status || "Active"} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Table View (Desktop) */}
      {viewMode === "table" && (
        <>
          {usersData.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No users yet
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Get started by creating your first user
              </p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => {
                  setError(null);
                  setCreateOpen(true);
                }}
              >
                Create user
              </button>
            </div>
          ) : (
            <DataTable
              headers={["Name", "Email", "Role", "Status", ""]}
              rows={rows}
            />
          )}
        </>
      )}

      <Modal
        title="Edit staff detail"
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
        <div className="flex flex-col gap-3">
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
          <div className="space-y-1 text-sm text-slate-600">
            <label className="block text-sm font-medium text-slate-700">
              Phone (optional)
            </label>
            <PhoneInput
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </div>
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
        title="Add staff member"
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
        <div className="flex flex-col gap-3">
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
          <div className="space-y-1 text-sm text-slate-600">
            <label className="block text-sm font-medium text-slate-700">
              Phone (optional)
            </label>
            <PhoneInput
              value={createForm.phone}
              onChange={(e) =>
                setCreateForm({ ...createForm, phone: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <span className="font-semibold text-sm">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="Enter password (min 6 characters)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
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
