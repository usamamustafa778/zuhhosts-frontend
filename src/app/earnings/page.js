"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";

export default function EarningsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // week, month, year, all
  
  // Mock earnings data
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 45680,
    thisMonth: 8920,
    pendingPayouts: 2340,
    upcomingEarnings: 4560,
    transactions: [
      {
        id: 1,
        date: "2026-01-02",
        property: "Luxury Villa - Downtown",
        guest: "John Smith",
        amount: 1200,
        status: "completed",
        bookingRef: "BK-2026-001"
      },
      {
        id: 2,
        date: "2026-01-01",
        property: "Cozy Apartment - Suburb",
        guest: "Sarah Johnson",
        amount: 850,
        status: "completed",
        bookingRef: "BK-2025-998"
      },
      {
        id: 3,
        date: "2025-12-28",
        property: "Beach House - Malibu",
        guest: "Mike Williams",
        amount: 2500,
        status: "pending",
        bookingRef: "BK-2025-995"
      },
      {
        id: 4,
        date: "2025-12-25",
        property: "Mountain Cabin",
        guest: "Emily Brown",
        amount: 980,
        status: "completed",
        bookingRef: "BK-2025-990"
      },
      {
        id: 5,
        date: "2025-12-20",
        property: "City Loft",
        guest: "David Lee",
        amount: 1450,
        status: "completed",
        bookingRef: "BK-2025-985"
      },
    ],
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Simulate loading data
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Earnings | Zuha Host</title>
        <meta name="description" content="Track your rental income, view transaction history, and manage payouts." />
      </Head>
      <div className="min-h-screen bg-slate-50 -mx-4 lg:mx-0 -my-6 lg:my-0">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
        <h1 className="text-lg font-semibold text-slate-900">Earnings</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-slate-200 px-6 py-6 mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Earnings</h1>
        <p className="mt-2 text-slate-600">Track your income and payouts</p>
      </div>

      <div className="px-4 py-6 lg:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-green-100 p-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Total Earnings</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.totalEarnings)}</p>
            <p className="mt-1 text-xs text-slate-500">All time</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-blue-100 p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">This Month</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.thisMonth)}</p>
            <p className="mt-1 text-xs text-green-600">+12% from last month</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Pending Payouts</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.pendingPayouts)}</p>
            <p className="mt-1 text-xs text-slate-500">Processing</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-purple-100 p-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Upcoming</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.upcomingEarnings)}</p>
            <p className="mt-1 text-xs text-slate-500">Next 30 days</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Export
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {["week", "month", "year", "all"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedPeriod === period
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {period === "all" ? "All time" : `This ${period}`}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Booking Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {earningsData.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {transaction.property}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {transaction.guest}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      {transaction.bookingRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-200">
            {earningsData.transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{transaction.property}</p>
                    <p className="text-sm text-slate-600 mt-1">{transaction.guest}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(transaction.amount)}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                    <StatusBadge status={transaction.status} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{transaction.bookingRef}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Payout Button */}
        <div className="mt-6">
          <button className="w-full lg:w-auto rounded-lg bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-700 transition-colors">
            Request Payout
          </button>
        </div>
      </div>

      {/* Bottom padding for mobile */}
      <div className="h-8" />
    </div>
    </>
  );
}

