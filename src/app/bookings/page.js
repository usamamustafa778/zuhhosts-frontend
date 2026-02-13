"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Calendar, Eye } from "lucide-react";
import toast from "react-hot-toast";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import BookingCalendar from "@/components/modules/BookingCalendar";
import IdCardGallery from "@/components/common/IdCardGallery";
import PageLoader from "@/components/common/PageLoader";
import Combobox from "@/components/common/Combobox";
import PhoneInput from "@/components/common/PhoneInput";
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
  updateGuest,
  getCurrencies,
  getRooms,
} from "@/lib/api";
import { getDefaultCurrency, formatCurrency, getCurrencyMap } from "@/utils/currencyUtils";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

const getInitialFormState = () => ({
  property_id: "",
  guest_id: "",
  roomId: "",
  start_date: "",
  end_date: "",
  amount: "",
  currency: getDefaultCurrency(),
  discount: "0",
  payment_status: "unpaid",
  numberOfGuests: "1",
  bookingSource: "walkin",
  otaReference: "",
  guest_name: "",
  guest_phone: "",
  guest_id_card: "",
});

const getBookingId = (booking) => booking.id || booking._id;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  const options = { weekday: "short", month: "short", day: "numeric" };

  // Format: "Tue, Jan 1" or "Sat, Jan 5"
  return date.toLocaleDateString("en-US", options);
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
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""
    }`;
};

const calculateNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return nights || 0;
};

const formatAmount = (amount, currency = null) => {
  return formatCurrency(amount, currency);
};

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked In", value: "checked_in" },
  { label: "Checked Out", value: "checked_out" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No Show", value: "no_show" },
];

const getStatusLabel = (status) => {
  const found = STATUS_OPTIONS.find((opt) => opt.value === status);
  return found ? found.label : status || "Pending";
};

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    checked_in: "bg-green-100 text-green-700",
    checked_out: "bg-slate-100 text-slate-700",
    cancelled: "bg-rose-100 text-rose-700",
    no_show: "bg-orange-100 text-orange-700",
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

const getSourceColor = (source) => {
  const colors = {
    walkin: "bg-purple-100 text-purple-700",
    airbnb: "bg-pink-100 text-pink-700",
    bookingcom: "bg-blue-100 text-blue-700",
    direct_website: "bg-green-100 text-green-700",
    other: "bg-slate-100 text-slate-700",
  };
  return colors[source] || "bg-slate-100 text-slate-700";
};

const getSourceLabel = (source) => {
  const labels = {
    walkin: "Walk-in",
    airbnb: "Airbnb",
    bookingcom: "Booking.com",
    direct_website: "Direct Website",
    other: "Other",
  };
  return labels[source] || source;
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
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  // SEO
  useSEO({
    title: "Bookings | Zuha Host",
    description: "Manage all your property bookings. View, create, and update reservations for your listings.",
    keywords: "bookings, reservations, guest bookings, manage bookings, booking calendar",
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [bookingsData, setBookingsData] = useState([]);
  const [propertiesData, setPropertiesData] = useState([]);
  const [guestsData, setGuestsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Default to table on desktop, cards on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "cards";
    }
    return "table";
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");
  const [createForm, setCreateForm] = useState(() => getInitialFormState());
  const [editForm, setEditForm] = useState(() => getInitialFormState());
  const [isCreatingNewGuest, setIsCreatingNewGuest] = useState(false);
  const [newGuestForm, setNewGuestForm] = useState({
    name: "",
    phone: "",
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [createRooms, setCreateRooms] = useState([]);
  const [editRooms, setEditRooms] = useState([]);
  const [createIdCardFiles, setCreateIdCardFiles] = useState([]);
  const [editIdCardFiles, setEditIdCardFiles] = useState([]);
  const [createIdCardPreviews, setCreateIdCardPreviews] = useState([]);
  const [editIdCardPreviews, setEditIdCardPreviews] = useState([]);
  const [viewBooking, setViewBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currencies, setCurrencies] = useState([]);

  // Helpers to work with properties
  const getPropertyById = (id) =>
    propertiesData.find((p) => (p._id || p.id) === id);

  const isHotelProperty = (id) => {
    if (!id) return false;
    const property = getPropertyById(id);
    return property?.propertyType === "hotel";
  };

  // Clear roomId when property changes to a non-hotel (avoid stale room selection)
  useEffect(() => {
    if (createForm.property_id && !isHotelProperty(createForm.property_id) && createForm.roomId) {
      setCreateForm((prev) => ({ ...prev, roomId: "" }));
    }
  }, [createForm.property_id]);

  useEffect(() => {
    if (editForm.property_id && !isHotelProperty(editForm.property_id) && editForm.roomId) {
      setEditForm((prev) => ({ ...prev, roomId: "" }));
    }
  }, [editForm.property_id]);

  // Sync currency on mount and when it changes in local storage
  useEffect(() => {
    // Set currency from local storage on mount
    const currentCurrency = getDefaultCurrency();
    setCreateForm((prev) => ({
      ...prev,
      currency: currentCurrency,
    }));

    const handleCurrencyChange = () => {
      const newCurrency = getDefaultCurrency();
      setCreateForm((prev) => ({
        ...prev,
        currency: newCurrency,
      }));
    };

    // Listen for currency changes
    window.addEventListener("currency-change", handleCurrencyChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "defaultCurrency") {
        handleCurrencyChange();
      }
    });

    return () => {
      window.removeEventListener("currency-change", handleCurrencyChange);
    };
  }, []);

  // Cleanup object URLs when previews change or component unmounts
  useEffect(() => {
    return () => {
      (createIdCardPreviews || []).forEach((u) => u && URL.revokeObjectURL(u));
      (editIdCardPreviews || []).forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [createIdCardPreviews, editIdCardPreviews]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, filterPeriod, filterStatus, filterPaymentStatus]);

  // Fetch rooms when create form property changes
  useEffect(() => {
    if (!createForm.property_id) {
      setCreateRooms([]);
      return;
    }
    getRooms(createForm.property_id)
      .then((data) => setCreateRooms(Array.isArray(data) ? data : []))
      .catch(() => setCreateRooms([]));
  }, [createForm.property_id]);

  // Fetch rooms when edit form property changes
  useEffect(() => {
    if (!editForm.property_id) {
      setEditRooms([]);
      return;
    }
    getRooms(editForm.property_id)
      .then((data) => setEditRooms(Array.isArray(data) ? data : []))
      .catch(() => setEditRooms([]));
  }, [editForm.property_id]);

  // Auto-calculate amount for create form
  useEffect(() => {
    if (!createForm.property_id) return;

    // Use selected room's price if available, otherwise property base price
    let pricePerNight = 0;
    if (createForm.roomId && createRooms.length > 0) {
      const selectedRoom = createRooms.find(
        (r) => (r._id || r.id) === createForm.roomId
      );
      pricePerNight = selectedRoom?.basePrice ?? selectedRoom?.price ?? 0;
    }
    if (!pricePerNight) {
      const property = propertiesData.find(
        (p) => (p._id || p.id) === createForm.property_id
      );
      pricePerNight = property?.price ?? property?.basePrice ?? 0;
    }
    if (pricePerNight) {
      const nights =
        createForm.start_date && createForm.end_date
          ? calculateNights(createForm.start_date, createForm.end_date)
          : 1;
      const baseAmount = pricePerNight * nights;
      const discountPercent = Number(createForm.discount) || 0;
      const discountAmount = (baseAmount * discountPercent) / 100;
      const finalAmount = Math.max(0, baseAmount - discountAmount);
      setCreateForm((prev) => ({ ...prev, amount: finalAmount }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createForm.property_id, createForm.roomId, createForm.start_date, createForm.end_date, createForm.discount, propertiesData, createRooms]);

  // Auto-calculate amount for edit form
  useEffect(() => {
    if (!editForm.property_id) return;

    let pricePerNight = 0;
    if (editForm.roomId && editRooms.length > 0) {
      const selectedRoom = editRooms.find(
        (r) => (r._id || r.id) === editForm.roomId
      );
      pricePerNight = selectedRoom?.basePrice ?? selectedRoom?.price ?? 0;
    }
    if (!pricePerNight) {
      const property = propertiesData.find(
        (p) => (p._id || p.id) === editForm.property_id
      );
      pricePerNight = property?.price ?? property?.basePrice ?? 0;
    }
    if (pricePerNight) {
      const nights =
        editForm.start_date && editForm.end_date
          ? calculateNights(editForm.start_date, editForm.end_date)
          : 1;
      const baseAmount = pricePerNight * nights;
      const discountPercent = Number(editForm.discount) || 0;
      const discountAmount = (baseAmount * discountPercent) / 100;
      const finalAmount = Math.max(0, baseAmount - discountAmount);
      setEditForm((prev) => ({ ...prev, amount: finalAmount }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm.property_id, editForm.roomId, editForm.start_date, editForm.end_date, editForm.discount, propertiesData, editRooms]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = [];
      if (filterPeriod) queryParams.push(`period=${filterPeriod}`);
      if (filterStatus) queryParams.push(`status=${filterStatus}`);
      if (filterPaymentStatus)
        queryParams.push(`payment_status=${filterPaymentStatus}`);

      const params = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const [bookings, properties, guests] = await Promise.all([
        getAllBookings(params),
        getAllProperties(),
        getAllGuests(),
      ]);

      setBookingsData(Array.isArray(bookings) ? bookings : []);
      setPropertiesData(Array.isArray(properties) ? properties : []);
      setGuestsData(Array.isArray(guests) ? guests : []);

      // Load currencies from local storage for edit modal
      const currencyMap = getCurrencyMap();
      setCurrencies(Object.entries(currencyMap).map(([code, name]) => ({ code, name })));

      // Set default currency from local storage (ensure it's current)
      const defaultCurrency = getDefaultCurrency();
      setCreateForm((prev) => ({
        ...prev,
        currency: defaultCurrency,
      }));
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
      let guestId = createForm.guest_id || "";

      // If no guest selected but user entered name and phone, create a new guest and use it for the booking
      if (!guestId && (createForm.guest_name?.trim() || createForm.guest_phone?.trim())) {
        const name = (createForm.guest_name || "").trim();
        const phone = (createForm.guest_phone || "").trim();
        if (!name || !phone) {
          const errorMsg = "When adding a new guest, both Name and Phone are required";
          setError(errorMsg);
          toast.error(errorMsg, { id: toastId });
          return;
        }
        try {
          const newGuest = await createGuest({
            name,
            phone,
            idCardNumber: (createForm.guest_id_card || "").trim() || undefined,
          });
          const newGuestId = newGuest.id ?? newGuest._id;
          guestId = newGuestId;
          setGuestsData((prev) => [...prev, newGuest]);
        } catch (guestErr) {
          const errorMsg = formatErrorMessage(guestErr);
          setError(errorMsg);
          toast.error(errorMsg, { id: toastId });
          return;
        }
      }

      // Validate room selection only for hotel properties
      if (isHotelProperty(createForm.property_id) && !createForm.roomId) {
        const errorMsg = "Please select a room";
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

      // If a guest is selected and their name/phone were changed in the quick inputs,
      // update the guest record before creating the booking.
      try {
        const selectedGuest = guestId ? guestsData.find((g) => getBookingId(g) === guestId) : null;
        if (selectedGuest) {
          const updateData = {};
          if ((createForm.guest_name || "") !== (selectedGuest.name || "")) {
            updateData.name = createForm.guest_name || "";
          }
          if ((createForm.guest_phone || "") !== (selectedGuest.phone || "")) {
            updateData.phone = createForm.guest_phone || "";
          }
          if (Object.keys(updateData).length > 0) {
            try {
              const updated = await updateGuest(guestId, updateData);
              setGuestsData((prev) => prev.map((g) => (getBookingId(g) === guestId ? { ...g, ...updated } : g)));
            } catch (uErr) {
              console.error("Failed to update guest before booking:", uErr);
              // Do not block booking creation on guest update failure
            }
          }
        }
      } catch (errCheck) {
        console.error("Error while preparing guest update:", errCheck);
      }

      // If files are present, use FormData, otherwise use JSON
      if (createIdCardFiles.length > 0) {
        const formData = new FormData();
        formData.append("property_id", createForm.property_id);
        if (guestId) formData.append("guest_id", guestId);
        if (isHotelProperty(createForm.property_id) && createForm.roomId) {
          formData.append("roomId", createForm.roomId);
        }
        formData.append("start_date", createForm.start_date);
        formData.append("end_date", createForm.end_date);
        formData.append("amount", createForm.amount);
        formData.append("currency", getDefaultCurrency());
        formData.append(
          "payment_status",
          createForm.payment_status || "unpaid"
        );
        formData.append("numberOfGuests", numberOfGuests.toString());

        // Append all ID card files
        createIdCardFiles.forEach((file) => {
          formData.append("guestIdCards", file);
        });

        const newBooking = await createBooking(formData);
        setBookingsData((prev) => [...prev, newBooking]);

        // Update guest's idCard with the first ID card file
        if (createIdCardFiles.length > 0 && guestId) {
          try {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("luxeboard.authToken")
                : null;
            const guestFormData = new FormData();
            guestFormData.append("idCard", createIdCardFiles[0]);

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/guests/${guestId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: guestFormData,
              }
            );

            if (response.ok) {
              // Refresh guests data
              const updatedGuests = await getAllGuests();
              setGuestsData(Array.isArray(updatedGuests) ? updatedGuests : []);
            }
          } catch (guestErr) {
            console.error("Error updating guest ID card:", guestErr);
            // Don't fail the booking creation if guest update fails
          }
        }
      } else {
        const payload = {
          ...createForm,
          numberOfGuests,
          currency: getDefaultCurrency(),
        };
        if (guestId) payload.guest_id = guestId;
        // Omit roomId for non-hotel properties to avoid sending invalid/empty roomId
        if (!isHotelProperty(createForm.property_id)) {
          delete payload.roomId;
        }
        // Remove guest form-only fields from booking payload
        delete payload.guest_name;
        delete payload.guest_phone;
        delete payload.guest_id_card;
        const newBooking = await createBooking(payload);
        setBookingsData((prev) => [...prev, newBooking]);
      }

      toast.success("Booking created successfully!", { id: toastId });
      setCreateOpen(false);
      setCreateForm(getInitialFormState());
      setCreateIdCardFiles([]);
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

    if (!selectedBooking || isUpdating) return;

    const toastId = toast.loading("Processing booking update...");
    setIsUpdating(true);

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
        formData.append("property_id", editForm.property_id);
        formData.append("guest_id", editForm.guest_id);
        if (isHotelProperty(editForm.property_id) && editForm.roomId) {
          formData.append("roomId", editForm.roomId);
        }
        formData.append("start_date", editForm.start_date);
        formData.append("end_date", editForm.end_date);
        formData.append("amount", editForm.amount);
        formData.append("currency", editForm.currency || getDefaultCurrency());
        formData.append("discount", editForm.discount || "0");
        formData.append("payment_status", editForm.payment_status || "unpaid");
        formData.append("numberOfGuests", numberOfGuests.toString());

        // Append all ID card files (replaces existing ones)
        editIdCardFiles.forEach((file) => {
          formData.append("guestIdCards", file);
        });

        const updatedBooking = await updateBooking(bookingId, formData);
        setBookingsData((prev) =>
          prev.map((booking) =>
            getBookingId(booking) === bookingId ? updatedBooking : booking
          )
        );

        // Update guest's idCard with the first ID card file
        if (editIdCardFiles.length > 0 && editForm.guest_id) {
          try {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("luxeboard.authToken")
                : null;
            const guestFormData = new FormData();
            guestFormData.append("idCard", editIdCardFiles[0]);

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/guests/${editForm.guest_id}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: guestFormData,
              }
            );

            if (response.ok) {
              // Refresh guests data
              const updatedGuests = await getAllGuests();
              setGuestsData(Array.isArray(updatedGuests) ? updatedGuests : []);
            }
          } catch (guestErr) {
            console.error("Error updating guest ID card:", guestErr);
            // Don't fail the booking update if guest update fails
          }
        }
      } else {
        const payload = {
          ...editForm,
          numberOfGuests,
          currency: getDefaultCurrency(),
          discount: "0",
        };
        // Omit roomId for non-hotel properties
        if (!isHotelProperty(editForm.property_id)) {
          delete payload.roomId;
        }
        // Normalize empty guest_id so backend can clear guest
        if (payload.guest_id === "") {
          payload.guest_id = null;
        }
        // Remove guest form-only fields from booking payload
        delete payload.guest_name;
        delete payload.guest_phone;
        delete payload.guest_id_card;
        const updatedBooking = await updateBooking(bookingId, payload);
        setBookingsData((prev) =>
          prev.map((booking) =>
            getBookingId(booking) === bookingId ? updatedBooking : booking
          )
        );
      }

      toast.success("Booking updated successfully!", { id: toastId });
      setSelectedBooking(null);
      setEditForm(getInitialFormState());
      setEditIdCardFiles([]);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsUpdating(false);
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
    console.log("[Booking] Updating status →", { bookingId, newStatus });
    const toastId = toast.loading("Updating status...");

    try {
      setError(null);
      const response = await updateBookingStatus(bookingId, newStatus);
      // Use full backend response to capture checkInTime / checkOutTime etc.
      const updatedBooking = response?.data || response?.booking || response;
      console.log("[Booking] Status update response →", updatedBooking);

      setBookingsData((prev) =>
        prev.map((booking) =>
          getBookingId(booking) === bookingId
            ? { ...booking, ...updatedBooking }
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

  const openEditModal = async (booking) => {
    setSelectedBooking(booking);
    const guest = booking.guest_id;
    setEditForm({
      property_id: booking.property_id?.id || booking.property_id?._id || "",
      guest_id: guest?.id || guest?._id || "",
      roomId: booking.roomId?.id || booking.roomId?._id || booking.roomId || "",
      start_date: formatDateForInput(booking.start_date),
      end_date: formatDateForInput(booking.end_date),
      amount: booking.amount || "",
      currency: getDefaultCurrency(),
      discount: "0",
      payment_status: booking.payment_status || "unpaid",
      numberOfGuests: booking.numberOfGuests || "1",
      guest_name: guest?.name || "",
      guest_phone: guest?.phone || "",
      guest_id_card: guest?.idCardNumber || guest?.id_card || guest?.idCard || guest?.idNumber || "",
    });
    setEditIdCardFiles([]);
  };

  const closeEditModal = () => {
    setSelectedBooking(null);
    setEditForm(getInitialFormState());
    setEditIdCardFiles([]);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateForm(getInitialFormState());
    setCreateIdCardFiles([]);
    setIsCreatingNewGuest(false);
    setNewGuestForm({ name: "", phone: "" });
  };

  const openViewModal = (booking) => {
    const bookingId = getBookingId(booking);
    router.push(`/bookings/${bookingId}`);
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
        <span
          key={`id-${bookingId}`}
          className="text-sm font-medium text-slate-700"
        >
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
        <div
          key={`period-${bookingId}`}
          className="text-sm text-slate-500 italic"
        >
          {period}
        </div>,
        <div key={`guests-${bookingId}`} className="text-sm text-slate-700">
          {numberOfGuests} {numberOfGuests === 1 ? "guest" : "guests"}
        </div>,
        <div key={`idcards-${bookingId}`} className="text-sm text-slate-700">
          {idCardsCount > 0 ? (
            <button
              onClick={() => openViewModal(booking)}
              className="text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
            >
              {idCardsCount} ID card{idCardsCount !== 1 ? "s" : ""}
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
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>,
        <div key={`payment-${bookingId}`}>
          <select
            className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(
              booking.payment_status || "unpaid"
            )}`}
            value={booking.payment_status || "unpaid"}
            onChange={(e) =>
              handlePaymentStatusChange(bookingId, e.target.value)
            }
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
          {formatAmount(booking.amount, booking.currency)}
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
    <div className="mx-auto max-w-7xl space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
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
              Bookings
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Filters Button */}
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {(filterPeriod || filterStatus || filterPaymentStatus) && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-slate-900 rounded-full">
                  {[filterPeriod, filterStatus, filterPaymentStatus].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex rounded-full border border-slate-200 p-1">
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "cards"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
                onClick={() => setViewMode("cards")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
                onClick={() => setViewMode("table")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            <button
              className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:shadow-sm cursor-pointer"
              onClick={() => setCreateOpen(true)}
            >
              Add
            </button>

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>

            <button className="hidden sm:inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Export
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
              <button
                className="text-sm text-slate-600 hover:text-slate-900 underline"
                onClick={() => {
                  setFilterPeriod("");
                  setFilterStatus("");
                  setFilterPaymentStatus("");
                }}
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Period Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Period
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                >
                  <option value="">All Periods</option>
                  <option value="today">Today</option>
                  <option value="current">Current</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Status
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Payment Status
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                >
                  <option value="">All Payment Status</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially-paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {bookingsData.length}
                </span>{" "}
                booking{bookingsData.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {bookingsData.map((booking, index) => {
            const bookingId = getBookingId(booking) || `booking-${index}`;
            const guestName = booking.guest_id?.name || "N/A";
            const propertyTitle = booking.property_id?.title || "N/A";
            const startDate = formatDate(booking.start_date);
            const endDate = formatDate(booking.end_date);
            const numberOfGuests = booking.numberOfGuests || 1;
            const idCardsCount = booking.guestIdCards?.length || 0;

            return (
              <div
                key={bookingId}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden active:scale-[0.98] transition-transform relative"
              >
                {/* Top Section - Guest & Property */}
                <div
                  className="p-4  from-slate-50 to-white cursor-pointer"
                  onClick={() => openViewModal(booking)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0 w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white text-lg font-bold">
                        {guestName[0]?.toUpperCase() || "G"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {guestName}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {propertyTitle}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 ml-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {formatAmount(booking.amount, booking.currency)}
                        </div>
                        <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getPaymentStatusColor(
                          booking.payment_status || "unpaid"
                        )}`}>
                          {booking.payment_status === "partially-paid" ? "Partial" : booking.payment_status || "unpaid"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Dates & Info */}
                <div
                  className="px-4 py-3 border-t border-slate-100 cursor-pointer relative"
                  onClick={() => openViewModal(booking)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">📅</span>
                        <span className="font-medium text-slate-700">{startDate}</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <span className="font-medium text-slate-700">{endDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">👥</span>
                        <span className="font-medium text-slate-700">{numberOfGuests}</span>
                      </div>
                      {idCardsCount > 0 && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <span>📄</span>
                          <span className="font-medium">{idCardsCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Edit Button */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      booking.status || "pending"
                    )}`}>
                      {getStatusLabel(booking.status)}
                    </span>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(booking);
                      }}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Edit booking"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <DataTable
          headers={[
            "#",
            "Guest",
            "Property",
            "Check In",
            "Check Out",
            "Period",
            "Guests",
            "ID Cards",
            "Status",
            "Payment",
            "Amount",
            "",
          ]}
          rows={tableRows}
        />
      )}

      <Modal
        title="Edit booking"
        description="Update booking details without leaving the dashboard."
        isOpen={Boolean(selectedBooking)}
        onClose={closeEditModal}
        primaryActionLabel={isUpdating ? "Processing..." : "Update booking"}
        onPrimaryAction={handleUpdateBooking}
        disabled={isUpdating}
      >
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Guest ID card no
              </label>
              <Combobox
                value={editForm.guest_id}
                onChange={(value) => {
                  const sel = guestsData.find((g) => getBookingId(g) === value);
                  if (sel) {
                    setEditForm({
                      ...editForm,
                      guest_id: value,
                      guest_name: sel.name || "",
                      guest_phone: sel.phone || "",
                      guest_id_card: sel.idCardNumber || sel.id_card || sel.idCard || sel.idNumber || "",
                    });
                  } else {
                    setEditForm({ ...editForm, guest_id: value, guest_name: "", guest_phone: "", guest_id_card: "" });
                  }
                }}
                freeTextValue={editForm.guest_id_card}
                onInputChange={(text) => setEditForm((prev) => ({ ...prev, guest_id_card: text }))}
                options={guestsData}
                getOptionLabel={(guest) =>
                  guest.idCardNumber || guest.id_card || guest.idCard || guest.idNumber || guest.name || ""
                }
                getOptionValue={(guest) => getBookingId(guest)}
                placeholder="Search by ID card or enter full ID card number"
                noOptionsMessage="No guests found"
                showDropdownOnlyOnMatch
                hideChevron
                disabled={isUpdating}
              />
              <p className="mt-1 text-xs text-slate-500">Select a guest to auto-fill below</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    value={editForm.guest_name}
                    onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })}
                    placeholder="Guest full name"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone No</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    value={editForm.guest_phone}
                    onChange={(e) => setEditForm({ ...editForm, guest_phone: e.target.value })}
                    placeholder="123 456 7890"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                # Guests
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={editForm.numberOfGuests}
                onChange={(e) =>
                  setEditForm({ ...editForm, numberOfGuests: e.target.value })
                }
                placeholder="1"
                required
                disabled={isUpdating}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Property
            </label>
            <Combobox
              value={editForm.property_id}
              onChange={(value) =>
                setEditForm({ ...editForm, property_id: value })
              }
              options={propertiesData}
              getOptionLabel={(property) => property.title || property.name}
              getOptionValue={(property) => getBookingId(property)}
              getOptionDescription={(property) =>
                property.address || property.location
              }
              placeholder="Search property by name, address, or location..."
              required
              noOptionsMessage="No properties found"
              disabled={isUpdating}
            />
          </div>

          {/* Room Selection (only for hotel properties) */}
          {isHotelProperty(editForm.property_id) && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Room *
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={editForm.roomId}
                onChange={(e) =>
                  setEditForm({ ...editForm, roomId: e.target.value })
                }
                disabled={isUpdating}
                required
              >
                <option value="">Select a room</option>
                {editRooms.map((room) => {
                  const rId = room._id || room.id;
                  return (
                    <option key={rId} value={rId}>
                      Room {room.roomNumber} — {room.roomType} — ${room.basePrice ?? room.price ?? 0}/night
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={editForm.start_date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  setEditForm({
                    ...editForm,
                    start_date: selectedDate,
                    // Reset end_date if it's before or equal to the new start_date
                    end_date: editForm.end_date && editForm.end_date <= selectedDate ? "" : editForm.end_date
                  });
                }}
                min="1900-01-01"
                max="2099-12-31"
                required
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={editForm.end_date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  // Validate: end date must be after start date
                  if (editForm.start_date && selectedDate <= editForm.start_date) {
                    toast.error("End date must be at least one day after start date");
                    return;
                  }
                  setEditForm({ ...editForm, end_date: selectedDate });
                }}
                min={
                  editForm.start_date
                    ? (() => {
                        const start = new Date(editForm.start_date);
                        start.setDate(start.getDate() + 1);
                        const year = start.getFullYear();
                        const month = String(start.getMonth() + 1).padStart(2, '0');
                        const day = String(start.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    : "1900-01-01"
                }
                max="2099-12-31"
                required
                disabled={isUpdating || !editForm.start_date}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                placeholder="0.00"
                required
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Payment Status
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={editForm.payment_status}
                onChange={(e) =>
                  setEditForm({ ...editForm, payment_status: e.target.value })
                }
                required
                disabled={isUpdating}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Update Guest ID card
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                // revoke previous preview
                editIdCardPreviews.forEach((u) => u && URL.revokeObjectURL(u));
                if (file) {
                  setEditIdCardFiles([file]);
                  setEditIdCardPreviews([file.type.startsWith("image/") ? URL.createObjectURL(file) : null]);
                } else {
                  setEditIdCardFiles([]);
                  setEditIdCardPreviews([]);
                }
              }}
              disabled={isUpdating}
            />
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG, GIF, PDF (max 5MB)</p>
            {editIdCardPreviews[0] && (
              <div className="mt-2">
                <img
                  src={editIdCardPreviews[0]}
                  alt="ID Card Preview"
                  className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-slate-50"
                />
                <p className="mt-1 text-xs text-green-600">✓ New ID card selected</p>
              </div>
            )}
            {editIdCardFiles.length > 0 && !editIdCardPreviews[0] && (
              <p className="mt-2 text-xs text-green-600">✓ PDF file selected: {editIdCardFiles[0].name}</p>
            )}
            {editIdCardFiles.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 font-medium">⚠️ Uploading a new ID card will replace existing ones</p>
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
                Guest ID Card
              </label>
              <Combobox
                value={createForm.guest_id}
                onChange={(value) => {
                  const sel = guestsData.find((g) => getBookingId(g) === value);
                  if (sel) {
                    setCreateForm({
                      ...createForm,
                      guest_id: value,
                      guest_name: sel.name || "",
                      guest_phone: sel.phone || "",
                      guest_id_card: sel.idCardNumber || sel.id_card || sel.idCard || sel.idNumber || "",
                    });
                  } else {
                    setCreateForm({ ...createForm, guest_id: value, guest_name: "", guest_phone: "", guest_id_card: "" });
                  }
                }}
                freeTextValue={createForm.guest_id_card}
                onInputChange={(text) => setCreateForm((prev) => ({ ...prev, guest_id_card: text }))}
                options={guestsData}
                getOptionLabel={(guest) =>
                  guest.idCardNumber || guest.id_card || guest.idCard || guest.idNumber || guest.name || ""
                }
                getOptionValue={(guest) => getBookingId(guest)}
                placeholder="Search by ID card or enter full ID card number"
                noOptionsMessage="No guests found"
                showDropdownOnlyOnMatch
                hideChevron
              />
              <p className="mt-1 text-xs text-slate-500">Select a guest to auto-fill below, or enter name and phone to create a new guest</p>
              <div className="grid gap-4 sm:grid-cols-2">

              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={createForm.guest_name}
                  onChange={(e) => setCreateForm({ ...createForm, guest_name: e.target.value })}
                  placeholder="Guest full name"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone No</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={createForm.guest_phone}
                  onChange={(e) => setCreateForm({ ...createForm, guest_phone: e.target.value })}
                  placeholder="123 456 7890"
                />
              </div>
              </div>

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
                  setCreateForm({
                    ...createForm,
                    numberOfGuests: e.target.value,
                  })
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
            <Combobox
              value={createForm.property_id}
              onChange={(value) =>
                setCreateForm({ ...createForm, property_id: value })
              }
              options={propertiesData}
              getOptionLabel={(property) => property.title || property.name}
              getOptionValue={(property) => getBookingId(property)}
              getOptionDescription={(property) =>
                property.address || property.location
              }
              placeholder="Search property by name, address, or location..."
              required
              noOptionsMessage="No properties found"
            />
          </div>

          {/* Room Selection (only for hotel properties) */}
          {isHotelProperty(createForm.property_id) && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Room *
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.roomId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, roomId: e.target.value })
                }
                required
              >
                <option value="">Select a room</option>
                {createRooms.map((room) => {
                  const rId = room._id || room.id;
                  return (
                    <option key={rId} value={rId}>
                      Room {room.roomNumber} — {room.roomType} — ${room.basePrice ?? room.price ?? 0}/night
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.start_date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  setCreateForm({
                    ...createForm,
                    start_date: selectedDate,
                    // Reset end_date if it's before or equal to the new start_date
                    end_date: createForm.end_date && createForm.end_date <= selectedDate ? "" : createForm.end_date
                  });
                }}
                min="1900-01-01"
                max="2099-12-31"
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
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  // Validate: end date must be after start date
                  if (createForm.start_date && selectedDate <= createForm.start_date) {
                    toast.error("End date must be at least one day after start date");
                    return;
                  }
                  setCreateForm({ ...createForm, end_date: selectedDate });
                }}
                min={
                  createForm.start_date
                    ? (() => {
                        const start = new Date(createForm.start_date);
                        start.setDate(start.getDate() + 1);
                        const year = start.getFullYear();
                        const month = String(start.getMonth() + 1).padStart(2, '0');
                        const day = String(start.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    : "1900-01-01"
                }
                max="2099-12-31"
                required
                disabled={!createForm.start_date}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Amount *
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
                Payment Status
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.payment_status}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    payment_status: e.target.value,
                  })
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Booking Source *
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.bookingSource}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    bookingSource: e.target.value,
                  })
                }
                required
              >
                <option value="walkin">Walk-in</option>
                <option value="airbnb">Airbnb</option>
                <option value="bookingcom">Booking.com</option>
                <option value="direct_website">Direct Website</option>
                <option value="other">Other</option>
              </select>
            </div>

            {(createForm.bookingSource === "airbnb" ||
              createForm.bookingSource === "bookingcom" ||
              createForm.bookingSource === "other") && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    OTA Reference / Booking ID
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={createForm.otaReference}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        otaReference: e.target.value,
                      })
                    }
                    placeholder="e.g. HMABCD1234"
                  />
                </div>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guest ID card</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                // revoke previous previews
                createIdCardPreviews.forEach((u) => u && URL.revokeObjectURL(u));
                if (file) {
                  setCreateIdCardFiles([file]);
                  setCreateIdCardPreviews([file.type.startsWith("image/") ? URL.createObjectURL(file) : null]);
                } else {
                  setCreateIdCardFiles([]);
                  setCreateIdCardPreviews([]);
                }
              }}
            />
            <p className="mt-1 text-xs text-slate-500">Upload an ID card. JPG, PNG, GIF, PDF accepted. Max 5MB.</p>
            {createIdCardPreviews[0] && (
              <div className="mt-2">
                <img
                  src={createIdCardPreviews[0]}
                  alt="ID Card Preview"
                  className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-slate-50"
                />
                <p className="mt-1 text-xs text-green-600">✓ ID card ready to upload</p>
              </div>
            )}
            {createIdCardFiles.length > 0 && !createIdCardPreviews[0] && (
              <p className="mt-2 text-xs text-green-600">✓ PDF file selected: {createIdCardFiles[0].name}</p>
            )}
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
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Guest Information
                </h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div>
                    <span className="text-xs text-slate-500">Name:</span>
                    <p className="text-sm font-medium text-slate-800">
                      {viewBooking.guest_id?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Email:</span>
                    <p className="text-sm text-slate-700">
                      {viewBooking.guest_id?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Phone:</span>
                    <p className="text-sm text-slate-700">
                      {viewBooking.guest_id?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Property Information
                </h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div>
                    <span className="text-xs text-slate-500">Property:</span>
                    <p className="text-sm font-medium text-slate-800">
                      {viewBooking.property_id?.title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Location:</span>
                    <p className="text-sm text-slate-700">
                      {viewBooking.property_id?.location || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Booking Details
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Check In</span>
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(viewBooking.start_date)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Check Out</span>
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(viewBooking.end_date)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Duration</span>
                  <p className="text-sm font-medium text-slate-800">
                    {calculatePeriod(
                      viewBooking.start_date,
                      viewBooking.end_date
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">
                    Number of Guests
                  </span>
                  <p className="text-sm font-medium text-slate-800">
                    {viewBooking.numberOfGuests || 1}{" "}
                    {(viewBooking.numberOfGuests || 1) === 1
                      ? "guest"
                      : "guests"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Amount</span>
                  <p className="text-sm font-medium text-slate-800">
                    {formatAmount(viewBooking.amount, viewBooking.currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">Discount</span>
                  <p className="text-sm font-medium text-slate-800">
                    {viewBooking.discount || 0}%
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
                      viewBooking.status || "pending"
                    )}`}
                    value={viewBooking.status || "pending"}
                    onChange={(e) => {
                      const bookingId = getBookingId(viewBooking);
                      handleStatusChange(bookingId, e.target.value);
                      setViewBooking({ ...viewBooking, status: e.target.value });
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-2">
                    Payment Status
                  </label>
                  <select
                    className={`w-full rounded-lg px-4 py-3 text-sm font-medium border-0 ${getPaymentStatusColor(
                      viewBooking.payment_status || "unpaid"
                    )}`}
                    value={viewBooking.payment_status || "unpaid"}
                    onChange={(e) => {
                      const bookingId = getBookingId(viewBooking);
                      handlePaymentStatusChange(bookingId, e.target.value);
                      setViewBooking({ ...viewBooking, payment_status: e.target.value });
                    }}
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
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Guest ID Cards
              </h4>
              <IdCardGallery idCards={viewBooking.guestIdCards || []} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  closeViewModal();
                  openEditModal(viewBooking);
                }}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-950"
              >
                Edit Booking
              </button>
              <button
                onClick={() => {
                  const bookingId = getBookingId(viewBooking);
                  closeViewModal();
                  handleDeleteBooking(bookingId);
                }}
                className="flex-1 rounded-lg bg-white border-2 border-rose-500 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100"
              >
                Delete Booking
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
