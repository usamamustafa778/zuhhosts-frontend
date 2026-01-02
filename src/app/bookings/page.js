"use client";

import { useState, useEffect } from "react";
import { UserPlus, X, Calendar, Eye } from "lucide-react";
import toast from "react-hot-toast";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import BookingCalendar from "@/components/modules/BookingCalendar";
import FileUpload from "@/components/common/FileUpload";
import IdCardGallery from "@/components/common/IdCardGallery";
import PageLoader from "@/components/common/PageLoader";
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
  numberOfGuests: "1",
};

const getBookingId = (booking) => booking.id || booking._id;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  
  // Format: "Tue, Jan 1" or "Sat, Jan 5"
  return date.toLocaleDateString('en-US', options);
};

const formatDateForInput = (dateString) => {
  return dateString ? dateString.split("T")[0] : "";
};

const formatErrorMessage = (error) => {
  if (!error) return "An error occurred";
  
  const message = error.message || error.toString();
  
  // Extract the actual validation message if it follows the pattern "Validation failed: field: message"
  const validationMatch = message.match(/Validation failed: .+?: (.+)/);
  if (validationMatch) {
    return validationMatch[1];
  }
  
  // If it's just "Validation failed: message" without field
  if (message.startsWith("Validation failed: ")) {
    return message.replace("Validation failed: ", "");
  }
  
  return message;
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
  const [createIdCardFiles, setCreateIdCardFiles] = useState([]);
  const [editIdCardFiles, setEditIdCardFiles] = useState([]);
  const [viewBooking, setViewBooking] = useState(null);

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
    
    const toastId = toast.loading("Creating booking...");
    
    try {
      setError(null);
      let guestId = createForm.guest_id;

      if (isCreatingNewGuest) {
        if (!newGuestForm.name || !newGuestForm.phone) {
          const errorMsg = "Please fill in guest name and phone number";
          setError(errorMsg);
          toast.error(errorMsg, { id: toastId });
          return;
        }
        const newGuest = await createGuest(newGuestForm);
        guestId = newGuest.id || newGuest._id;
        setGuestsData((prev) => [...prev, newGuest]);
      } else if (!guestId) {
        const errorMsg = "Please select a guest";
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
        return;
      }

      // Validate numberOfGuests
      const numberOfGuests = parseInt(createForm.numberOfGuests) || 1;
      if (numberOfGuests < 1) {
        const errorMsg = "Number of guests must be at least 1";
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
        return;
      }

      // If files are present, use FormData, otherwise use JSON
      if (createIdCardFiles.length > 0) {
        const formData = new FormData();
        formData.append('property_id', createForm.property_id);
        formData.append('guest_id', guestId);
        formData.append('start_date', createForm.start_date);
        formData.append('end_date', createForm.end_date);
        formData.append('amount', createForm.amount);
        formData.append('discount', createForm.discount || '0');
        formData.append('payment_status', createForm.payment_status || 'unpaid');
        formData.append('numberOfGuests', numberOfGuests.toString());

        // Append all ID card files
        createIdCardFiles.forEach(file => {
          formData.append('guestIdCards', file);
        });

        const newBooking = await createBooking(formData);
        setBookingsData((prev) => [...prev, newBooking]);
      } else {
        const newBooking = await createBooking({ 
          ...createForm, 
          guest_id: guestId,
          numberOfGuests
        });
        setBookingsData((prev) => [...prev, newBooking]);
      }

      toast.success("Booking created successfully!", { id: toastId });
      setCreateOpen(false);
      setCreateForm(INITIAL_FORM_STATE);
      setCreateIdCardFiles([]);
      setIsCreatingNewGuest(false);
      setNewGuestForm({ name: "", phone: "" });
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleUpdateBooking = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    
    if (!selectedBooking) return;

    const toastId = toast.loading("Updating booking...");

    try {
      setError(null);
      const bookingId = getBookingId(selectedBooking);

      // Validate numberOfGuests
      const numberOfGuests = parseInt(editForm.numberOfGuests) || 1;
      if (numberOfGuests < 1) {
        const errorMsg = "Number of guests must be at least 1";
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
        return;
      }

      // If files are present, use FormData, otherwise use JSON
      if (editIdCardFiles.length > 0) {
        const formData = new FormData();
        formData.append('property_id', editForm.property_id);
        formData.append('guest_id', editForm.guest_id);
        formData.append('start_date', editForm.start_date);
        formData.append('end_date', editForm.end_date);
        formData.append('amount', editForm.amount);
        formData.append('discount', editForm.discount || '0');
        formData.append('payment_status', editForm.payment_status || 'unpaid');
        formData.append('numberOfGuests', numberOfGuests.toString());

        // Append all ID card files (replaces existing ones)
        editIdCardFiles.forEach(file => {
          formData.append('guestIdCards', file);
        });

        const updatedBooking = await updateBooking(bookingId, formData);
        setBookingsData((prev) =>
          prev.map((booking) =>
            getBookingId(booking) === bookingId ? updatedBooking : booking
          )
        );
      } else {
        const updatedBooking = await updateBooking(bookingId, { 
          ...editForm,
          numberOfGuests
        });
        setBookingsData((prev) =>
          prev.map((booking) =>
            getBookingId(booking) === bookingId ? updatedBooking : booking
          )
        );
      }

      toast.success("Booking updated successfully!", { id: toastId });
      setSelectedBooking(null);
      setEditForm(INITIAL_FORM_STATE);
      setEditIdCardFiles([]);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    const toastId = toast.loading("Deleting booking...");

    try {
      setError(null);
      await deleteBooking(bookingId);
      setBookingsData((prev) =>
        prev.filter((booking) => getBookingId(booking) !== bookingId)
      );
      toast.success("Booking deleted successfully!", { id: toastId });
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    const toastId = toast.loading("Updating status...");

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
      toast.success("Booking status updated!", { id: toastId });
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handlePaymentStatusChange = async (bookingId, newPaymentStatus) => {
    const toastId = toast.loading("Updating payment status...");

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
      toast.success("Payment status updated!", { id: toastId });
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
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
      numberOfGuests: booking.numberOfGuests || "1",
    });
    setEditIdCardFiles([]);
  };

  const closeEditModal = () => {
    setSelectedBooking(null);
    setEditForm(INITIAL_FORM_STATE);
    setEditIdCardFiles([]);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateForm(INITIAL_FORM_STATE);
    setCreateIdCardFiles([]);
    setIsCreatingNewGuest(false);
    setNewGuestForm({ name: "", phone: "" });
  };

  const openViewModal = (booking) => {
    setViewBooking(booking);
  };

  const closeViewModal = () => {
    setViewBooking(null);
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading bookings..." />;
  }

  const bookingCalendar = generateCalendarData(bookingsData);

  const tableRows = bookingsData.map((booking, index) => {
    const bookingId = getBookingId(booking) || `booking-${index}`;
    const guestName = booking.guest_id?.name || "N/A";
    const propertyTitle = booking.property_id?.title || "N/A";
    const startDate = formatDate(booking.start_date);
    const endDate = formatDate(booking.end_date);
    const period = calculatePeriod(booking.start_date, booking.end_date);
    const numberOfGuests = booking.numberOfGuests || 1;
    const idCardsCount = booking.guestIdCards?.length || 0;

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
        <div key={`guests-${bookingId}`} className="text-sm text-slate-700">
          {numberOfGuests} {numberOfGuests === 1 ? 'guest' : 'guests'}
        </div>,
        <div key={`idcards-${bookingId}`} className="text-sm text-slate-700">
          {idCardsCount > 0 ? (
            <button
              onClick={() => openViewModal(booking)}
              className="text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
            >
              {idCardsCount} ID card{idCardsCount !== 1 ? 's' : ''}
            </button>
          ) : (
            <span className="text-slate-400 italic">None</span>
          )}
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
            className="text-sm text-blue-500 underline-offset-2 hover:text-blue-900 hover:underline"
            onClick={() => openViewModal(booking)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
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
        headers={["#", "Guest", "Property", "Check In", "Check Out", "Period", "Guests", "ID Cards", "Status", "Payment", "Amount", ""]}
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
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
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
              <label className="mb-1 block text-xs font-medium text-slate-700">
                # Guests
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={editForm.numberOfGuests}
                onChange={(e) =>
                  setEditForm({ ...editForm, numberOfGuests: e.target.value })
                }
                placeholder="1"
                required
              />
            </div>
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

          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>

          {selectedBooking?.guestIdCards?.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Current ID Cards: {selectedBooking.guestIdCards.length}
              </p>
              <IdCardGallery idCards={selectedBooking.guestIdCards} />
            </div>
          )}

          <div>
            <FileUpload
              label="Update Guest ID Cards (Optional)"
              files={editIdCardFiles}
              onChange={setEditIdCardFiles}
              maxFiles={10}
              maxSizeMB={5}
              helpText="Upload new ID cards to replace existing ones. JPG, PNG, GIF, PDF accepted."
            />
            {editIdCardFiles.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 font-medium">
                ⚠️ Uploading new ID cards will replace all existing ones
              </p>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        title="Add booking"
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        primaryActionLabel="Create booking"
        onPrimaryAction={handleCreateBooking}
      >
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
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
              <label className="mb-1 block text-xs font-medium text-slate-700">
                # Guests
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.numberOfGuests}
                onChange={(e) =>
                  setCreateForm({ ...createForm, numberOfGuests: e.target.value })
                }
                placeholder="1"
                required
              />
            </div>
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

          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>

          <div>
            <FileUpload
              label="Guest ID Cards (Optional)"
              files={createIdCardFiles}
              onChange={setCreateIdCardFiles}
              maxFiles={10}
              maxSizeMB={5}
              helpText="Upload up to 10 ID cards. JPG, PNG, GIF, PDF accepted. Max 5MB each."
            />
          </div>
        </form>
      </Modal>

      <Modal
        title="Booking Details"
        description="View comprehensive booking information"
        isOpen={Boolean(viewBooking)}
        onClose={closeViewModal}
        size="large"
      >
        {viewBooking && (
          <div className="space-y-6">
            {/* Guest & Property Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Guest Information</h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div>
                    <span className="text-xs text-slate-500">Name:</span>
                    <p className="text-sm font-medium text-slate-800">{viewBooking.guest_id?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Email:</span>
                    <p className="text-sm text-slate-700">{viewBooking.guest_id?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Phone:</span>
                    <p className="text-sm text-slate-700">{viewBooking.guest_id?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Property Information</h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div>
                    <span className="text-xs text-slate-500">Property:</span>
                    <p className="text-sm font-medium text-slate-800">{viewBooking.property_id?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Location:</span>
                    <p className="text-sm text-slate-700">{viewBooking.property_id?.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Booking Details</h4>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Check In</span>
                  <p className="text-sm font-medium text-slate-800">{formatDate(viewBooking.start_date)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Check Out</span>
                  <p className="text-sm font-medium text-slate-800">{formatDate(viewBooking.end_date)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Duration</span>
                  <p className="text-sm font-medium text-slate-800">{calculatePeriod(viewBooking.start_date, viewBooking.end_date)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Number of Guests</span>
                  <p className="text-sm font-medium text-slate-800">{viewBooking.numberOfGuests || 1} {(viewBooking.numberOfGuests || 1) === 1 ? 'guest' : 'guests'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Amount</span>
                  <p className="text-sm font-medium text-slate-800">${viewBooking.amount || 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Discount</span>
                  <p className="text-sm font-medium text-slate-800">{viewBooking.discount || 0}%</p>
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-xs text-slate-500 block mb-1">Booking Status</span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(viewBooking.status || "pending")}`}>
                  {viewBooking.status || 'pending'}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-xs text-slate-500 block mb-1">Payment Status</span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(viewBooking.payment_status || "unpaid")}`}>
                  {viewBooking.payment_status || 'unpaid'}
                </span>
              </div>
            </div>

            {/* ID Cards Gallery */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Guest ID Cards</h4>
              <IdCardGallery idCards={viewBooking.guestIdCards || []} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  closeViewModal();
                  openEditModal(viewBooking);
                }}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Edit Booking
              </button>
            </div>
          </div>
        )}
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
