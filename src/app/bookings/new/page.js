"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import PageLoader from "@/components/common/PageLoader";
import Combobox from "@/components/common/Combobox";
import {
  createBooking,
  getAllProperties,
  getAllGuests,
  getRooms,
  updateGuest,
} from "@/lib/api";
import { getDefaultCurrency } from "@/utils/currencyUtils";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

const getInitialFormState = () => ({
  property_id: "",
  guest_id: "",
  start_date: "",
  end_date: "",
  amount: "",
  currency: getDefaultCurrency(),
  payment_status: "unpaid",
  numberOfGuests: "1",
  guest_name: "",
  guest_phone: "",
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
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");
  const [idCardFiles, setIdCardFiles] = useState([]);
  const [idCardPreviews, setIdCardPreviews] = useState([]);

  const [createForm, setCreateForm] = useState(() => getInitialFormState());

  // Helpers to work with properties (used to determine propertyType)
  const getPropertyById = (id) => propertiesData.find((p) => (p._id || p.id) === id);
  const isHotelProperty = (id) => {
    if (!id) return false;
    const prop = getPropertyById(id);
    return prop?.propertyType === "hotel";
  };

  // Clear room type selection when property changes
  useEffect(() => {
    setSelectedRoomTypeId("");
  }, [createForm.property_id]);

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

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      idCardPreviews.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [idCardPreviews]);


  const handleCreateBooking = async (e) => {
    e.preventDefault();

    // Validate dates before starting submission
    const startDate = new Date(createForm.start_date);
    const endDate = new Date(createForm.end_date);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    if (isHotelProperty(createForm.property_id) && !selectedRoomTypeId) {
      toast.error("Please select a room type category");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // If the selected guest was modified (name/phone), update guest first
      try {
        const guestId = createForm.guest_id;
        if (guestId) {
          const selectedGuest = guestsData.find((g) => getBookingId(g) === guestId);
          if (selectedGuest) {
            const updateData = {};
            if ((createForm.guest_name || "") !== (selectedGuest.name || "")) updateData.name = createForm.guest_name || "";
            if ((createForm.guest_phone || "") !== (selectedGuest.phone || "")) updateData.phone = createForm.guest_phone || "";
            if (Object.keys(updateData).length > 0) {
              try {
                const updated = await updateGuest(guestId, updateData);
                setGuestsData((prev) => prev.map((g) => (getBookingId(g) === guestId ? { ...g, ...updated } : g)));
              } catch (uErr) {
                console.error("Failed to update guest before booking:", uErr);
              }
            }
          }
        }
      } catch (uErr) {
        console.error("Error checking guest updates:", uErr);
      }

      // Prepare form data with files
      const formData = new FormData();

      // Append all booking fields, ensuring currency is from local storage.
      Object.keys(createForm).forEach((key) => {
        if (key === "currency") {
          formData.append(key, getDefaultCurrency());
        } else {
          formData.append(key, createForm[key]);
        }
      });
      // Do not send roomId anymore; send room type category instead so backend can auto-assign a room.
      if (isHotelProperty(createForm.property_id) && selectedRoomTypeId) {
        formData.append("roomTypeCategory", selectedRoomTypeId);
      }

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
                onChange={(value) => {
                  const sel = guestsData.find((g) => getBookingId(g) === value);
                  if (sel) {
                    setCreateForm({ ...createForm, guest_id: value, guest_name: sel.name || "", guest_phone: sel.phone || "" });
                  } else {
                    setCreateForm({ ...createForm, guest_id: value, guest_name: "", guest_phone: "" });
                  }
                }}
                options={guestsData}
                getOptionLabel={(guest) =>
                  guest.idCardNumber || guest.id_card || guest.idCard || guest.idNumber || guest.name || ""
                }
                getOptionValue={(guest) => getBookingId(guest)}
                placeholder="Search By Id card"
                required
                noOptionsMessage="No guests found"
              />
              {/* Extra quick fields for name and phone below the search */}
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

          {/* Room type category only (room is auto-assigned by backend) */}
          {createForm.property_id && isHotelProperty(createForm.property_id) && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Room type category *
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={selectedRoomTypeId}
                onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                required
              >
                <option value="">Select a room type category</option>
                {(() => {
                  const seen = new Set();
                  const options = [];
                  roomsData.forEach((room) => {
                    const rti = room.roomTypeId?._id ?? room.roomTypeId;
                    if (!rti || seen.has(String(rti))) return;
                    seen.add(String(rti));
                    const id = String(rti);
                    const label = room.roomType || room.roomTypeId?.name || "Category";
                    options.push({ id, label });
                  });
                  return options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ));
                })()}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                A room in this category will be assigned automatically for your dates.
              </p>
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Check-out Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createForm.end_date}
                onChange={(e) => {
                  const selectedDate = e.target.value;

                  // Validate: end date must be after start date (only if start date is selected)
                  if (createForm.start_date && selectedDate <= createForm.start_date) {
                    toast.error("Check-out date must be at least one day after check-in date");
                    return;
                  }

                  setCreateForm({ ...createForm, end_date: selectedDate });
                }}
                min="1900-01-01"
                max="2099-12-31"
                required
                disabled={!createForm.start_date}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
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

          {/* ID Cards Upload - use same simple picker as Add Guest form */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guest ID Cards (Optional)</label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                // Revoke old previews
                idCardPreviews.forEach((u) => u && URL.revokeObjectURL(u));
                const previews = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null));
                setIdCardFiles(files);
                setIdCardPreviews(previews);
              }}
            />
            <p className="mt-1 text-xs text-slate-500">Upload up to 10 ID cards. JPG, PNG, GIF, PDF accepted. Max 5MB each.</p>

            {idCardFiles.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {idCardFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    {idCardPreviews[idx] ? (
                      <img
                        src={idCardPreviews[idx]}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs text-slate-500">{file.name}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // remove this file
                          const newFiles = idCardFiles.filter((_, i) => i !== idx);
                          const newPreviews = idCardPreviews.filter((_, i) => i !== idx);
                          // revoke the removed preview
                          if (idCardPreviews[idx]) URL.revokeObjectURL(idCardPreviews[idx]);
                          setIdCardFiles(newFiles);
                          setIdCardPreviews(newPreviews);
                        }}
                        className="rounded-full bg-white p-2 text-slate-700 hover:bg-slate-100"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
