"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import FileUpload from "@/components/common/FileUpload";
import PageLoader from "@/components/common/PageLoader";
import Combobox from "@/components/common/Combobox";
import {
  createBooking,
  getAllProperties,
  getAllGuests,
  getRooms,
} from "@/lib/api";
import { getDefaultCurrency } from "@/utils/currencyUtils";
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
  payment_status: "unpaid",
  numberOfGuests: "1",
});

const getBookingId = (item) => item.id || item._id;

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

export default function NewBookingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  // SEO
  useSEO({
    title: "New Booking | Zuha Host",
    description: "Create a new booking reservation for your property.",
    keywords: "new booking, create booking, reservation, property booking",
  });

  const [propertiesData, setPropertiesData] = useState([]);
  const [guestsData, setGuestsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [roomsData, setRoomsData] = useState([]);
  const [idCardFiles, setIdCardFiles] = useState([]);

  const [createForm, setCreateForm] = useState(() => getInitialFormState());

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

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [properties, guests] = await Promise.all([
          getAllProperties(),
          getAllGuests(),
        ]);

        setPropertiesData(Array.isArray(properties) ? properties : []);
        setGuestsData(Array.isArray(guests) ? guests : []);

        // Set default currency from local storage (ensure it's current)
        const defaultCurrency = getDefaultCurrency();
        setCreateForm((prev) => ({
          ...prev,
          currency: defaultCurrency,
        }));
      } catch (err) {
        setError(err.message || "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Fetch rooms when property changes
  useEffect(() => {
    if (!createForm.property_id) {
      setRoomsData([]);
      return;
    }
    getRooms(createForm.property_id)
      .then((data) => setRoomsData(Array.isArray(data) ? data : []))
      .catch(() => setRoomsData([]));
  }, [createForm.property_id]);


  const handleCreateBooking = async (e) => {
    e.preventDefault();

    // Validate dates before starting submission
    const startDate = new Date(createForm.start_date);
    const endDate = new Date(createForm.end_date);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    if (!createForm.roomId) {
      toast.error("Please select a room");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare form data with files
      const formData = new FormData();

      // Append all booking fields, ensuring currency is from local storage
      Object.keys(createForm).forEach((key) => {
        if (key === "currency") {
          formData.append(key, getDefaultCurrency());
        } else if (key === "roomId" && !createForm[key]) {
          // Skip empty roomId
        } else {
          formData.append(key, createForm[key]);
        }
      });

      // Append ID card files
      idCardFiles.forEach((file) => {
        formData.append("guestIdCards", file);
      });

      await createBooking(formData);

      toast.success("Booking created successfully!");

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        router.push("/bookings");
      }, 1000);
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
        >
          <svg
            className="w-6 h-6 text-slate-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">
            Create New Booking
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Fill in the details to create a new reservation
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleCreateBooking} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          {/* Guest Selection */}
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Guest *
              </label>
              <Combobox
                value={createForm.guest_id}
                onChange={(value) =>
                  setCreateForm({ ...createForm, guest_id: value })
                }
                options={guestsData}
                getOptionLabel={(guest) => guest.name}
                getOptionValue={(guest) => getBookingId(guest)}
                getOptionDescription={(guest) =>
                  `${guest.phone}${guest.email ? ` • ${guest.email}` : ""}`
                }
                placeholder="Search guest by name, phone, or email..."
                required
                noOptionsMessage="No guests found"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Total Guests
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

          {/* Property Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Property *
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

          {/* Room Selection */}
          {createForm.property_id && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
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
                {roomsData.map((room) => {
                  const rId = room._id || room.id;
                  return (
                    <option key={rId} value={rId}>
                      Room {room.roomNumber} — {room.roomType} — ${room.basePrice || room.price || 0}/night
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Check-in Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.start_date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setCreateForm({ ...createForm, start_date: e.target.value, end_date: "" })
                }
              
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Check-out Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.end_date}
                min={createForm.start_date || new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setCreateForm({ ...createForm, end_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm cursor-not-allowed"
                value={createForm.amount}
                readOnly
                tabIndex={-1}
                placeholder="Select room & dates"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment Status *
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

          {/* ID Cards Upload */}
          <div>
            <FileUpload
              label="Guest ID Cards (Optional)"
              files={idCardFiles}
              onChange={setIdCardFiles}
              maxFiles={10}
              maxSizeMB={5}
              helpText="Upload up to 10 ID cards. JPG, PNG, GIF, PDF accepted. Max 5MB each."
              showPreview={false}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
