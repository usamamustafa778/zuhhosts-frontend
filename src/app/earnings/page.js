"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { getEarnings, getAllProperties } from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";

export default function EarningsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  
  // SEO
  useSEO({
    title: "Earnings | Zuha Host",
    description: "Track your rental income and view transaction history.",
    keywords: "earnings, income, revenue, transaction history, rental income",
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // today, week, 15days, month, 6months, year
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(""); // defaults to paid and partially-paid
  const [selectedGroupBy, setSelectedGroupBy] = useState(""); // property, month, day
  const [properties, setProperties] = useState([]);
  
  // Earnings data from API
  const [earningsData, setEarningsData] = useState({
    summary: {
      totalEarnings: 0,
      totalBookings: 0,
      totalAmount: 0,
      totalDiscount: 0,
      averageBookingValue: 0,
    },
    bookings: [],
    grouped_by_property: [],
    grouped_by_month: [],
    grouped_by_day: [],
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, selectedPeriod, selectedProperty, selectedPaymentStatus, selectedGroupBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {};
      
      // Period filter (today, week, 15days, month, 6months, year)
      if (selectedPeriod) {
        params.period = selectedPeriod;
      }

      // Property filter
      if (selectedProperty) {
        params.property_id = selectedProperty;
      }

      // Payment status filter (defaults to paid and partially-paid on backend)
      if (selectedPaymentStatus) {
        params.payment_status = selectedPaymentStatus;
      }

      // Grouping option
      if (selectedGroupBy) {
        params.groupBy = selectedGroupBy;
      }

      // Load properties and earnings in parallel
      const [earningsResponse, propertiesResponse] = await Promise.all([
        getEarnings(params),
        getAllProperties(),
      ]);

      // Handle earnings data - API returns: summary, bookings, grouped_by_property/month/day
      const earnings = earningsResponse || {};
      
      setEarningsData({
        summary: earnings.summary || {
          total_earnings: 0,
          total_bookings: 0,
          total_amount: 0,
          total_discount: 0,
          average_booking_value: 0,
        },
        bookings: Array.isArray(earnings.bookings) ? earnings.bookings : [],
        grouped_by_property: earnings.grouped_by_property || [],
        grouped_by_month: earnings.grouped_by_month || [],
        grouped_by_day: earnings.grouped_by_day || [],
      });

      setProperties(Array.isArray(propertiesResponse) ? propertiesResponse : []);
    } catch (err) {
      console.error("Error loading earnings:", err);
      setError(err.message || "Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader message="Loading earnings..." />;
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
    const normalizedStatus = (status || "").toLowerCase();
    const styles = {
      completed: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
      "partially-paid": "bg-blue-100 text-blue-800",
      "partially_paid": "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-slate-100 text-slate-800",
      canceled: "bg-slate-100 text-slate-800",
    };

    const style = styles[normalizedStatus] || "bg-slate-100 text-slate-800";
    const displayText = normalizedStatus === "paid" ? "Paid" : 
                        normalizedStatus === "partially-paid" || normalizedStatus === "partially_paid" ? "Partially Paid" :
                        normalizedStatus === "completed" ? "Completed" :
                        normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${style}`}>
        {displayText}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 -mx-4 lg:mx-0 -my-6 lg:my-0">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
        <h1 className="text-lg font-semibold text-slate-900">Earnings</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-slate-200 px-6 py-6 mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Earnings</h1>
        <p className="mt-2 text-slate-600">Track your rental income and transaction history</p>
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
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.summary.total_earnings || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Amount - Discount</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-blue-100 p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Total Bookings</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{earningsData.summary.total_bookings || 0}</p>
            <p className="mt-1 text-xs text-slate-500">Bookings count</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-purple-100 p-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Total Amount</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.summary.total_amount || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Before discounts</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-orange-100 p-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Avg Booking Value</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(earningsData.summary.average_booking_value || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Per booking</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
            <button 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => {
                // TODO: Implement export functionality
                console.log("Export earnings data");
              }}
            >
              Export
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Period Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "15days", label: "Last 15 Days" },
                { value: "month", label: "This Month" },
                { value: "6months", label: "Last 6 Months" },
                { value: "year", label: "This Year" },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedPeriod === period.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Filter by Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">All Properties</option>
                  {properties.map((property) => (
                    <option key={property.id || property._id} value={property.id || property._id}>
                      {property.title || property.name || "Untitled Property"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">Paid & Partially Paid (Default)</option>
                  <option value="paid">Paid Only</option>
                  <option value="partially-paid">Partially Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Group By
                </label>
                <select
                  value={selectedGroupBy}
                  onChange={(e) => setSelectedGroupBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">No Grouping (Default: Property)</option>
                  <option value="property">By Property</option>
                  <option value="month">By Month</option>
                  <option value="day">By Day</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

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
                {earningsData.bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                      No bookings found for the selected period
                    </td>
                  </tr>
                ) : (
                  earningsData.bookings.map((transaction, index) => {
                    const transactionId = transaction.id || transaction._id || index;
                    const date = transaction.start_date || transaction.check_in || transaction.createdAt || transaction.booking_date;
                    
                    // Handle property - can be object {id, title, location} or just property_id
                    let property = "N/A";
                    if (transaction.property && typeof transaction.property === 'object') {
                      property = transaction.property.title || transaction.property.name || "N/A";
                    } else if (transaction.property_id && typeof transaction.property_id === 'object') {
                      property = transaction.property_id.title || transaction.property_id.name || "N/A";
                    } else if (typeof transaction.property === 'string') {
                      property = transaction.property;
                    }
                    
                    // Handle guest - may not be in response
                    const guest = transaction.guest_id && typeof transaction.guest_id === 'object'
                      ? transaction.guest_id.name || transaction.guest_id.fullName || "N/A"
                      : transaction.guest || transaction.guestName || "N/A";
                    
                    const bookingRef = transaction.bookingRef || transaction.booking_id || transaction.id || `BK-${transactionId}`;
                    const status = transaction.payment_status || transaction.status || "pending";
                    
                    // Use net_amount from API (already calculated as amount - discount)
                    const earnings = parseFloat(transaction.net_amount || transaction.amount - transaction.discount || 0);

                    return (
                      <tr key={transactionId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {date ? formatDate(date) : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {property}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {guest}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                          {bookingRef}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(earnings)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-200">
            {earningsData.bookings.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No bookings found for the selected period
              </div>
            ) : (
              earningsData.bookings.map((transaction, index) => {
                const transactionId = transaction.id || transaction._id || index;
                const date = transaction.start_date || transaction.check_in || transaction.createdAt || transaction.booking_date;
                
                // Handle property - can be object {id, title, location} or just property_id
                let property = "N/A";
                if (transaction.property && typeof transaction.property === 'object') {
                  property = transaction.property.title || transaction.property.name || "N/A";
                } else if (transaction.property_id && typeof transaction.property_id === 'object') {
                  property = transaction.property_id.title || transaction.property_id.name || "N/A";
                } else if (typeof transaction.property === 'string') {
                  property = transaction.property;
                }
                
                // Handle guest - may not be in response
                const guest = transaction.guest_id && typeof transaction.guest_id === 'object'
                  ? transaction.guest_id.name || transaction.guest_id.fullName || "N/A"
                  : transaction.guest || transaction.guestName || "N/A";
                
                const bookingRef = transaction.bookingRef || transaction.booking_id || transaction.id || `BK-${transactionId}`;
                const status = transaction.payment_status || transaction.status || "pending";
                
                // Use net_amount from API (already calculated as amount - discount)
                const earnings = parseFloat(transaction.net_amount || transaction.amount - transaction.discount || 0);

                return (
                  <div key={transactionId} className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{property}</p>
                        <p className="text-sm text-slate-600 mt-1">{guest}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(earnings)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-500">{date ? formatDate(date) : "N/A"}</p>
                        <StatusBadge status={status} />
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{bookingRef}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Bottom padding for mobile */}
      <div className="h-8" />
    </div>
  );
}

