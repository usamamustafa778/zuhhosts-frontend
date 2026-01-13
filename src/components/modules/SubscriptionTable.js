"use client";

import DataTable from "@/components/common/DataTable";
import { formatCurrency } from "@/utils/currencyUtils";

// Subscription Status Pill Component
function SubscriptionStatusPill({ status }) {
  const statusConfig = {
    trial: { label: "Trial", className: "bg-blue-50 text-blue-700" },
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
    approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700" },
    rejected: { label: "Rejected", className: "bg-rose-50 text-rose-600" },
    expired: { label: "Expired", className: "bg-slate-100 text-slate-600" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600" };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

// Payment Status Pill Component
function PaymentStatusPill({ status }) {
  const statusConfig = {
    paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
    unpaid: { label: "Unpaid", className: "bg-amber-50 text-amber-700" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600" };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function SubscriptionTable({
  subscriptions,
  page,
  pageSize,
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}) {
  const paginated = subscriptions.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <DataTable
      headers={[
        "#",
        "User",
        "Package",
        "Price",
        "Status",
        "Payment Status",
        "Created",
        "Actions",
      ]}
      rows={paginated.map((subscription, index) => {
        const subscriptionId = subscription.id || subscription._id || `sub-${index}`;
        const userId = subscription.userId;
        const userName = userId?.name || "N/A";
        const userEmail = userId?.email || "N/A";
        const createdDate = subscription.createdAt
          ? new Date(subscription.createdAt).toLocaleDateString()
          : "N/A";
        const serialNumber = page * pageSize + index + 1;

        return {
          id: subscriptionId,
          cells: [
            <span key={`serial-${subscriptionId}`} className="text-sm font-medium text-slate-500">
              {serialNumber}
            </span>,
            <div key={`user-${subscriptionId}`}>
              <div className="font-semibold text-slate-900">{userName}</div>
              <div className="text-xs text-slate-400">{userEmail}</div>
            </div>,
            <span key={`package-${subscriptionId}`} className="text-sm text-slate-600 capitalize">
              {subscription.package?.replace("_", " ") || "N/A"}
            </span>,
            <span key={`price-${subscriptionId}`} className="text-sm font-semibold text-slate-900">
              {subscription.price ? formatCurrency(subscription.price, subscription.currency || "USD") : "N/A"}
            </span>,
            <SubscriptionStatusPill key={`status-${subscriptionId}`} status={subscription.status} />,
            <PaymentStatusPill key={`payment-${subscriptionId}`} status={subscription.paymentStatus} />,
            <span key={`created-${subscriptionId}`} className="text-xs text-slate-500">
              {createdDate}
            </span>,
            <div key={`actions-${subscriptionId}`} className="flex gap-2">
              <button
                className="text-blue-500 hover:text-blue-900 transition-colors"
                onClick={() => onView(subscription)}
                title="View Details"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              {subscription.status === "pending" && (
                <>
                  <button
                    className="text-emerald-500 hover:text-emerald-900 transition-colors"
                    onClick={() => onApprove(subscription)}
                    title="Approve"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    className="text-rose-500 hover:text-rose-900 transition-colors"
                    onClick={() => onReject(subscription)}
                    title="Reject"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
              <button
                className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                onClick={() => onEdit(subscription)}
                title="Edit"
              >
                Edit
              </button>
              <button
                className="text-sm text-rose-500 underline-offset-2 hover:text-rose-900 hover:underline"
                onClick={() => onDelete(subscriptionId)}
                title="Delete"
              >
                Delete
              </button>
            </div>,
          ],
        };
      })}
      emptyLabel="No subscriptions found."
    />
  );
}

