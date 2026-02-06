"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getOccupancyAnalytics,
  getRevenueAnalytics,
  getBookingSourcesAnalytics,
  getGuestTrendsAnalytics,
  getDirectBookingsAnalytics,
  getAllProperties,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import SummaryCard from "@/components/common/SummaryCard";
import Select from "@/components/common/Select";
import PageLoader from "@/components/common/PageLoader";
import { formatCurrency } from "@/utils/currencyUtils";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useSEO({
    title: "Analytics | Zuha Host",
    description: "View comprehensive analytics for your properties and bookings.",
    keywords: "analytics, reports, occupancy, revenue, booking sources, guest trends",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("occupancy");
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    propertyId: "",
    startDate: "",
    endDate: "",
  });

  const [occupancyData, setOccupancyData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [sourcesData, setSourcesData] = useState(null);
  const [guestTrendsData, setGuestTrendsData] = useState(null);
  const [directBookingsData, setDirectBookingsData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadProperties();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAnalytics();
  }, [isAuthenticated, activeTab, filters]);

  const loadProperties = async () => {
    try {
      const propertiesData = await getAllProperties();
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
    } catch (error) {
      console.error("Failed to load properties:", error);
      handleApiError(error, router, toast);
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (filters.propertyId) params.propertyId = filters.propertyId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      switch (activeTab) {
        case "occupancy":
          const occupancy = await getOccupancyAnalytics(params);
          setOccupancyData(occupancy);
          break;
        case "revenue":
          const revenue = await getRevenueAnalytics(params);
          setRevenueData(revenue);
          break;
        case "sources":
          const sources = await getBookingSourcesAnalytics(params);
          setSourcesData(sources);
          break;
        case "guests":
          const guestTrends = await getGuestTrendsAnalytics(params);
          setGuestTrendsData(guestTrends);
          break;
        case "direct":
          const directBookings = await getDirectBookingsAnalytics(params);
          setDirectBookingsData(directBookings);
          break;
      }
    } catch (error) {
      // Use centralized error handler - auto-redirects on TENANT_REQUIRED
      handleApiError(error, router, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
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
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Analytics</h1>
        </div>

        <button
          onClick={() => loadAnalytics()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: "occupancy", label: "Occupancy", icon: "📊" },
            { id: "revenue", label: "Revenue", icon: "💰" },
            { id: "sources", label: "Booking Sources", icon: "📍" },
            { id: "guests", label: "Guest Trends", icon: "👥" },
            { id: "direct", label: "Direct Bookings", icon: "🌐" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Property"
            value={filters.propertyId}
            onChange={(value) => handleFilterChange("propertyId", value)}
            placeholder="All Properties"
            options={[
              { value: "", label: "All Properties" },
              ...properties.map((p) => ({
                value: p.id || p._id,
                label: p.title || p.name,
              })),
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() => setFilters({ propertyId: "", startDate: "", endDate: "" })}
          className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
        >
          Clear filters
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader message="Loading analytics..." />
      ) : (
        <>
          {/* Occupancy Tab */}
          {activeTab === "occupancy" && occupancyData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Total Bookings"
                  value={occupancyData.totalBookings || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Booked Nights"
                  value={occupancyData.bookedNights || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Occupancy Rate"
                  value={`${occupancyData.occupancyRate || 0}%`}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Available Rooms"
                  value={occupancyData.availableRooms || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  }
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              {occupancyData.byProperty && occupancyData.byProperty.length > 0 && (
                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">By Property</h3>
                  <div className="space-y-3">
                    {occupancyData.byProperty.map((item) => (
                      <div key={item.propertyId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.propertyName}</h4>
                          <p className="text-sm text-slate-600">
                            {item.bookings} bookings • {item.nights} nights
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{item.occupancyRate}%</p>
                          <p className="text-xs text-slate-600">Occupancy</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === "revenue" && revenueData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Total Revenue"
                  value={formatCurrency(revenueData.totalRevenue || 0)}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Avg Booking Value"
                  value={formatCurrency(revenueData.averageBookingValue || 0)}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Properties"
                  value={revenueData.propertiesCount || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Total Bookings"
                  value={revenueData.totalBookings || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              {revenueData.byProperty && revenueData.byProperty.length > 0 && (
                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Property</h3>
                  <div className="space-y-3">
                    {revenueData.byProperty.map((item) => (
                      <div key={item.propertyId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{item.propertyName}</h4>
                          <p className="text-sm text-slate-600">{item.bookings} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">{formatCurrency(item.revenue)}</p>
                          <p className="text-xs text-slate-600">{item.percentage}% of total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Booking Sources Tab */}
          {activeTab === "sources" && sourcesData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sourcesData.bySource && sourcesData.bySource.map((source) => (
                  <SummaryCard
                    key={source.source}
                    title={source.source}
                    value={`${source.count} (${source.percentage}%)`}
                    subtitle={formatCurrency(source.revenue)}
                    icon={
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Guest Trends Tab */}
          {activeTab === "guests" && guestTrendsData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Total Guests"
                  value={guestTrendsData.totalGuests || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Repeat Guests"
                  value={guestTrendsData.repeatGuests || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Repeat Rate"
                  value={`${guestTrendsData.repeatRate || 0}%`}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Avg Guests/Booking"
                  value={(guestTrendsData.averageGuestsPerBooking || 0).toFixed(1)}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>
            </div>
          )}

          {/* Direct Bookings Tab */}
          {activeTab === "direct" && directBookingsData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Direct Bookings"
                  value={directBookingsData.directBookings || 0}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Direct Share"
                  value={`${directBookingsData.directShare || 0}%`}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  }
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Direct Revenue"
                  value={formatCurrency(directBookingsData.directRevenue || 0)}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Conversion Rate"
                  value={`${directBookingsData.conversionRate || 0}%`}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <span className="text-slate-700">Commission Saved</span>
                    <span className="text-xl font-bold text-green-700">
                      {formatCurrency(directBookingsData.commissionSaved || 0)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Your direct booking website has saved you{" "}
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(directBookingsData.commissionSaved || 0)}
                    </span>{" "}
                    in OTA commissions! 🎉
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
