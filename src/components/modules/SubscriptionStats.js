"use client";

import SummaryCard from "@/components/common/SummaryCard";

export default function SubscriptionStats({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        label="Total Subscriptions"
        value={statistics.total || 0}
      />
      <SummaryCard
        label="Pending"
        value={statistics.byStatus?.pending || 0}
      />
      <SummaryCard
        label="Approved"
        value={statistics.byStatus?.approved || 0}
      />
      <SummaryCard
        label="Unpaid"
        value={statistics.byPaymentStatus?.unpaid || 0}
      />
    </div>
  );
}

