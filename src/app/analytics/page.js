"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BarChart3,
  DollarSign,
  MapPin,
  Users,
  Globe,
  Calendar,
  TrendingUp,
  Home,
  Bed,
  RefreshCw,
  ArrowLeft,
  Building2,
  CreditCard,
  Repeat,
  Percent,
  UserCheck,
  Target,
  PieChart,
} from "lucide-react";
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
import { handleApiError } from "@/utils/errorHandler";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useSEO({
    title: "Analytics | Zuha Host",
    description:
      "View comprehensive analytics for your properties and bookings.",
    keywords:
      "analytics, reports, occupancy, revenue, booking sources, guest trends",
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
        case "occupancy": {
          const response = await getOccupancyAnalytics(params);
          // API returns { success: true, data: {...} }
          const data = response?.data || response;
          setOccupancyData({
            totalBookings: data?.summary?.totalBookings || 0,
            bookedNights: data?.summary?.totalBookedNights || 0,
            occupancyRate: data?.summary?.occupancyRate || 0,
            availableRooms: data?.summary?.totalResources || 0,
            byProperty: data?.byProperty || [],
          });
          break;
        }
        case "revenue": {
          const response = await getRevenueAnalytics(params);
          const data = response?.data || response;
          const byProperty = data?.byProperty || [];
          setRevenueData({
            totalRevenue: data?.summary?.totalRevenue || 0,
            averageBookingValue: data?.summary?.avgBookingValue || 0,
            totalBookings: data?.summary?.totalBookings || 0,
            propertiesCount: byProperty.length,
            byProperty: byProperty,
            bySource: data?.bySource || [],
            byMonth: data?.byMonth || [],
            byPaymentStatus: data?.byPaymentStatus || [],
            currency: data?.summary?.currency || "USD",
          });
          break;
        }
        case "sources": {
          const response = await getBookingSourcesAnalytics(params);
          const data = response?.data || response;
          const sources = data?.sources || [];
          setSourcesData({
            totalBookings: data?.summary?.totalBookings || 0,
            totalRevenue: data?.summary?.totalRevenue || 0,
            bySource: sources.map((source) => ({
              source: source.source || source._id || "Unknown",
              count: source.bookings || source.count || 0,
              revenue: source.revenue || 0,
              percentage: source.bookingPercentage || 0,
            })),
          });
          break;
        }
        case "guests": {
          const response = await getGuestTrendsAnalytics(params);
          const data = response?.data || response;
          setGuestTrendsData({
            totalGuests: data?.summary?.totalGuests || 0,
            repeatGuests: data?.summary?.repeatGuests || 0,
            repeatRate: data?.summary?.repeatGuestRate || 0,
            averageGuestsPerBooking: data?.summary?.avgGuestsPerBooking || 0,
            topGuests: data?.topGuests || [],
            guestComposition: data?.guestComposition || {
              totalAdults: 0,
              totalChildren: 0,
            },
          });
          break;
        }
        case "direct": {
          const response = await getDirectBookingsAnalytics(params);
          const data = response?.data || response;
          const summary = data?.summary || {};
          setDirectBookingsData({
            directBookings: summary.totalBookings || 0,
            directShare: summary.directBookingShare || 0,
            directRevenue: summary.totalRevenue || 0,
            conversionRate: summary.conversionRate || 0,
            avgBookingValue: summary.avgBookingValue || 0,
            commissionSaved: (summary.totalRevenue || 0) * 0.15, // Assuming 15% commission
            statusBreakdown: data?.statusBreakdown || {},
            monthlyTrend: data?.monthlyTrend || [],
          });
          break;
        }
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
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

  const tabs = [
    {
      id: "occupancy",
      label: "Occupancy",
      icon: BarChart3,
      activeClass: "border-blue-600 text-blue-600",
    },
    {
      id: "revenue",
      label: "Revenue",
      icon: DollarSign,
      activeClass: "border-green-600 text-green-600",
    },
    {
      id: "sources",
      label: "Booking Sources",
      icon: MapPin,
      activeClass: "border-purple-600 text-purple-600",
    },
    {
      id: "guests",
      label: "Guest Trends",
      icon: Users,
      activeClass: "border-pink-600 text-pink-600",
    },
    {
      id: "direct",
      label: "Direct Bookings",
      icon: Globe,
      activeClass: "border-indigo-600 text-indigo-600",
    },
  ];

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-600 mt-1">
              Comprehensive insights into your business performance
            </p>
          </div>
        </div>

        <button
          onClick={() => loadAnalytics()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl">
        <div className="flex gap-1 overflow-x-auto px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? tab.activeClass
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>

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
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() =>
            setFilters({ propertyId: "", startDate: "", endDate: "" })
          }
          className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline transition-colors"
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
                  icon={<Calendar className="w-6 h-6" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Booked Nights"
                  value={occupancyData.bookedNights || 0}
                  icon={<Bed className="w-6 h-6" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Occupancy Rate"
                  value={`${(occupancyData.occupancyRate || 0).toFixed(1)}%`}
                  icon={<TrendingUp className="w-6 h-6" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Available Rooms"
                  value={occupancyData.availableRooms || 0}
                  icon={<Home className="w-6 h-6" />}
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              {occupancyData.byProperty &&
                occupancyData.byProperty.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        By Property
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {occupancyData.byProperty.map((item) => (
                        <div
                          key={item.propertyId}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all"
                        >
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {item.propertyName}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                              {item.bookings} bookings • {item.nights} nights
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">
                              {(
                                (item.nights /
                                  (occupancyData.availableRooms || 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
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
                  value={formatCurrency(
                    revenueData.totalRevenue || 0,
                    revenueData.currency,
                  )}
                  icon={<DollarSign className="w-6 h-6" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Avg Booking Value"
                  value={formatCurrency(
                    revenueData.averageBookingValue || 0,
                    revenueData.currency,
                  )}
                  icon={<CreditCard className="w-6 h-6" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Properties"
                  value={revenueData.propertiesCount || 0}
                  icon={<Building2 className="w-6 h-6" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Total Bookings"
                  value={revenueData.totalBookings || 0}
                  icon={<Calendar className="w-6 h-6" />}
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              {revenueData.byProperty && revenueData.byProperty.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      Revenue by Property
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {revenueData.byProperty.map((item) => {
                      const percentage =
                        revenueData.totalRevenue > 0
                          ? (
                              (item.revenue / revenueData.totalRevenue) *
                              100
                            ).toFixed(1)
                          : 0;
                      return (
                        <div
                          key={item.propertyId}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">
                              {item.propertyName}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                              {item.bookings} bookings
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900">
                              {formatCurrency(
                                item.revenue,
                                revenueData.currency,
                              )}
                            </p>
                            <p className="text-xs text-slate-600">
                              {percentage}% of total
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {revenueData.bySource && revenueData.bySource.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      Revenue by Source
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {revenueData.bySource.map((source) => {
                      const percentage =
                        revenueData.totalRevenue > 0
                          ? (
                              (source.revenue / revenueData.totalRevenue) *
                              100
                            ).toFixed(1)
                          : 0;
                      return (
                        <div
                          key={source.source}
                          className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {source.source.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-500">
                              {percentage}%
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(
                              source.revenue,
                              revenueData.currency,
                            )}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {source.bookings} bookings
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Booking Sources Tab */}
          {activeTab === "sources" && sourcesData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Total Bookings"
                  value={sourcesData.totalBookings || 0}
                  icon={<Calendar className="w-6 h-6" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />
                <SummaryCard
                  title="Total Revenue"
                  value={formatCurrency(sourcesData.totalRevenue || 0)}
                  icon={<DollarSign className="w-6 h-6" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />
              </div>

              {sourcesData.bySource && sourcesData.bySource.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sourcesData.bySource.map((source) => (
                    <div
                      key={source.source}
                      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 capitalize">
                          {source.source.replace("_", " ")}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            Bookings
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {source.count}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            Revenue
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(source.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-sm text-slate-600">Share</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {source.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guest Trends Tab */}
          {activeTab === "guests" && guestTrendsData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Total Guests"
                  value={guestTrendsData.totalGuests || 0}
                  icon={<Users className="w-6 h-6" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Repeat Guests"
                  value={guestTrendsData.repeatGuests || 0}
                  icon={<Repeat className="w-6 h-6" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Repeat Rate"
                  value={`${(guestTrendsData.repeatRate || 0).toFixed(1)}%`}
                  icon={<Percent className="w-6 h-6" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Avg Guests/Booking"
                  value={(guestTrendsData.averageGuestsPerBooking || 0).toFixed(
                    1,
                  )}
                  icon={<UserCheck className="w-6 h-6" />}
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              {guestTrendsData.topGuests &&
                guestTrendsData.topGuests.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Top Guests
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {guestTrendsData.topGuests.map((guest, index) => (
                        <div
                          key={guest.guestId}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {guest.guestName}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {guest.guestEmail}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {guest.bookings}{" "}
                              {guest.bookings === 1 ? "booking" : "bookings"}
                            </p>
                            <p className="text-xs text-slate-600">
                              {formatCurrency(guest.totalSpent)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Direct Bookings Tab */}
          {activeTab === "direct" && directBookingsData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Direct Bookings"
                  value={directBookingsData.directBookings || 0}
                  icon={<Globe className="w-6 h-6" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <SummaryCard
                  title="Direct Share"
                  value={`${(directBookingsData.directShare || 0).toFixed(1)}%`}
                  icon={<PieChart className="w-6 h-6" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <SummaryCard
                  title="Direct Revenue"
                  value={formatCurrency(directBookingsData.directRevenue || 0)}
                  icon={<DollarSign className="w-6 h-6" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <SummaryCard
                  title="Conversion Rate"
                  value={`${(directBookingsData.conversionRate || 0).toFixed(1)}%`}
                  icon={<Target className="w-6 h-6" />}
                  iconBgColor="bg-slate-100"
                  iconColor="text-slate-600"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Performance Summary
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-slate-700 font-medium">
                          Commission Saved
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Estimated savings from direct bookings
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-700">
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
