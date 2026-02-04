"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageLoader from "@/components/common/PageLoader";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import StatusPill from "@/components/common/StatusPill";
import DataTable from "@/components/common/DataTable";
import { useMerchants } from "@/hooks/useMerchants";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { API_BASE_URL } from "@/lib/api";

const PAGE_SIZE = 10;

export default function MerchantsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const {
    merchants,
    count,
    isLoading,
    error,
    loadMerchants,
    create,
    update,
    remove,
  } = useMerchants();

  // SEO
  useSEO({
    title: "Merchants | Zuha Host",
    description: "Manage your merchants. Create, edit, and switch between multiple merchant accounts.",
    keywords: "merchants, merchant management, multi-tenant, accounts",
  });

  const [page, setPage] = useState(0);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? "table" : "cards";
    }
    return "table";
  });
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    status: "active",
    website: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    settings: {
      timezone: "UTC",
      currency: "USD",
      language: "en",
    },
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "active",
    website: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    settings: {
      timezone: "UTC",
      currency: "USD",
      language: "en",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMerchants();
  }, [isAuthenticated]);

  // Reload when filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadMerchants(filters);
    }
  }, [filters]);

  const filtered = useMemo(() => {
    return merchants;
  }, [merchants]);

  // Handle window resize to update view mode on screen size change
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      // Only auto-switch if user hasn't manually changed view
      if (isMobile && viewMode === "table") {
        setViewMode("cards");
      } else if (!isMobile && viewMode === "cards" && filtered.length > 0) {
        // Only switch to table on desktop if there are items
        setViewMode("table");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode, filtered.length]);

  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Reset page if current page is beyond available pages
  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    } else if (totalPages === 0 && page > 0) {
      setPage(0);
    }
  }, [totalPages, page]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      search: "",
    });
    setPage(0);
  };

  const openCreateModal = () => {
    setCreateForm({
      name: "",
      description: "",
      status: "active",
      website: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      settings: {
        timezone: "UTC",
        currency: "USD",
        language: "en",
      },
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (merchant) => {
    setSelectedMerchant(merchant);
    setEditForm({
      name: merchant.name || "",
      description: merchant.description || "",
      status: merchant.status || "active",
      website: merchant.website || "",
      email: merchant.email || "",
      phone: merchant.phone || "",
      address: {
        street: merchant.address?.street || "",
        city: merchant.address?.city || "",
        state: merchant.address?.state || "",
        zipCode: merchant.address?.zipCode || "",
        country: merchant.address?.country || "",
      },
      settings: {
        timezone: merchant.settings?.timezone || "UTC",
        currency: merchant.settings?.currency || "USD",
        language: merchant.settings?.language || "en",
      },
    });
    setIsEditOpen(true);
  };

  const openViewModal = (merchant) => {
    setSelectedMerchant(merchant);
    setIsViewOpen(true);
  };

  const handleCreate = async (e) => {
    e?.preventDefault();

    // Validate required fields
    if (!createForm.name || createForm.name.trim().length < 2) {
      toast.error("Merchant name is required and must be at least 2 characters long");
      return;
    }

    try {
      await create(createForm);
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        description: "",
        status: "active",
        website: "",
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        settings: {
          timezone: "UTC",
          currency: "USD",
          language: "en",
        },
      });
      loadMerchants(filters);
      toast.success("Merchant created successfully!");
    } catch (err) {
      console.error("Error creating merchant:", err);
      toast.error(err.message || "Failed to create merchant");
    }
  };

  const handleUpdate = async (e) => {
    e?.preventDefault();
    if (!selectedMerchant) return;

    // Validate required fields
    if (!editForm.name || editForm.name.trim().length < 2) {
      toast.error("Merchant name is required and must be at least 2 characters long");
      return;
    }

    try {
      const merchantId = selectedMerchant.id || selectedMerchant._id;
      await update(merchantId, editForm);
      setIsEditOpen(false);
      setSelectedMerchant(null);
      loadMerchants(filters);
      toast.success("Merchant updated successfully!");
    } catch (err) {
      console.error("Error updating merchant:", err);
      toast.error(err.message || "Failed to update merchant");
    }
  };

  const handleDelete = async (merchantId) => {
    if (!confirm("Are you sure you want to delete this merchant? This action cannot be undone.")) {
      return;
    }

    try {
      await remove(merchantId);
      loadMerchants(filters);
      toast.success("Merchant deleted successfully!");
    } catch (err) {
      console.error("Error deleting merchant:", err);
      toast.error(err.message || "Failed to delete merchant");
    }
  };

  const handleFormChange = (field, value, formType = "create") => {
    if (formType === "create") {
      setCreateForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setEditForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleNestedFormChange = (parentField, childField, value, formType = "create") => {
    if (formType === "create") {
      setCreateForm((prev) => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: value,
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: value,
        },
      }));
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
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
              Merchants Management
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {Object.values(filters).some((val) => val !== "") && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-slate-900 rounded-full">
                  {Object.values(filters).filter((val) => val !== "").length}
                </span>
              )}
            </button>

            <div className="flex rounded-full border border-slate-200 p-1">
              {/* Cards View */}
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "cards"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
                onClick={() => setViewMode("cards")}
                title="Cards View"
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
              {/* Table View */}
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
                onClick={() => setViewMode("table")}
                title="Table View"
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
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 flex items-center gap-2 transition-colors"
              onClick={openCreateModal}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Merchant
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
              <button
                className="text-sm text-slate-600 hover:text-slate-900 underline"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <Select
                label="Status"
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                placeholder="All Status"
                options={[
                  { value: "", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filtered.length}
                </span>{" "}
                of {count} merchants
              </p>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex gap-2 text-sm">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Prev
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </p>
          </div>
        )}
      </div>

      {/* Merchants List */}
      {isLoading && merchants.length === 0 ? (
        <PageLoader message="Loading merchants..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-12 lg:p-16 text-center shadow-sm">
          <div className="text-4xl lg:text-6xl mb-4">🏪</div>
          <h2 className="mt-4 lg:mt-6 text-xl lg:text-2xl font-semibold text-slate-900">
            No merchants found
          </h2>
          <p className="mt-2 text-sm lg:text-base text-slate-600">
            {filters.search || filters.status
              ? "Try adjusting your filters"
              : "Create your first merchant to get started"}
          </p>
          {!filters.search && !filters.status && (
            <button
              onClick={openCreateModal}
              className="mt-4 lg:mt-6 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white hover:bg-rose-700"
            >
              Create Merchant
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((merchant) => {
            const merchantId = merchant.id || merchant._id;
            return (
              <div
                key={merchantId}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {merchant.name}
                    </h3>
                    <StatusPill label={merchant.status || "active"} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openViewModal(merchant)}
                      className="text-slate-600 hover:text-slate-900"
                      title="View"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEditModal(merchant)}
                      className="text-slate-600 hover:text-slate-900"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>
                    <button
                      onClick={() => handleDelete(merchantId)}
                      className="text-rose-600 hover:text-rose-700"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>
                  </div>
                </div>

                {merchant.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {merchant.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-slate-500">
                  {merchant.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{merchant.email}</span>
                    </div>
                  )}
                  {merchant.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{merchant.phone}</span>
                    </div>
                  )}
                  {merchant.address?.city && merchant.address?.country && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {merchant.address.city}
                        {merchant.address.country && `, ${merchant.address.country}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Created {new Date(merchant.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <section>
          <DataTable
            headers={[
              "S.No",
              "Merchant Name",
              "Owner",
              "Status",
              "Email",
              "Phone",
              "Location",
              "Created At",
              "Actions",
            ]}
            rows={paginated.map((merchant, index) => {
              const merchantId = merchant.id || merchant._id;
              const ownerName = merchant.ownerId?.name || "N/A";
              const location = merchant.address?.city && merchant.address?.country
                ? `${merchant.address.city}, ${merchant.address.country}`
                : merchant.address?.city || merchant.address?.country || "N/A";

              return {
                id: merchantId,
                cells: [
                  page * PAGE_SIZE + index + 1,
                  <span key="name" className="font-semibold text-slate-900">
                    {merchant.name}
                  </span>,
                  ownerName,
                  <StatusPill
                    key="status"
                    label={merchant.status || "active"}
                  />,
                  merchant.email || "N/A",
                  merchant.phone || "N/A",
                  location,
                  new Date(merchant.createdAt).toLocaleDateString(),
                  <div key="actions" className="flex gap-2">
                    <button
                      className="text-slate-900 underline-offset-2 hover:underline text-sm"
                      onClick={() => openViewModal(merchant)}
                    >
                      View
                    </button>
                    <button
                      className="text-slate-900 underline-offset-2 hover:underline text-sm"
                      onClick={() => openEditModal(merchant)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-rose-600 underline-offset-2 hover:underline text-sm"
                      onClick={() => handleDelete(merchantId)}
                    >
                      Delete
                    </button>
                  </div>,
                ],
              };
            })}
            emptyLabel="No merchants found"
          />
        </section>
      )}

      {/* Create Merchant Modal */}
      <Modal
        title="Create Merchant"
        description="Create a new merchant account to manage your business."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        primaryActionLabel="Create Merchant"
        onPrimaryAction={() => {
          document.getElementById("create-merchant-form")?.requestSubmit();
        }}
        disabled={isLoading}
        size="large"
      >
        <form id="create-merchant-form" onSubmit={handleCreate} className="space-y-4">
          <FormField
            label="Merchant Name *"
            value={createForm.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            placeholder="e.g. My Store"
            required
          />

          <FormField
            label="Description"
            as="textarea"
            rows={3}
            value={createForm.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            placeholder="Describe your merchant..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={createForm.status}
              onChange={(value) => handleFormChange("status", value)}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "suspended", label: "Suspended" },
              ]}
            />

            <FormField
              label="Website"
              type="url"
              value={createForm.website}
              onChange={(e) => handleFormChange("website", e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              placeholder="merchant@example.com"
            />

            <FormField
              label="Phone"
              type="tel"
              value={createForm.phone}
              onChange={(e) => handleFormChange("phone", e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Address</h4>
            <div className="space-y-3">
              <FormField
                label="Street"
                value={createForm.address.street}
                onChange={(e) => handleNestedFormChange("address", "street", e.target.value)}
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="City"
                  value={createForm.address.city}
                  onChange={(e) => handleNestedFormChange("address", "city", e.target.value)}
                  placeholder="New York"
                />
                <FormField
                  label="State"
                  value={createForm.address.state}
                  onChange={(e) => handleNestedFormChange("address", "state", e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Zip Code"
                  value={createForm.address.zipCode}
                  onChange={(e) => handleNestedFormChange("address", "zipCode", e.target.value)}
                  placeholder="10001"
                />
                <FormField
                  label="Country"
                  value={createForm.address.country}
                  onChange={(e) => handleNestedFormChange("address", "country", e.target.value)}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Settings</h4>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Timezone"
                value={createForm.settings.timezone}
                onChange={(e) => handleNestedFormChange("settings", "timezone", e.target.value)}
                placeholder="UTC"
              />
              <FormField
                label="Currency"
                value={createForm.settings.currency}
                onChange={(e) => handleNestedFormChange("settings", "currency", e.target.value)}
                placeholder="USD"
              />
              <FormField
                label="Language"
                value={createForm.settings.language}
                onChange={(e) => handleNestedFormChange("settings", "language", e.target.value)}
                placeholder="en"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Merchant Modal */}
      <Modal
        title="Edit Merchant"
        description="Update merchant details."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedMerchant(null);
        }}
        primaryActionLabel="Update Merchant"
        onPrimaryAction={() => {
          document.getElementById("edit-merchant-form")?.requestSubmit();
        }}
        disabled={isLoading}
        size="large"
      >
        <form id="edit-merchant-form" onSubmit={handleUpdate} className="space-y-4">
          <FormField
            label="Merchant Name *"
            value={editForm.name}
            onChange={(e) => handleFormChange("name", e.target.value, "edit")}
            placeholder="e.g. My Store"
            required
          />

          <FormField
            label="Description"
            as="textarea"
            rows={3}
            value={editForm.description}
            onChange={(e) => handleFormChange("description", e.target.value, "edit")}
            placeholder="Describe your merchant..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={editForm.status}
              onChange={(value) => handleFormChange("status", value, "edit")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "suspended", label: "Suspended" },
              ]}
            />

            <FormField
              label="Website"
              type="url"
              value={editForm.website}
              onChange={(e) => handleFormChange("website", e.target.value, "edit")}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => handleFormChange("email", e.target.value, "edit")}
              placeholder="merchant@example.com"
            />

            <FormField
              label="Phone"
              type="tel"
              value={editForm.phone}
              onChange={(e) => handleFormChange("phone", e.target.value, "edit")}
              placeholder="+1234567890"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Address</h4>
            <div className="space-y-3">
              <FormField
                label="Street"
                value={editForm.address.street}
                onChange={(e) => handleNestedFormChange("address", "street", e.target.value, "edit")}
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="City"
                  value={editForm.address.city}
                  onChange={(e) => handleNestedFormChange("address", "city", e.target.value, "edit")}
                  placeholder="New York"
                />
                <FormField
                  label="State"
                  value={editForm.address.state}
                  onChange={(e) => handleNestedFormChange("address", "state", e.target.value, "edit")}
                  placeholder="NY"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Zip Code"
                  value={editForm.address.zipCode}
                  onChange={(e) => handleNestedFormChange("address", "zipCode", e.target.value, "edit")}
                  placeholder="10001"
                />
                <FormField
                  label="Country"
                  value={editForm.address.country}
                  onChange={(e) => handleNestedFormChange("address", "country", e.target.value, "edit")}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Settings</h4>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Timezone"
                value={editForm.settings.timezone}
                onChange={(e) => handleNestedFormChange("settings", "timezone", e.target.value, "edit")}
                placeholder="UTC"
              />
              <FormField
                label="Currency"
                value={editForm.settings.currency}
                onChange={(e) => handleNestedFormChange("settings", "currency", e.target.value, "edit")}
                placeholder="USD"
              />
              <FormField
                label="Language"
                value={editForm.settings.language}
                onChange={(e) => handleNestedFormChange("settings", "language", e.target.value, "edit")}
                placeholder="en"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Merchant Modal */}
      <Modal
        title="Merchant Details"
        description="View complete merchant information."
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedMerchant(null);
        }}
        size="large"
      >
        {selectedMerchant && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <div className="text-sm text-slate-900 font-semibold">{selectedMerchant.name}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <StatusPill label={selectedMerchant.status || "active"} />
              </div>
              {selectedMerchant.description && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                    {selectedMerchant.description}
                  </div>
                </div>
              )}
              {selectedMerchant.email && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <div className="text-sm text-slate-900">{selectedMerchant.email}</div>
                </div>
              )}
              {selectedMerchant.phone && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <div className="text-sm text-slate-900">{selectedMerchant.phone}</div>
                </div>
              )}
              {selectedMerchant.website && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
                  <a
                    href={selectedMerchant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedMerchant.website}
                  </a>
                </div>
              )}
              {selectedMerchant.ownerId && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Owner</label>
                  <div className="text-sm text-slate-900">
                    {selectedMerchant.ownerId?.name || "N/A"}
                  </div>
                </div>
              )}
            </div>

            {selectedMerchant.address && Object.values(selectedMerchant.address).some((v) => v) && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Address</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  {selectedMerchant.address.street && <div>{selectedMerchant.address.street}</div>}
                  <div>
                    {[
                      selectedMerchant.address.city,
                      selectedMerchant.address.state,
                      selectedMerchant.address.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  {selectedMerchant.address.country && <div>{selectedMerchant.address.country}</div>}
                </div>
              </div>
            )}

            {selectedMerchant.settings && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Settings</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Timezone</label>
                    <div className="text-slate-900">{selectedMerchant.settings.timezone || "UTC"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                    <div className="text-slate-900">{selectedMerchant.settings.currency || "USD"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                    <div className="text-slate-900">{selectedMerchant.settings.language || "en"}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Created At</label>
                <div className="text-slate-500">
                  {new Date(selectedMerchant.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Updated At</label>
                <div className="text-slate-500">
                  {new Date(selectedMerchant.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

