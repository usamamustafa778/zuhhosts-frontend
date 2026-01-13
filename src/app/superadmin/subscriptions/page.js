"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";
import SubscriptionStats from "@/components/modules/SubscriptionStats";
import SubscriptionFilters from "@/components/modules/SubscriptionFilters";
import SubscriptionTable from "@/components/modules/SubscriptionTable";
import {
  ViewSubscriptionModal,
  EditSubscriptionModal,
  ApproveSubscriptionModal,
  RejectSubscriptionModal,
} from "@/components/modules/SubscriptionModals";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

const PAGE_SIZE = 10;

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSuperAdmin } = useRequireAuth();
  const {
    statistics,
    subscriptions,
    count,
    isLoading,
    error,
    loadStatistics,
    loadSubscriptions,
    update,
    remove,
    approve,
    reject,
  } = useSubscriptions();

  // SEO
  useSEO({
    title: "Subscriptions | Superadmin | Zuha Host",
    description: "Manage all host subscriptions. View, approve, reject, and update subscription details.",
    keywords: "subscriptions, subscription management, superadmin, host subscriptions",
  });

  const [page, setPage] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    package: "",
    paymentStatus: "",
  });

  // Form states
  const [editForm, setEditForm] = useState({
    package: "",
    price: "",
    notes: "",
  });

  const [approveForm, setApproveForm] = useState({
    notes: "",
  });

  const [rejectForm, setRejectForm] = useState({
    rejectionReason: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isSuperAdmin) {
      router.push("/dashboard");
      return;
    }
    loadStatistics();
    loadSubscriptions();
  }, [isAuthenticated, isSuperAdmin, router]);

  // Reload when filters change
  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      loadSubscriptions(filters);
    }
  }, [filters]);

  const filtered = useMemo(() => {
    return subscriptions;
  }, [subscriptions]);

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
      package: "",
      paymentStatus: "",
    });
    setPage(0);
  };

  const openEditModal = (subscription) => {
    setSelectedSubscription(subscription);
    setEditForm({
      package: subscription.package || "",
      price: subscription.price || "",
      notes: subscription.notes || "",
    });
    setIsEditOpen(true);
  };

  const openApproveModal = (subscription) => {
    setSelectedSubscription(subscription);
    setApproveForm({ notes: "" });
    setIsApproveOpen(true);
  };

  const openRejectModal = (subscription) => {
    setSelectedSubscription(subscription);
    setRejectForm({ rejectionReason: "" });
    setIsRejectOpen(true);
  };

  const openViewModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsViewOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSubscription) return;

    try {
      const subscriptionId = selectedSubscription.id || selectedSubscription._id;
      const updateData = {};
      if (editForm.package) updateData.package = editForm.package;
      if (editForm.price) updateData.price = parseFloat(editForm.price);
      if (editForm.notes !== undefined) updateData.notes = editForm.notes;

      await update(subscriptionId, updateData);
      setIsEditOpen(false);
      setSelectedSubscription(null);
      loadSubscriptions(filters);
      loadStatistics();
    } catch (err) {
      console.error("Error updating subscription:", err);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedSubscription) return;

    try {
      const subscriptionId = selectedSubscription.id || selectedSubscription._id;
      await approve(subscriptionId, approveForm.notes);
      setIsApproveOpen(false);
      setSelectedSubscription(null);
      loadSubscriptions(filters);
      loadStatistics();
    } catch (err) {
      console.error("Error approving subscription:", err);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedSubscription) return;

    if (!rejectForm.rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const subscriptionId = selectedSubscription.id || selectedSubscription._id;
      await reject(subscriptionId, rejectForm.rejectionReason);
      setIsRejectOpen(false);
      setSelectedSubscription(null);
      loadSubscriptions(filters);
      loadStatistics();
    } catch (err) {
      console.error("Error rejecting subscription:", err);
    }
  };

  const handleDelete = async (subscriptionId) => {
    if (!confirm("Are you sure you want to delete this subscription? This action cannot be undone.")) {
      return;
    }

    try {
      await remove(subscriptionId);
      loadSubscriptions(filters);
      loadStatistics();
    } catch (err) {
      console.error("Error deleting subscription:", err);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApproveFormChange = (field, value) => {
    setApproveForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRejectFormChange = (field, value) => {
    setRejectForm((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (!isSuperAdmin) {
    return null;
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
              <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="mt-2 text-2xl lg:text-3xl font-semibold text-slate-900">
              Subscriptions Management
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
          </div>
        </div>

        {/* Statistics Cards */}
        <SubscriptionStats statistics={statistics} />

        {/* Filters Section */}
        {showFilters && (
          <SubscriptionFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            count={count}
            filteredCount={filtered.length}
          />
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

      {/* Table View */}
      {isLoading && subscriptions.length === 0 ? (
        <PageLoader message="Loading subscriptions..." />
      ) : (
        <SubscriptionTable
          subscriptions={filtered}
          page={page}
          pageSize={PAGE_SIZE}
          onView={openViewModal}
          onEdit={openEditModal}
          onApprove={openApproveModal}
          onReject={openRejectModal}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <ViewSubscriptionModal
        subscription={selectedSubscription}
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedSubscription(null);
        }}
      />

      <EditSubscriptionModal
        subscription={selectedSubscription}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleUpdate}
        formData={editForm}
        onFormChange={handleEditFormChange}
      />

      <ApproveSubscriptionModal
        subscription={selectedSubscription}
        isOpen={isApproveOpen}
        onClose={() => {
          setIsApproveOpen(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleApprove}
        formData={approveForm}
        onFormChange={handleApproveFormChange}
      />

      <RejectSubscriptionModal
        subscription={selectedSubscription}
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleReject}
        formData={rejectForm}
        onFormChange={handleRejectFormChange}
      />
    </div>
  );
}

