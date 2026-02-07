"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  getPublicTenantInfo,
  getPublicPropertyDetails,
  getPublicRooms,
  getPublicUnits,
  checkPublicAvailability,
  createPublicBooking,
} from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";
import { getImageUrl } from "@/lib/api";
import { getTenantSlugFromSubdomain } from "@/utils/tenantUtils";

export default function PublicPropertyPage() {
  const params = useParams();
  const router = useRouter();

  // Try to get slug from subdomain first, fallback to route param
  const subdomainSlug = getTenantSlugFromSubdomain();
  const slug = subdomainSlug || params.slug;
  const propertyId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [units, setUnits] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [homeHref, setHomeHref] = useState(`/public/${slug}`);

  const [bookingForm, setBookingForm] = useState({
    startDate: "",
    endDate: "",
    roomId: "",
    unitId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    numberOfGuests: 1,
    adults: 1,
    children: 0,
    specialRequests: "",
  });

  useEffect(() => {
    loadData();
  }, [slug, propertyId]);

  useEffect(() => {
    const sub = getTenantSlugFromSubdomain();
    setHomeHref(sub && sub === slug ? "/" : `/public/${slug}`);
  }, [slug]);

  useEffect(() => {
    if (bookingForm.startDate && bookingForm.endDate) {
      checkAvailability();
    }
  }, [
    bookingForm.startDate,
    bookingForm.endDate,
    bookingForm.roomId,
    bookingForm.unitId,
  ]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tenantInfo, propertyData] = await Promise.all([
        getPublicTenantInfo(slug),
        getPublicPropertyDetails(slug, propertyId),
      ]);

      setTenant(tenantInfo);
      setProperty(propertyData);

      // Use property.modelType (hotel → rooms, airbnb → units). Fallback to propertyType for backward compat.
      const modelType =
        propertyData.modelType ||
        (propertyData.propertyType?.toLowerCase() === "hotel"
          ? "hotel"
          : "airbnb");
      const isHotel = modelType === "hotel";

      if (isHotel) {
        try {
          const roomsData = await getPublicRooms(slug, propertyId);
          setRooms(Array.isArray(roomsData) ? roomsData : []);
        } catch {
          setRooms([]);
        }
        setUnits([]);
      } else {
        try {
          const unitsData = await getPublicUnits(slug, propertyId);
          setUnits(Array.isArray(unitsData) ? unitsData : []);
        } catch {
          setUnits([]);
        }
        setRooms([]);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load property");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailability = async () => {
    try {
      const params = {
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
      };

      if (bookingForm.roomId) params.roomId = bookingForm.roomId;
      if (bookingForm.unitId) params.unitId = bookingForm.unitId;

      const availabilityData = await checkPublicAvailability(
        slug,
        propertyId,
        params
      );
      setAvailability(availabilityData);
    } catch (error) {
      setAvailability({ available: false, message: error.message });
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (
      !bookingForm.guestName ||
      !bookingForm.guestEmail ||
      !bookingForm.guestPhone
    ) {
      toast.error("Please fill in all guest information");
      return;
    }

    if (!bookingForm.startDate || !bookingForm.endDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    const isHotel =
      (property?.modelType ||
        (property?.propertyType?.toLowerCase() === "hotel"
          ? "hotel"
          : "airbnb")) === "hotel";
    if (isHotel && rooms.length > 0 && !bookingForm.roomId) {
      toast.error("Please select a room");
      return;
    }
    if (!isHotel && units.length > 0 && !bookingForm.unitId) {
      toast.error("Please select a unit");
      return;
    }

    setIsBooking(true);
    const toastId = toast.loading("Creating your booking...");

    try {
      const bookingData = {
        propertyId,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        guestInfo: {
          name: bookingForm.guestName,
          email: bookingForm.guestEmail,
          phone: bookingForm.guestPhone,
        },
        numberOfGuests: Number(bookingForm.numberOfGuests),
        guestCount: {
          adults: Number(bookingForm.adults),
          children: Number(bookingForm.children),
        },
        specialRequests: bookingForm.specialRequests,
      };

      // Send only roomId (hotel) or unitId (airbnb), not both
      if (isHotel && bookingForm.roomId)
        bookingData.roomId = bookingForm.roomId;
      if (!isHotel && bookingForm.unitId)
        bookingData.unitId = bookingForm.unitId;

      const booking = await createPublicBooking(slug, bookingData);

      toast.success("Booking created successfully!", { id: toastId });

      // Redirect to confirmation page
      router.push(
        homeHref === "/"
          ? `/booking/${booking.id || booking._id}`
          : `/public/${slug}/booking/${booking.id || booking._id}`
      );
    } catch (error) {
      toast.error(error.message || "Failed to create booking", { id: toastId });
      setIsBooking(false);
    }
  };

  const calculateNights = () => {
    if (!bookingForm.startDate || !bookingForm.endDate) return 0;
    const start = new Date(bookingForm.startDate);
    const end = new Date(bookingForm.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (nights === 0) return 0;

    let pricePerNight = property?.price || 0;

    if (bookingForm.roomId) {
      const selectedRoom = rooms.find(
        (r) => (r.id || r._id) === bookingForm.roomId
      );
      pricePerNight = selectedRoom?.price || pricePerNight;
    }

    if (bookingForm.unitId) {
      const selectedUnit = units.find(
        (u) => (u.id || u._id) === bookingForm.unitId
      );
      pricePerNight = selectedUnit?.price || pricePerNight;
    }

    return nights * pricePerNight;
  };

  if (isLoading) {
    return <PageLoader message="Loading property..." />;
  }

  const primaryColor = tenant.websiteConfig?.primaryColor || "#3b82f6";
  const images =
    property.images && property.images.length > 0
      ? property.images.map((img) => getImageUrl(img)).filter(Boolean)
      : [];

  const propertiesHref =
    homeHref === "/" ? "/properties" : `/public/${slug}/properties`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <Link
        href={propertiesHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6"
      >
        <svg
          className="w-4 h-4"
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
        Back to properties
      </Link>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="rounded-2xl overflow-hidden">
              <img
                src={images[0]}
                alt={property.title}
                className="w-full h-96 object-cover"
              />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.slice(1, 5).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${property.title} ${index + 2}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Property Info */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {property.title}
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {property.location}
            </p>
          </div>

          {/* Description */}
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700">{property.description}</p>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.bedrooms > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {property.bedrooms}
                </p>
                <p className="text-sm text-slate-600">Bedrooms</p>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {property.bathrooms}
                </p>
                <p className="text-sm text-slate-600">Bathrooms</p>
              </div>
            )}
            {property.area > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {property.area}
                </p>
                <p className="text-sm text-slate-600">sq ft</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Book Your Stay
            </h3>

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Check-In *
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={bookingForm.startDate}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      startDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Check-Out *
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={bookingForm.endDate}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, endDate: e.target.value })
                  }
                  min={
                    bookingForm.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  required
                />
              </div>

              {rooms.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Room *
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={bookingForm.roomId}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, roomId: e.target.value })
                    }
                    required
                  >
                    <option value="">Choose a room</option>
                    {rooms.map((room) => (
                      <option
                        key={room.id || room._id}
                        value={room.id || room._id}
                      >
                        Room {room.roomNumber} - {room.roomType} -{" "}
                        {"$" + room.price + "/night"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {units.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Unit
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={bookingForm.unitId}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, unitId: e.target.value })
                    }
                  >
                    <option value="">Main Property</option>
                    {units.map((unit) => (
                      <option
                        key={unit.id || unit._id}
                        value={unit.id || unit._id}
                      >
                        {unit.unitName} - {"$" + unit.price + "/night"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Adults *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={bookingForm.adults}
                    onChange={(e) => {
                      const adults = Number(e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        adults,
                        numberOfGuests: adults + bookingForm.children,
                      });
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={bookingForm.children}
                    onChange={(e) => {
                      const children = Number(e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        children,
                        numberOfGuests: bookingForm.adults + children,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Availability Status */}
              {availability && bookingForm.startDate && bookingForm.endDate && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    availability.available
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {availability.available ? "✅ Available" : "❌ Not Available"}
                </div>
              )}

              {/* Price Calculation */}
              {calculateNights() > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      ${" "}
                      {bookingForm.roomId
                        ? rooms.find(
                            (r) => (r.id || r._id) === bookingForm.roomId
                          )?.price || property.price
                        : bookingForm.unitId
                        ? units.find(
                            (u) => (u.id || u._id) === bookingForm.unitId
                          )?.price || property.price
                        : property.price}{" "}
                      × {calculateNights()} nights
                    </span>
                    <span className="font-semibold text-slate-900">
                      {"$" + calculateTotal()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      {"$" + calculateTotal()}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="font-semibold text-slate-900">
                  Guest Information
                </h4>

                <input
                  type="text"
                  placeholder="Full Name *"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={bookingForm.guestName}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      guestName: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Email *"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={bookingForm.guestEmail}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      guestEmail: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone *"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={bookingForm.guestPhone}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      guestPhone: e.target.value,
                    })
                  }
                  required
                />

                <textarea
                  rows={3}
                  placeholder="Special Requests (Optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={bookingForm.specialRequests}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      specialRequests: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={
                  isBooking || (availability && !availability.available)
                }
                className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {isBooking ? "Processing..." : "Book Now"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
