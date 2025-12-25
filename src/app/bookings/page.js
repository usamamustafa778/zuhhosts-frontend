"use client";

import { useState, useEffect } from "react";
import { UserPlus, X, Calendar } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import BookingCalendar from "@/components/modules/BookingCalendar";
import {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  updateBookingPaymentStatus,
  getAllProperties,
  getAllGuests,
  createGuest,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

const INITIAL_FORM_STATE = {
  property_id: "",
  guest_id: "",
  start_date: "",
  end_date: "",
  amount: "",
  discount: "0",
  payment_status: "unpaid",
};

const getBookingId = (booking) => booking.id || booking._id;

const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
};

const formatDateForInput = (dateString) => {
  return dateString ? dateString.split("T")[0] : "";
};

const calculatePeriod = (startDate, endDate) => {
  if (!startDate || !endDate) return "N/A";
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Same day";
  if (diffDays === 1) return "1 day";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 14) return "1 week";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 60) return "1 month";
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
};

const calculateNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return nights || 0;
};

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    "checked-in": "bg-green-100 text-green-700",
    "checked-out": "bg-slate-100 text-slate-700",
    cancelled: "bg-rose-100 text-rose-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
};

const getPaymentStatusColor = (paymentStatus) => {
  const colors = {
    unpaid: "bg-rose-100 text-rose-700",
    "partially-paid": "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    refunded: "bg-slate-100 text-slate-700",
  };
  return colors[paymentStatus] || "bg-slate-100 text-slate-700";
};

const generateCalendarData = (bookingsData) => {
  const bookingCalendarMap = {};
  bookingsData.forEach((booking) => {
    const date = formatDateForInput(booking.start_date);
    if (date) {
      bookingCalendarMap[date] = (bookingCalendarMap[date] || 0) + 1;
    }
  });

  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    return {
      date: dateStr,
      count: bookingCalendarMap[dateStr] || 0,
    };
  });
};

export default function BookingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [bookingsData, setBookingsData] = useState([]);
  const [propertiesData, setPropertiesData] = useState([]);
  const [guestsData, setGuestsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [createForm, setCreateForm] = useState(INITIAL_FORM_STATE);
  const [editForm, setEditForm] = useState(INITIAL_FORM_STATE);
  const [isCreatingNewGuest, setIsCreatingNewGuest] = useState(false);
  const [newGuestForm, setNewGuestForm] = useState({
    name: "",
    phone: "",
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, filterPeriod]);

  useEffect(() => {
    if (createForm.property_id && createForm.start_date && createForm.end_date) {
      const property = propertiesData.find(p => (p._id || p.id) === createForm.property_id);
      if (property?.price) {
        const nights = calculateNights(createForm.start_date, createForm.end_date);
        const baseAmount = property.price * nights;
        const discountPercent = Number(createForm.discount) || 0;
        const discountAmount = (baseAmount * discountPercent) / 100;
        const finalAmount = baseAmount - discountAmount;
        setCreateForm(prev => ({ ...prev, amount: finalAmount }));
      }
    }
  }, [createForm.property_id, createForm.start_date, createForm.end_date, createForm.discount, propertiesData]);

  useEffect(() => {
    if (editForm.property_id && editForm.start_date && editForm.end_date) {
      const property = propertiesData.find(p => (p._id || p.id) === editForm.property_id);
      if (property?.price) {
        const nights = calculateNights(editForm.start_date, editForm.end_date);
        const baseAmount = property.price * nights;
        const discountPercent = Number(editForm.discount) || 0;
        const discountAmount = (baseAmount * discountPercent) / 100;
        const finalAmount = baseAmount - discountAmount;
        setEditForm(prev => ({ ...prev, amount: finalAmount }));
      }
    }
  }, [editForm.property_id, editForm.start_date, editForm.end_date, editForm.discount, propertiesData]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = filterPeriod ? `?period=${filterPeriod}` : "";
      const [bookings, properties, guests] = await Promise.all([
        getAllBookings(params),
        getAllProperties(),
        getAllGuests(),
      ]);

      setBookingsData(Array.isArray(bookings) ? bookings : []);
      setPropertiesData(Array.isArray(properties) ? properties : []);
      setGuestsData(Array.isArray(guests) ? guests : []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    
    try {
      setError(null);
      let guestId = createForm.guest_id;

      if (isCreatingNewGuest) {
        if (!newGuestForm.name || !newGuestForm.phone) {
          setError("Please fill in guest name and phone number");
          return;
        }
        const newGuest = await createGuest(newGuestForm);
        guestId = newGuest.id || newGuest._id;
        setGuestsData((prev) => [...prev, newGuest]);
      } else if (!guestId) {
        setError("Please select a guest");
        return;
      }

      const newBooking = await createBooking({ ...createForm, guest_id: guestId });
      setBookingsData((prev) => [...prev, newBooking]);
      setCreateOpen(false);
      setCreateForm(INITIAL_FORM_STATE);
      setIsCreatingNewGuest(false);
      setNewGuestForm({ name: "", phone: "" });
    } catch (err) {
      setError(err.message || "Failed to create booking");
    }
  };

  const handleUpdateBooking = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    
    if (!selectedBooking) return;

    try {
      setError(null);
      const bookingId = getBookingId(selectedBooking);
      const updatedBooking = await updateBooking(bookingId, editForm);
      setBookingsData((prev) =>
        prev.map((booking) =>
          getBookingId(booking) === bookingId ? updatedBooking : booking
        )
      );
      setSelectedBooking(null);
      setEditForm(INITIAL_FORM_STATE);
    } catch (err) {
      setError(err.message || "Failed to update booking");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      setError(null);
      await deleteBooking(bookingId);
      setBookingsData((prev) =>
        prev.filter((booking) => getBookingId(booking) !== bookingId)
      );
    } catch (err) {
      setError(err.message || "Failed to delete booking");
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setError(null);
      await updateBookingStatus(bookingId, newStatus);
      setBookingsData((prev) =>
        prev.map((booking) =>
          getBookingId(booking) === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update booking status");
    }
  };

  const handlePaymentStatusChange = async (bookingId, newPaymentStatus) => {
    try {
      setError(null);
      await updateBookingPaymentStatus(bookingId, newPaymentStatus);
      setBookingsData((prev) =>
        prev.map((booking) =>
          getBookingId(booking) === bookingId
            ? { ...booking, payment_status: newPaymentStatus }
            : booking
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update payment status");
    }
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setEditForm({
      property_id: booking.property_id?.id || booking.property_id?._id || "",
      guest_id: booking.guest_id?.id || booking.guest_id?._id || "",
      start_date: formatDateForInput(booking.start_date),
      end_date: formatDateForInput(booking.end_date),
      amount: booking.amount || "",
      discount: booking.discount || "0",
      payment_status: booking.payment_status || "unpaid",
    });
  };

  const closeEditModal = () => {
    setSelectedBooking(null);
    setEditForm(INITIAL_FORM_STATE);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateForm(INITIAL_FORM_STATE);
    setIsCreatingNewGuest(false);
    setNewGuestForm({ name: "", phone: "" });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading bookings…
      </div>
    );
  }

  const bookingCalendar = generateCalendarData(bookingsData);

  const tableRows = bookingsData.map((booking, index) => {
    const bookingId = getBookingId(booking) || `booking-${index}`;
    const guestName = booking.guest_id?.name || "N/A";
    const propertyTitle = booking.property_id?.title || "N/A";
    const startDate = formatDate(booking.start_date);
    const endDate = formatDate(booking.end_date);
    const period = calculatePeriod(booking.start_date, booking.end_date);

    return {
      id: bookingId,
      cells: [
        <span key={`id-${bookingId}`} className="text-sm font-medium text-slate-700">
          {index + 1}
        </span>,
        <div
          key={`guest-${bookingId}`}
          className="font-semibold text-slate-800"
        >
          {guestName}
        </div>,
        <div key={`property-${bookingId}`} className="text-sm text-slate-600">
          {propertyTitle}
        </div>,
        <div key={`checkin-${bookingId}`} className="text-sm text-slate-600">
          {startDate}
        </div>,
        <div key={`checkout-${bookingId}`} className="text-sm text-slate-600">
          {endDate}
        </div>,
        <div key={`period-${bookingId}`} className="text-sm text-slate-500 italic">
          {period}
        </div>,
        <div key={`status-${bookingId}`}>
          <select
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
              booking.status || "pending"
            )}`}
            value={booking.status || "pending"}
            onChange={(e) => handleStatusChange(bookingId, e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>,
        <div key={`payment-${bookingId}`}>
          <select
            className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(
              booking.payment_status || "unpaid"
            )}`}
            value={booking.payment_status || "unpaid"}
            onChange={(e) => handlePaymentStatusChange(bookingId, e.target.value)}
          >
            <option value="unpaid">Unpaid</option>
            <option value="partially-paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>,
        <span
          key={`amount-${bookingId}`}
          className="font-semibold text-slate-900"
        >
          ${booking.amount || 0}
        </span>,
        <div key={`actions-${bookingId}`} className="flex gap-2">
          <button
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            onClick={() => openEditModal(booking)}
          >
            Edit
          </button>
          <button
            className="text-sm text-rose-500 underline-offset-2 hover:text-rose-900 hover:underline"
            onClick={() => handleDeleteBooking(bookingId)}
          >
            Delete
          </button>
        </div>,
      ],
    };
  });

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Bookings</h1>

        <div className="flex gap-2">
          <button
            className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:shadow-sm cursor-pointer"
            onClick={() => setCreateOpen(true)}
          >
            Add booking
          </button>

          <select
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="">All</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
          </select>

          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>

          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Export CSV
          </button>
        </div>
      </div>

      <DataTable
        headers={["#", "Guest", "Property", "Check In", "Check Out", "Period", "Status", "Payment", "Amount", ""]}
        rows={tableRows}
      />

      <Modal
        title="Edit booking"
        description="Update booking details without leaving the dashboard."
        isOpen={Boolean(selectedBooking)}
        onClose={closeEditModal}
        primaryActionLabel="Update booking"
        onPrimaryAction={handleUpdateBooking}
      >
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Guest
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.guest_id}
              onChange={(e) =>
                setEditForm({ ...editForm, guest_id: e.target.value })
              }
              required
            >
              <option value="">Select a guest</option>
              {guestsData.map((guest) => (
                <option key={getBookingId(guest)} value={getBookingId(guest)}>
                  {guest.name} ({guest.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Property
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.property_id}
              onChange={(e) =>
                setEditForm({ ...editForm, property_id: e.target.value })
              }
              required
            >
              <option value="">Select a property</option>
              {propertiesData.map((property) => (
                <option
                  key={getBookingId(property)}
                  value={getBookingId(property)}
                >
                  {property.title || property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.start_date}
                onChange={(e) =>
                  setEditForm({ ...editForm, start_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.end_date}
                onChange={(e) =>
                  setEditForm({ ...editForm, end_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Discount (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.discount}
                onChange={(e) =>
                  setEditForm({ ...editForm, discount: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Payment Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.payment_status}
              onChange={(e) =>
                setEditForm({ ...editForm, payment_status: e.target.value })
              }
              required
            >
              <option value="unpaid">Unpaid</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        title="Add booking"
        description="Fast-create booking requests from phone or walk-ins."
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        primaryActionLabel="Create booking"
        onPrimaryAction={handleCreateBooking}
      >
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Guest
            </label>
            
            {!isCreatingNewGuest ? (
              <>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={createForm.guest_id}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, guest_id: e.target.value })
                  }
                >
                  <option value="">Select a guest</option>
                  {guestsData.map((guest) => (
                    <option key={getBookingId(guest)} value={getBookingId(guest)}>
                      {guest.name} ({guest.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewGuest(true)}
                  className="mt-2 flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  Create new guest
                </button>
              </>
            ) : (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">New Guest</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewGuest(false);
                      setNewGuestForm({ name: "", phone: "" });
                    }}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    value={newGuestForm.name}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    value={newGuestForm.phone}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Property
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.property_id}
              onChange={(e) =>
                setCreateForm({ ...createForm, property_id: e.target.value })
              }
              required
            >
              <option value="">Select a property</option>
              {propertiesData.map((property) => (
                <option
                  key={getBookingId(property)}
                  value={getBookingId(property)}
                >
                  {property.title || property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.start_date}
                onChange={(e) =>
                  setCreateForm({ ...createForm, start_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.end_date}
                onChange={(e) =>
                  setCreateForm({ ...createForm, end_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.amount}
                onChange={(e) =>
                  setCreateForm({ ...createForm, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Discount (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.discount}
                onChange={(e) =>
                  setCreateForm({ ...createForm, discount: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Payment Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.payment_status}
              onChange={(e) =>
                setCreateForm({ ...createForm, payment_status: e.target.value })
              }
              required
            >
              <option value="unpaid">Unpaid</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        title="Booking Calendar"
        description="View booking activity and occupancy at a glance"
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      >
        <div className="py-4">
          <BookingCalendar data={bookingCalendar} />
        </div>
      </Modal>
    </div>
  );
}
