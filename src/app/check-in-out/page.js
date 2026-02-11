"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getAllBookings,
  checkInBooking,
  checkOutBooking,
  updateBookingStatus,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import { formatCurrency } from "@/utils/currencyUtils";
import { handleApiError } from "@/utils/errorHandler";

export default function CheckInOutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useSEO({
    title: "Check-In / Check-Out | Zuha Host",
    description: "Manage guest check-ins and check-outs for today.",
    keywords: "check-in, check-out, arrivals, departures, front desk",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("arrivals");
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [todaysCheckIns, setTodaysCheckIns] = useState([]);
  const [todaysCheckOuts, setTodaysCheckOuts] = useState([]);
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [checkInData, setCheckInData] = useState({
    verificationNotes: "",
  });

  const [checkOutData, setCheckOutData] = useState({
    finalCharges: "",
    checkoutNotes: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBookings();
  }, [isAuthenticated]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);

      const today = new Date().toISOString().split("T")[0];

      const response = await getAllBookings();
      // API may return { data: [...] } or { bookings: [...] } or array directly
      const raw = response?.data ?? response?.bookings ?? response;
      const bookings = Array.isArray(raw) ? raw : [];

      const normStatus = (s) =>
        (s || "").toLowerCase().trim().replace(/-/g, "_").replace(/\s+/g, "_");

      // Checked-in guests (any casing: checked_in, checked-in, Checked In)
      const checkIns = bookings.filter(
        (b) => normStatus(b.status) === "checked_in"
      );

      // Checked-out guests
      const checkOuts = bookings.filter(
        (b) => normStatus(b.status) === "checked_out"
      );

      // Pending arrivals: not yet checked in, stay overlaps today (so we can check them in)
      const pendingArrivals = bookings.filter((b) => {
        const status = normStatus(b.status);
        if (status === "checked_in" || status === "checked_out") return false;
        const start = (b.start_date || b.startDate || "").split("T")[0];
        const end = (b.end_date || b.endDate || "").split("T")[0];
        return start && end && start <= today && end >= today;
      });

      setTodaysCheckIns(checkIns);
      setTodaysCheckOuts(checkOuts);
      setPendingArrivals(pendingArrivals);
    } catch (error) {
      handleApiError(error, router, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCheckIn = (booking) => {
    setSelectedBooking(booking);
    setCheckInData({
      verificationNotes: "",
    });
    setCheckInModalOpen(true);
  };

  const handleOpenCheckOut = (booking) => {
    setSelectedBooking(booking);
    setCheckOutData({
      finalCharges: booking.amount?.toString() || "",
      checkoutNotes: "",
    });
    setCheckOutModalOpen(true);
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    const toastId = toast.loading("Processing check-in...");

    try {
      const bookingId = selectedBooking.id || selectedBooking._id;
      const status = (selectedBooking.status || "").toLowerCase().trim().replace(/-/g, "_");

      // Backend only allows check-in for "confirmed" bookings. If status is "pending", confirm first.
      if (status === "pending") {
        toast.loading("Confirming booking first...", { id: toastId });
        await updateBookingStatus(bookingId, "confirmed");
      }

      const response = await checkInBooking(bookingId, checkInData);
      const updatedBooking = response?.data || response?.booking || response;

      toast.success("Guest checked in successfully!", { id: toastId });
      setCheckInModalOpen(false);
      setSelectedBooking(null);
      loadBookings();
    } catch (error) {
      toast.error(error.message || "Failed to check-in", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    const toastId = toast.loading("Processing check-out...");

    try {
      const bookingId = selectedBooking.id || selectedBooking._id;
      const response = await checkOutBooking(bookingId, {
        finalCharges: checkOutData.finalCharges ? Number(checkOutData.finalCharges) : undefined,
        checkoutNotes: checkOutData.checkoutNotes,
      });
      const updatedBooking = response?.data || response?.booking || response;
      console.log("[Check-Out] Response →", { bookingId, checkOutTime: updatedBooking?.checkOutTime, status: updatedBooking?.status });

      toast.success("Guest checked out successfully!", { id: toastId });
      setCheckOutModalOpen(false);
      setSelectedBooking(null);
      loadBookings(); // Reload to update lists
    } catch (error) {
      toast.error(error.message || "Failed to check-out", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading bookings..." />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Check-In / Check-Out</h1>
              <p className="text-slate-600 mt-0.5 text-sm sm:text-base">Manage today&apos;s arrivals and departures</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadBookings()}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-amber-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700/90">Arrivals</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{pendingArrivals.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Pending check-in</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-blue-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700/90">Checked In</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{todaysCheckIns.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Currently staying</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-emerald-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/90">Checked Out</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{todaysCheckOuts.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Completed today</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab("arrivals")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "arrivals"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Arrivals
          <span className={`ml-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "arrivals" ? "bg-white/20" : "bg-slate-200/80 text-slate-600"}`}>
            {pendingArrivals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("checkin")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "checkin"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Checked In
          <span className={`ml-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "checkin" ? "bg-white/20" : "bg-slate-200/80 text-slate-600"}`}>
            {todaysCheckIns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("checkout")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "checkout"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Checked Out
          <span className={`ml-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "checkout" ? "bg-white/20" : "bg-slate-200/80 text-slate-600"}`}>
            {todaysCheckOuts.length}
          </span>
        </button>
      </div>

      {/* Pending Arrivals — today's bookings that need check-in */}
      {activeTab === "arrivals" && (
        <div className="space-y-4">
          {pendingArrivals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 sm:p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No arrivals today</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">Bookings whose stay includes today will appear here for check-in.</p>
            </div>
          ) : (
            pendingArrivals.map((booking) => {
              const bookingId = booking.id || booking._id;
              const guest = booking.guest_id;
              const property = booking.property_id;
              const room = booking.roomId;

              return (
                <div
                  key={bookingId}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow flex"
                >
                  <div className="w-1.5 shrink-0 bg-amber-500" aria-hidden />
                  <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg shrink-0">
                          {guest?.name?.[0]?.toUpperCase() || "G"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 truncate">
                            {guest?.name || "Guest"}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">{guest?.phone || guest?.email || "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-slate-500">
                          <span className="font-medium text-slate-700">{property?.title || property?.name || "N/A"}</span>
                          {room?.roomNumber != null && (
                            <span className="text-slate-400 ml-1">· Room {room.roomNumber}</span>
                          )}
                        </span>
                        <span className="text-slate-500">
                          {formatDate(booking.start_date || booking.startDate)} – {formatDate(booking.end_date || booking.endDate)}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(booking.amount, booking.currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenCheckIn(booking)}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shrink-0 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Check In
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Check-Ins List */}
      {activeTab === "checkin" && (
        <div className="space-y-4">
          {todaysCheckIns.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 sm:p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">All clear</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">No checked-in guests at this time.</p>
            </div>
          ) : (
            todaysCheckIns.map((booking) => {
              const bookingId = booking.id || booking._id;
              const guest = booking.guest_id;
              const property = booking.property_id;
              const room = booking.roomId;

              return (
                <div
                  key={bookingId}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow flex"
                >
                  <div className="w-1.5 shrink-0 bg-blue-500" aria-hidden />
                  <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                          {guest?.name?.[0]?.toUpperCase() || "G"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 truncate">
                            {guest?.name || "Guest"}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">{guest?.phone || guest?.email || "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-slate-500">
                          <span className="font-medium text-slate-700">{property?.title || "N/A"}</span>
                          {room?.roomNumber != null && (
                            <span className="text-slate-400 ml-1">· Room {room.roomNumber}</span>
                          )}
                        </span>
                        <span className="text-slate-500">
                          Checked in {booking.checkInTime
                            ? new Date(booking.checkInTime).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })
                            : "N/A"}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(booking.amount, booking.currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenCheckOut(booking)}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shrink-0 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Check Out
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Check-Outs List */}
      {activeTab === "checkout" && (
        <div className="space-y-4">
          {todaysCheckOuts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 sm:p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">All clear</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">No checked-out guests at this time.</p>
            </div>
          ) : (
            todaysCheckOuts.map((booking) => {
              const bookingId = booking.id || booking._id;
              const guest = booking.guest_id;
              const property = booking.property_id;
              const room = booking.roomId;

              return (
                <div
                  key={bookingId}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow flex"
                >
                  <div className="w-1.5 shrink-0 bg-emerald-500" aria-hidden />
                  <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                          {guest?.name?.[0]?.toUpperCase() || "G"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 truncate">
                            {guest?.name || "Guest"}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">{guest?.phone || guest?.email || "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-slate-500">
                          <span className="font-medium text-slate-700">{property?.title || "N/A"}</span>
                          {room?.roomNumber != null && (
                            <span className="text-slate-400 ml-1">· Room {room.roomNumber}</span>
                          )}
                        </span>
                        <span className="text-slate-500">
                          Checked out {booking.checkOutTime
                            ? new Date(booking.checkOutTime).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })
                            : "N/A"}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(booking.amount, booking.currency)}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 shrink-0 inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Check-In Modal */}
      <Modal
        title="Check-In Guest"
        description="Verify guest information and complete check-in"
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setCheckInModalOpen(false);
          setSelectedBooking(null);
        }}
        primaryActionLabel={isProcessing ? "Processing..." : "Complete Check-In"}
        onPrimaryAction={handleCheckIn}
        disabled={isProcessing}
      >
        {selectedBooking && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                  {selectedBooking.guest_id?.name?.[0]?.toUpperCase() || "G"}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">
                    {selectedBooking.guest_id?.name || "Guest"}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {selectedBooking.property_id?.title || "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Amount</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {formatCurrency(selectedBooking.amount, selectedBooking.currency)}
                  </p>
                </div>
                {selectedBooking.roomId?.roomNumber != null && (
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Room</p>
                    <p className="font-semibold text-slate-900 mt-0.5">Room {selectedBooking.roomId.roomNumber}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Verification notes <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:opacity-50"
                value={checkInData.verificationNotes}
                onChange={(e) =>
                  setCheckInData({ ...checkInData, verificationNotes: e.target.value })
                }
                placeholder="ID verified, payment confirmed..."
                disabled={isProcessing}
              />
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-200/80 p-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">
                This will mark the booking as checked-in and the room/unit as occupied.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Check-Out Modal */}
      <Modal
        title="Check-Out Guest"
        description="Review charges and complete check-out"
        isOpen={isCheckOutModalOpen}
        onClose={() => {
          setCheckOutModalOpen(false);
          setSelectedBooking(null);
        }}
        primaryActionLabel={isProcessing ? "Processing..." : "Complete Check-Out"}
        onPrimaryAction={handleCheckOut}
        disabled={isProcessing}
      >
        {selectedBooking && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                  {selectedBooking.guest_id?.name?.[0]?.toUpperCase() || "G"}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">
                    {selectedBooking.guest_id?.name || "Guest"}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {selectedBooking.property_id?.title || "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Original amount</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {formatCurrency(selectedBooking.amount, selectedBooking.currency)}
                  </p>
                </div>
                {selectedBooking.roomId?.roomNumber != null && (
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Room</p>
                    <p className="font-semibold text-slate-900 mt-0.5">Room {selectedBooking.roomId.roomNumber}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Final charges <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition disabled:opacity-50"
                value={checkOutData.finalCharges}
                onChange={(e) =>
                  setCheckOutData({ ...checkOutData, finalCharges: e.target.value })
                }
                placeholder={selectedBooking.amount?.toString() ?? "Same as original"}
                disabled={isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Leave blank to use original amount. Update if there are additional charges.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Check-out notes <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition disabled:opacity-50"
                value={checkOutData.checkoutNotes}
                onChange={(e) =>
                  setCheckOutData({ ...checkOutData, checkoutNotes: e.target.value })
                }
                placeholder="No damages, room left clean..."
                disabled={isProcessing}
              />
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed">
                This will mark the booking as checked-out, set room/unit to dirty, and create a housekeeping task.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
