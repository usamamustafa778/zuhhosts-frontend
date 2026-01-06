"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import FileUpload from "@/components/common/FileUpload";
import PageLoader from "@/components/common/PageLoader";
import Combobox from "@/components/common/Combobox";
import PhoneInput from "@/components/common/PhoneInput";
import {
  createBooking,
  getAllProperties,
  getAllGuests,
  createGuest,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

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
  const [isCreatingNewGuest, setIsCreatingNewGuest] = useState(false);
  const [idCardFiles, setIdCardFiles] = useState([]);

  const [createForm, setCreateForm] = useState(INITIAL_FORM_STATE);
  const [newGuestForm, setNewGuestForm] = useState({ name: "", phone: "" });

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
      } catch (err) {
        setError(err.message || "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);


  const handleCreateGuest = async () => {
    try {
      if (!newGuestForm.name.trim() || !newGuestForm.phone.trim()) {
        toast.error("Please fill in guest name and phone");
        return;
      }

      const newGuest = await createGuest(newGuestForm);
      setGuestsData((prev) => [newGuest, ...prev]);
      setCreateForm({ ...createForm, guest_id: getBookingId(newGuest) });
      setIsCreatingNewGuest(false);
      setNewGuestForm({ name: "", phone: "" });
      toast.success("Guest created successfully!");
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    // Validate dates before starting submission
    const startDate = new Date(createForm.start_date);
    const endDate = new Date(createForm.end_date);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare form data with files
      const formData = new FormData();

      // Append all booking fields
      Object.keys(createForm).forEach((key) => {
        formData.append(key, createForm[key]);
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
          <div>
            {!isCreatingNewGuest ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Guest *
                    </label>
                    {!isCreatingNewGuest && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewGuest(true)}
                        className="flex items-center gap-1 text-xs cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <UserPlus className="h-3 w-3" />
                        New Guest
                      </button>
                    )}
                  </div>
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
            ) : (
              <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    New Guest
                  </span>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                      value={newGuestForm.name}
                      onChange={(e) =>
                        setNewGuestForm({
                          ...newGuestForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Phone Number *
                    </label>
                    <PhoneInput
                      value={newGuestForm.phone}
                      onChange={(e) =>
                        setNewGuestForm({
                          ...newGuestForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="123 456 7890"
                      className="bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateGuest}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Create Guest
                </button>
              </div>
            )}
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
                onChange={(e) =>
                  setCreateForm({ ...createForm, start_date: e.target.value })
                }
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
                onChange={(e) =>
                  setCreateForm({ ...createForm, end_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Amount (USD) *
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
