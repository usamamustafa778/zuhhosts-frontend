"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import BookingCalendar from "@/components/modules/BookingCalendar";
import { 
  getAllBookings, 
  createBooking, 
  updateBooking, 
  deleteBooking,
  getAllProperties,
  getAllGuests 
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

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

  // Form state for create modal
  const [createForm, setCreateForm] = useState({
    property_id: "",
    guest_id: "",
    start_date: "",
    end_date: "",
    amount: ""
  });

  // Form state for edit modal
  const [editForm, setEditForm] = useState({
    property_id: "",
    guest_id: "",
    start_date: "",
    end_date: "",
    amount: ""
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, filterPeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query params for filtering
      const params = filterPeriod ? `?period=${filterPeriod}` : "";
      
      const [bookings, properties, guests] = await Promise.all([
        getAllBookings(params),
        getAllProperties(),
        getAllGuests()
      ]);
      
      setBookingsData(Array.isArray(bookings) ? bookings : []);
      setPropertiesData(Array.isArray(properties) ? properties : []);
      setGuestsData(Array.isArray(guests) ? guests : []);
    } catch (err) {
      setError(err.message || "Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const newBooking = await createBooking(createForm);
      setBookingsData((prev) => [...prev, newBooking]);
      setCreateOpen(false);
      setCreateForm({
        property_id: "",
        guest_id: "",
        start_date: "",
        end_date: "",
        amount: ""
      });
    } catch (err) {
      setError(err.message || "Failed to create booking");
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    try {
      setError(null);
      const bookingId = selectedBooking.id || selectedBooking._id;
      const updatedBooking = await updateBooking(bookingId, editForm);
      setBookingsData((prev) =>
        prev.map((booking) => {
          const id = booking.id || booking._id;
          return id === bookingId ? updatedBooking : booking;
        })
      );
      setSelectedBooking(null);
      setEditForm({
        property_id: "",
        guest_id: "",
        start_date: "",
        end_date: "",
        amount: ""
      });
    } catch (err) {
      setError(err.message || "Failed to update booking");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      setError(null);
      await deleteBooking(bookingId);
      setBookingsData((prev) => prev.filter((booking) => {
        const id = booking.id || booking._id;
        return id !== bookingId;
      }));
    } catch (err) {
      setError(err.message || "Failed to delete booking");
    }
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setEditForm({
      property_id: booking.property_id?.id || booking.property_id?._id || "",
      guest_id: booking.guest_id?.id || booking.guest_id?._id || "",
      start_date: booking.start_date ? booking.start_date.split("T")[0] : "",
      end_date: booking.end_date ? booking.end_date.split("T")[0] : "",
      amount: booking.amount || ""
    });
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

  // Transform bookings data for calendar view - aggregate by date and count
  const bookingCalendarMap = {};
  bookingsData.forEach((booking) => {
    const date = booking.start_date ? booking.start_date.split("T")[0] : null;
    if (date) {
      bookingCalendarMap[date] = (bookingCalendarMap[date] || 0) + 1;
    }
  });
  
  // Get next 7 days from today
  const today = new Date();
  const bookingCalendar = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr,
      count: bookingCalendarMap[dateStr] || 0
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Reservations
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">
            Table + calendar view for quick occupancy planning.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="15days">Last 15 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
          </select>
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={() => setCreateOpen(true)}
          >
            Add booking
          </button>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Export CSV
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <DataTable
          headers={["ID", "Guest", "Property", "Dates", "Amount", ""]}
          rows={bookingsData.map((booking, index) => {
            const bookingId = booking.id || booking._id || `booking-${index}`;
            const guestName = booking.guest_id?.name || "N/A";
            const propertyTitle = booking.property_id?.title || "N/A";
            const startDate = booking.start_date ? new Date(booking.start_date).toLocaleDateString() : "N/A";
            const endDate = booking.end_date ? new Date(booking.end_date).toLocaleDateString() : "N/A";
            
            return {
              id: bookingId,
              cells: [
                <span key={`id-${bookingId}`} className="text-xs text-slate-500">
                  {bookingId.slice(-8)}
                </span>,
                <div key={`guest-${bookingId}`} className="font-semibold text-slate-800">
                  {guestName}
                </div>,
                <div key={`property-${bookingId}`} className="text-sm text-slate-600">
                  {propertyTitle}
                </div>,
                <div key={`dates-${bookingId}`} className="text-sm text-slate-600">
                  {startDate} → {endDate}
                </div>,
                <span key={`amount-${bookingId}`} className="font-semibold text-slate-900">
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
          })}
        />
        <BookingCalendar data={bookingCalendar} />
      </section>

      <Modal
        title="Edit booking"
        description="Update booking details without leaving the dashboard."
        isOpen={Boolean(selectedBooking)}
        onClose={() => {
          setSelectedBooking(null);
          setEditForm({
            property_id: "",
            guest_id: "",
            start_date: "",
            end_date: "",
            amount: ""
          });
        }}
        primaryActionLabel="Update booking"
        onPrimaryAction={handleUpdateBooking}
      >
        <form onSubmit={handleUpdateBooking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Guest
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.guest_id}
              onChange={(e) => setEditForm({ ...editForm, guest_id: e.target.value })}
              required
            >
              <option value="">Select a guest</option>
              {guestsData.map((guest) => (
                <option key={guest.id || guest._id} value={guest.id || guest._id}>
                  {guest.name} ({guest.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.property_id}
              onChange={(e) => setEditForm({ ...editForm, property_id: e.target.value })}
              required
            >
              <option value="">Select a property</option>
              {propertiesData.map((property) => (
                <option key={property.id || property._id} value={property.id || property._id}>
                  {property.title || property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.start_date}
                onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.end_date}
                onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        title="Add booking"
        description="Fast-create booking requests from phone or walk-ins."
        isOpen={isCreateOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateForm({
            property_id: "",
            guest_id: "",
            start_date: "",
            end_date: "",
            amount: ""
          });
        }}
        primaryActionLabel="Create booking"
        onPrimaryAction={handleCreateBooking}
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Guest
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.guest_id}
              onChange={(e) => setCreateForm({ ...createForm, guest_id: e.target.value })}
              required
            >
              <option value="">Select a guest</option>
              {guestsData.map((guest) => (
                <option key={guest.id || guest._id} value={guest.id || guest._id}>
                  {guest.name} ({guest.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.property_id}
              onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}
              required
            >
              <option value="">Select a property</option>
              {propertiesData.map((property) => (
                <option key={property.id || property._id} value={property.id || property._id}>
                  {property.title || property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.start_date}
                onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.end_date}
                onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

