"use client";

export default function SubscriptionFilters({ filters, onFilterChange, onClearFilters, count, filteredCount }) {
  const hasActiveFilters = Object.values(filters).some((val) => val !== "");

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        {hasActiveFilters && (
          <button
            className="text-sm text-slate-600 hover:text-slate-900 underline"
            onClick={onClearFilters}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="trial">Trial</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Package Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Package
          </label>
          <select
            value={filters.package}
            onChange={(e) => onFilterChange("package", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All Packages</option>
            <option value="free_trial">Free Trial</option>
            <option value="basic">Basic</option>
            <option value="big_businesses">Big Businesses</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Payment Status
          </label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange("paymentStatus", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredCount}
          </span>{" "}
          of {count} subscription{count !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

