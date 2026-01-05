"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import PageLoader from "@/components/common/PageLoader";
import IdCardGallery from "@/components/common/IdCardGallery";
import {
  getAllBookings,
  updateBookingStatus,
  updateBookingPaymentStatus,
  deleteBooking,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

const getBookingId = (booking) => booking.id || booking._id;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

const calculatePeriod = (startDate, endDate) => {
  if (!startDate || !endDate) return "N/A";

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Same day";
  if (diffDays === 1) return "1 night";
  if (diffDays < 7) return `${diffDays} nights`;
  if (diffDays < 14) return "1 week";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 60) return "1 month";
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "checked-in":
      return "bg-green-100 text-green-700";
    case "checked-out":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "partially-paid":
      return "bg-amber-100 text-amber-700";
    case "refunded":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-rose-100 text-rose-700";
  }
};

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // SEO
  useSEO({
    title: booking ? `Booking - ${booking.guest_id?.name || 'Guest'} | Zuha Host` : "Booking Details | Zuha Host",
    description: "View and manage booking details, guest information, and payment status.",
    keywords: "booking details, reservation details, guest information",
  });

  useEffect(() => {
    if (!isAuthenticated || !bookingId) return;

    const loadBooking = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const bookings = await getAllBookings();
        const bookingsArray = Array.isArray(bookings) ? bookings : [];
        const foundBooking = bookingsArray.find(
          (b) => getBookingId(b) === bookingId
        );

        if (!foundBooking) {
          setError("Booking not found");
        } else {
          setBooking(foundBooking);
        }
      } catch (err) {
        setError(err.message || "Failed to load booking");
        console.error("Error loading booking:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [isAuthenticated, bookingId]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setBooking({ ...booking, status: newStatus });
      toast.success("Booking status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handlePaymentStatusChange = async (newStatus) => {
    try {
      await updateBookingPaymentStatus(bookingId, newStatus);
      setBooking({ ...booking, payment_status: newStatus });
      toast.success("Payment status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update payment status");
    }
  };

  const handleDeleteBooking = async () => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      await deleteBooking(bookingId);
      toast.success("Booking deleted successfully");
      setTimeout(() => {
        router.push("/bookings");
      }, 1000);
    } catch (err) {
      toast.error(err.message || "Failed to delete booking");
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading booking..." />;
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Toaster position="top-right" />
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">Booking Not Found</h1>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          {error || "This booking could not be found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
        >
          <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">Booking Details</h1>
          <p className="text-sm text-slate-600 mt-1">View and manage booking information</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        {/* Guest & Property Info */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Guest & Property
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                  {booking.guest_id?.name?.charAt(0)?.toUpperCase() || "G"}
                </div>
                <div>
                  <span className="text-xs text-slate-500">Guest</span>
                  <p className="text-sm font-medium text-slate-800">
                    {booking.guest_id?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Email:</span>
                  <p className="text-sm text-slate-700">
                    {booking.guest_id?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Phone:</span>
                  <p className="text-sm text-slate-700">
                    {booking.guest_id?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <span className="text-xs text-slate-500">Property</span>
                <p className="text-lg font-semibold text-slate-800">
                  {booking.property_id?.title || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Address:</span>
                  <p className="text-sm text-slate-700">
                    {booking.property_id?.address || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Location:</span>
                  <p className="text-sm text-slate-700">
                    {booking.property_id?.location || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Booking Details
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Check In</span>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(booking.start_date)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Check Out</span>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(booking.end_date)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Duration</span>
              <p className="text-sm font-medium text-slate-800">
                {calculatePeriod(booking.start_date, booking.end_date)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Number of Guests</span>
              <p className="text-sm font-medium text-slate-800">
                {booking.numberOfGuests || 1}{" "}
                {(booking.numberOfGuests || 1) === 1 ? "guest" : "guests"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Amount</span>
              <p className="text-sm font-medium text-slate-800">
                ${booking.amount || 0}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Discount</span>
              <p className="text-sm font-medium text-slate-800">
                {booking.discount || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Update Status
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500 block mb-2">
                Booking Status
              </label>
              <select
                className={`w-full rounded-lg px-4 py-3 text-sm font-medium border-0 ${getStatusColor(
                  booking.status || "pending"
                )}`}
                value={booking.status || "pending"}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-2">
                Payment Status
              </label>
              <select
                className={`w-full rounded-lg px-4 py-3 text-sm font-medium border-0 ${getPaymentStatusColor(
                  booking.payment_status || "unpaid"
                )}`}
                value={booking.payment_status || "unpaid"}
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially-paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* ID Cards Gallery */}
        {booking.guestIdCards && booking.guestIdCards.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Guest ID Cards
            </h4>
            <IdCardGallery idCards={booking.guestIdCards || []} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => router.push("/bookings")}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Bookings
          </button>
          <button
            onClick={handleDeleteBooking}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 active:bg-rose-800 transition-colors"
          >
            Delete Booking
          </button>
        </div>
      </div>
    </div>
  );
}

