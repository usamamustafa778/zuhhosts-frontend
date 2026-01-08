"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { getEarnings, getAllProperties, getCurrencies } from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";
import { formatCurrency } from "@/utils/currencyUtils";

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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [selectedGroupBy, setSelectedGroupBy] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [properties, setProperties] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
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
  }, [authLoading, isAuthenticated, selectedPeriod, selectedProperty, selectedPaymentStatus, selectedGroupBy, selectedCurrency]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCurrencies();
    }
  }, [authLoading, isAuthenticated]);

  const fetchCurrencies = async () => {
    try {
      const response = await getCurrencies();
      const currenciesList = response.currencies || [];
      setCurrencies(currenciesList);
    } catch (err) {
      console.error("Failed to load currencies:", err);
      setCurrencies([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {};
      
      if (selectedPeriod) {
        params.period = selectedPeriod;
      }

      if (selectedProperty) {
        params.property_id = selectedProperty;
      }

      if (selectedPaymentStatus) {
        params.payment_status = selectedPaymentStatus;
      }

      if (selectedGroupBy) {
        params.groupBy = selectedGroupBy;
      }

      if (selectedCurrency) {
        params.currency = selectedCurrency;
      }

      // Load properties and earnings in parallel
      const [earningsResponse, propertiesResponse] = await Promise.all([
        getEarnings(params),
        getAllProperties(),
      ]);

      // Handle earnings data
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
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

  // Count active filters
  const activeFiltersCount = [
    selectedProperty,
    selectedPaymentStatus,
    selectedGroupBy,
    selectedCurrency
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Header - consistent with other pages */}
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
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Earnings
          </h1>
      </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-slate-900 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards - Smaller on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-3 lg:p-5">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
              <div className="rounded-full bg-green-100 p-1.5 lg:p-2">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs lg:text-sm font-medium text-slate-600">Total Earnings</p>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-slate-900">{formatCurrency(earningsData.summary.total_earnings || 0, earningsData.summary.currency)}</p>
            <p className="mt-0.5 lg:mt-1 text-[10px] lg:text-xs text-slate-500">After discounts</p>
          </div>

          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-3 lg:p-5">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
              <div className="rounded-full bg-blue-100 p-1.5 lg:p-2">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-xs lg:text-sm font-medium text-slate-600">Bookings</p>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-slate-900">{earningsData.summary.total_bookings || 0}</p>
            <p className="mt-0.5 lg:mt-1 text-[10px] lg:text-xs text-slate-500">Total count</p>
          </div>

          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-3 lg:p-5">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
              <div className="rounded-full bg-purple-100 p-1.5 lg:p-2">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs lg:text-sm font-medium text-slate-600">Total Amount</p>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-slate-900">{formatCurrency(earningsData.summary.total_amount || 0, earningsData.summary.currency)}</p>
            <p className="mt-0.5 lg:mt-1 text-[10px] lg:text-xs text-slate-500">Before discounts</p>
          </div>

          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-3 lg:p-5">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
              <div className="rounded-full bg-orange-100 p-1.5 lg:p-2">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-xs lg:text-sm font-medium text-slate-600">Avg Value</p>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-slate-900">{formatCurrency(earningsData.summary.average_booking_value || 0, earningsData.summary.currency)}</p>
            <p className="mt-0.5 lg:mt-1 text-[10px] lg:text-xs text-slate-500">Per booking</p>
        </div>
      </div>

      {/* Filters Panel - Mobile Modal / Desktop Always Visible */}
      {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Period Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "15days", label: "15 Days" },
                      { value: "month", label: "Month" },
                      { value: "6months", label: "6 Months" },
                      { value: "year", label: "Year" },
                    ].map((period) => (
                      <button
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPeriod === period.value
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
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

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Status</label>
                  <select
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Paid & Partially Paid</option>
                    <option value="paid">Paid Only</option>
                    <option value="partially-paid">Partially Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">All Currencies</option>
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name || currency.code} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group By */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Group By</label>
                  <select
                    value={selectedGroupBy}
                    onChange={(e) => setSelectedGroupBy(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">No Grouping</option>
                    <option value="property">By Property</option>
                    <option value="month">By Month</option>
                    <option value="day">By Day</option>
                  </select>
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-4">
          <div className="space-y-4">
            {/* Period Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
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
            <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Property</label>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Status</label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">Paid & Partially Paid</option>
                  <option value="paid">Paid Only</option>
                  <option value="partially-paid">Partially Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">All Currencies</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name || currency.code} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Group By</label>
                <select
                  value={selectedGroupBy}
                  onChange={(e) => setSelectedGroupBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">No Grouping</option>
                  <option value="property">By Property</option>
                  <option value="month">By Month</option>
                  <option value="day">By Day</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 overflow-hidden">
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
                    <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                      No bookings found for the selected period
                    </td>
                  </tr>
                ) : (
                  earningsData.bookings.map((transaction, index) => {
                    const date = transaction.start_date || transaction.check_in || transaction.createdAt || transaction.booking_date;
                    
                    // Handle property
                    let property = "";
                    if (transaction.property && typeof transaction.property === 'object') {
                      property = transaction.property.title || transaction.property.name || "";
                    } else if (transaction.property_id && typeof transaction.property_id === 'object') {
                      property = transaction.property_id.title || transaction.property_id.name || "";
                    } else if (typeof transaction.property === 'string') {
                      property = transaction.property;
                    }
                    
                    // Handle guest
                    let guest = "";
                    if (transaction.guest_id && typeof transaction.guest_id === 'object') {
                      guest = transaction.guest_id.name || transaction.guest_id.fullName || "";
                    } else if (transaction.guest) {
                      guest = transaction.guest;
                    } else if (transaction.guestName) {
                      guest = transaction.guestName;
                    }
                    
                    const status = transaction.payment_status || transaction.status || "pending";
                    const earnings = parseFloat(transaction.net_amount || transaction.amount - transaction.discount || 0);
                    const currency = transaction.currency || null;

                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {formatDate(date) || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {property || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {guest || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(earnings, currency)}
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
              <div className="p-8 text-center text-sm text-slate-500">
                No bookings found for the selected period
              </div>
            ) : (
              earningsData.bookings.map((transaction, index) => {
                const date = transaction.start_date || transaction.check_in || transaction.createdAt || transaction.booking_date;
                
                // Handle property
                let property = "";
                if (transaction.property && typeof transaction.property === 'object') {
                  property = transaction.property.title || transaction.property.name || "";
                } else if (transaction.property_id && typeof transaction.property_id === 'object') {
                  property = transaction.property_id.title || transaction.property_id.name || "";
                } else if (typeof transaction.property === 'string') {
                  property = transaction.property;
                }
                
                // Handle guest
                let guest = "";
                if (transaction.guest_id && typeof transaction.guest_id === 'object') {
                  guest = transaction.guest_id.name || transaction.guest_id.fullName || "";
                } else if (transaction.guest) {
                  guest = transaction.guest;
                } else if (transaction.guestName) {
                  guest = transaction.guestName;
                }
                
                const status = transaction.payment_status || transaction.status || "pending";
                const earnings = parseFloat(transaction.net_amount || transaction.amount - transaction.discount || 0);
                const currency = transaction.currency || null;

                return (
                  <div key={index} className="p-3 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{property || "Property"}</p>
                        {guest && <p className="text-sm text-slate-600 mt-0.5 truncate">{guest}</p>}
                      </div>
                      <p className="text-base font-bold text-slate-900 ml-2">{formatCurrency(earnings, currency)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {formatDate(date) && (
                          <p className="text-xs text-slate-500">{formatDate(date)}</p>
                        )}
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
    </div>
  );
}
