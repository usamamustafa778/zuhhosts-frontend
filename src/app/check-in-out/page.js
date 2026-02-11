"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getAllBookings,
  checkInBooking,
  checkOutBooking,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import StatusPill from "@/components/common/StatusPill";
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
  const [activeTab, setActiveTab] = useState("checkin");
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
      
      // Get today's date
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch bookings
      const allBookings = await getAllBookings();
      const bookings = Array.isArray(allBookings) ? allBookings : [];

      // ── Check-Ins tab ──
      // Show ALL bookings whose status is checked_in (regardless of checkInTime).
      // Guests may be checked in via status dropdown OR via the dedicated check-in flow.
      const checkIns = bookings.filter((booking) => {
        return booking.status === "checked_in";
      });

      // ── Check-Outs tab ──
      // Show ALL bookings whose status is checked_out.
      const checkOuts = bookings.filter((booking) => {
        return booking.status === "checked_out";
      });

      console.log("[Check-In/Out] Today:", today);
      console.log("[Check-In/Out] All bookings from API:", bookings.length);
      console.log(
        "[Check-In/Out] Check-ins (status=checked_in):",
        checkIns.length,
        checkIns.map((b) => ({
          id: b._id || b.id,
          status: b.status,
          checkInTime: b.checkInTime || "not set",
        }))
      );
      console.log(
        "[Check-In/Out] Check-outs (status=checked_out):",
        checkOuts.length,
        checkOuts.map((b) => ({
          id: b._id || b.id,
          status: b.status,
          checkOutTime: b.checkOutTime || "not set",
        }))
      );

      setTodaysCheckIns(checkIns);
      setTodaysCheckOuts(checkOuts);
    } catch (error) {
      // Use centralized error handler - auto-redirects on TENANT_REQUIRED
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
      const response = await checkInBooking(bookingId, checkInData);
      const updatedBooking = response?.data || response?.booking || response;
      console.log("[Check-In] Response →", { bookingId, checkInTime: updatedBooking?.checkInTime, status: updatedBooking?.status });

      toast.success("Guest checked in successfully!", { id: toastId });
      setCheckInModalOpen(false);
      setSelectedBooking(null);
      loadBookings(); // Reload to update lists
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
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Check-In / Check-Out</h1>
            <p className="text-slate-600 mt-1">Manage today's arrivals and departures</p>
          </div>
        </div>

        <button
          onClick={() => loadBookings()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Checked In</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{todaysCheckIns.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Checked Out</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{todaysCheckOuts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("checkin")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "checkin"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Check-Ins ({todaysCheckIns.length})
          </button>

          <button
            onClick={() => setActiveTab("checkout")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "checkout"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Check-Outs ({todaysCheckOuts.length})
          </button>
        </div>
      </div>

      {/* Check-Ins List */}
      {activeTab === "checkin" && (
        <div className="space-y-3">
          {todaysCheckIns.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">All Clear!</h3>
              <p className="text-slate-600">No checked-in guests at this time.</p>
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
                  className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                          {guest?.name?.[0]?.toUpperCase() || "G"}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {guest?.name || "Guest"}
                          </h3>
                          <p className="text-sm text-slate-600">{guest?.phone || guest?.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Property</p>
                          <p className="font-medium text-slate-900">{property?.title || "N/A"}</p>
                        </div>
                        {room && (
                          <div>
                            <p className="text-slate-500">Room</p>
                            <p className="font-medium text-slate-900">Room {room.roomNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-500">Checked In</p>
                          <p className="font-medium text-slate-900">
                            {booking.checkInTime
                              ? new Date(booking.checkInTime).toLocaleString("en-US", {
                                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(booking.amount, booking.currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenCheckOut(booking)}
                      className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
                    >
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
        <div className="space-y-3">
          {todaysCheckOuts.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">All Clear!</h3>
              <p className="text-slate-600">No checked-out guests at this time.</p>
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
                  className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                          {guest?.name?.[0]?.toUpperCase() || "G"}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {guest?.name || "Guest"}
                          </h3>
                          <p className="text-sm text-slate-600">{guest?.phone || guest?.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Property</p>
                          <p className="font-medium text-slate-900">{property?.title || "N/A"}</p>
                        </div>
                        {room && (
                          <div>
                            <p className="text-slate-500">Room</p>
                            <p className="font-medium text-slate-900">Room {room.roomNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-500">Checked Out</p>
                          <p className="font-medium text-slate-900">
                            {booking.checkOutTime
                              ? new Date(booking.checkOutTime).toLocaleString("en-US", {
                                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(booking.amount, booking.currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className="rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600"
                    >
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
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                {selectedBooking.guest_id?.name}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-600">Property</p>
                  <p className="font-medium text-slate-900">
                    {selectedBooking.property_id?.title}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Amount</p>
                  <p className="font-medium text-slate-900">
                    {formatCurrency(selectedBooking.amount, selectedBooking.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verification Notes (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                value={checkInData.verificationNotes}
                onChange={(e) =>
                  setCheckInData({ ...checkInData, verificationNotes: e.target.value })
                }
                placeholder="ID verified, payment confirmed..."
                disabled={isProcessing}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                ✓ This will mark the booking as checked-in and the room/unit as occupied.
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
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                {selectedBooking.guest_id?.name}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-600">Property</p>
                  <p className="font-medium text-slate-900">
                    {selectedBooking.property_id?.title}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Original Amount</p>
                  <p className="font-medium text-slate-900">
                    {formatCurrency(selectedBooking.amount, selectedBooking.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Final Charges (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                value={checkOutData.finalCharges}
                onChange={(e) =>
                  setCheckOutData({ ...checkOutData, finalCharges: e.target.value })
                }
                placeholder={selectedBooking.amount?.toString()}
                disabled={isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave blank to use original amount. Update if there are additional charges.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Check-Out Notes (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                value={checkOutData.checkoutNotes}
                onChange={(e) =>
                  setCheckOutData({ ...checkOutData, checkoutNotes: e.target.value })
                }
                placeholder="No damages, room left clean..."
                disabled={isProcessing}
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-900">
                ✓ This will mark the booking as checked-out, set room/unit to dirty, and create a housekeeping task.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
