"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getPropertyById,
  updateProperty,
  getRooms,
  getRoomTypes,
  addRoom,
  addRoomType,
  updateRoom,
  updateRoomType,
  deleteRoom,
  deleteRoomType,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import DataTable from "@/components/common/DataTable";
import { getImageUrl } from "@/lib/api";
import FileUpload from "@/components/common/FileUpload";
import AmenityPills from "@/app/properties/new/_components/AmenityPills";
import {
  ROOM_AMENITIES,
  AIRBNB_AMENITIES,
  HOTEL_AMENITIES,
  AIRBNB_AMENITY_LABELS,
  HOTEL_AMENITY_LABELS,
  DISCOUNT_OPTIONS,
  SAFETY_DISCLOSURES,
} from "@/app/properties/new/_constants/amenities";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isHotel, setIsHotel] = useState(false);

  const [isAddRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [isAddRoomTypeModalOpen, setAddRoomTypeModalOpen] = useState(false);
  const [isEditRoomTypeModalOpen, setEditRoomTypeModalOpen] = useState(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomType: "",
    price: "",
    maxOccupancy: "",
  });

  const defaultRoomTypeForm = {
    name: "",
    bedType: "",
    bedCount: 1,
    maxOccupancy: 2,
    size: "",
    price: "",
    inventory: 1,
    amenities: [],
  };
  const [roomTypeForm, setRoomTypeForm] = useState(defaultRoomTypeForm);

  // Edit property form
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [editImagesToRemove, setEditImagesToRemove] = useState([]);

  const openEditForm = () => {
    if (!property) return;
    const rawHighlights = Array.isArray(property.highlights) ? property.highlights.slice(0, 2) : [];
    const highlights = [rawHighlights[0] || "", rawHighlights[1] || ""];
    setEditForm({
      title: property.title || "",
      description: property.description || "",
      location: property.location || "",
      address: property.address || property.location || "",
      placeType: property.placeType || property.propertyType || "",
      starRating: property.starRating != null ? String(property.starRating) : "",
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
      bathrooms: property.bathrooms != null ? String(property.bathrooms) : "1",
      area: property.area != null ? String(property.area) : "",
      beds: property.beds != null ? String(property.beds) : "1",
      maxGuests: property.maxGuests != null ? String(property.maxGuests) : "2",
      guestPlaceType: property.guestPlaceType || "entire_place",
      price: property.price != null ? String(property.price) : "",
      currency: property.currency || "USD",
      weekendPremiumPercent: property.weekendPremiumPercent ?? 0,
      checkInTime: property.checkInTime || "14:00",
      checkOutTime: property.checkOutTime || "11:00",
      smokingPolicy: property.smokingPolicy || "no_smoking",
      petPolicy: property.petPolicy || "no_pets",
      cancellationPolicy: property.cancellationPolicy || "moderate",
      status: property.status || "available",
      amenities: Array.isArray(property.amenities) ? [...property.amenities] : [],
      highlights,
      discounts: property.discounts ? { ...property.discounts } : { newListing: false, lastMinute: false, weekly: false, monthly: false },
      safetyFeatures: property.safetyFeatures ? { ...property.safetyFeatures } : { exteriorCamera: false, noiseMonitor: false, weapons: false },
    });
    setEditImages([]);
    setEditImagesToRemove([]);
    setIsEditFormOpen(true);
  };

  const cancelEditForm = () => {
    setIsEditFormOpen(false);
    setEditForm({});
    setEditImages([]);
    setEditImagesToRemove([]);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const removeEditExistingImage = (pathOrUrl) => {
    setEditImagesToRemove((prev) => (prev.includes(pathOrUrl) ? prev : [...prev, pathOrUrl]));
  };

  const handleSaveProperty = async () => {
    if (!propertyId || !property) return;
    const p = editForm;
    
    // Validate required fields
    if (!p.title || p.title.trim().length < 3) {
      toast.error("Property title must be at least 3 characters");
      return;
    }
    if (!p.location || p.location.trim().length === 0) {
      toast.error("Please enter property location");
      return;
    }
    
    // Validate image limit: backend allows maximum 5 images total
    const currentImages = (property.images || []).filter((img) => !editImagesToRemove.includes(img));
    const totalImageCount = currentImages.length + editImages.length;
    if (totalImageCount > 5) {
      toast.error("Property can have a maximum of 5 images total. Please remove some images.");
      return;
    }
    const highlightsRaw = Array.isArray(p.highlights) ? p.highlights : [];
    const highlights = highlightsRaw.map((h) => (typeof h === "string" ? h.trim() : "")).filter(Boolean).slice(0, 2);
    const payload = {
      modelType: property.modelType || (property.propertyType?.toLowerCase() === "hotel" ? "hotel" : "airbnb"),
      title: p.title,
      description: p.description,
      location: p.location,
      address: p.address,
      placeType: p.placeType,
      propertyType: p.placeType,
      starRating: p.starRating === "" ? null : Number(p.starRating),
      bedrooms: p.bedrooms === "" ? null : Number(p.bedrooms),
      bathrooms: p.bathrooms === "" ? 1 : Number(p.bathrooms),
      area: p.area === "" ? null : Number(p.area),
      beds: p.beds === "" ? 1 : Number(p.beds),
      maxGuests: p.maxGuests === "" ? 2 : Number(p.maxGuests),
      guestPlaceType: p.guestPlaceType,
      price: p.price === "" ? null : Number(p.price),
      currency: p.currency,
      weekendPremiumPercent: Number(p.weekendPremiumPercent) || 0,
      checkInTime: p.checkInTime,
      checkOutTime: p.checkOutTime,
      smokingPolicy: p.smokingPolicy,
      petPolicy: p.petPolicy,
      cancellationPolicy: p.cancellationPolicy,
      status: p.status || "available",
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      highlights,
      discounts: p.discounts,
      safetyFeatures: p.safetyFeatures,
    };
    setIsSaving(true);
    const toastId = toast.loading("Saving property...");
    try {
      await updateProperty(propertyId, payload, editImages, editImagesToRemove);
      toast.success("Property updated!", { id: toastId });
      cancelEditForm();
      loadProperty();
    } catch (err) {
      toast.error(err.message || "Failed to save property", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadProperty();
  }, [isAuthenticated, propertyId]);

  const loadProperty = async () => {
    try {
      setIsLoading(true);
      const propertyData = await getPropertyById(propertyId);
      setProperty(propertyData);

      // Use property.modelType (hotel → Rooms, airbnb → Units). Fallback to propertyType for backward compat.
      const modelType =
        propertyData.modelType ||
        (propertyData.propertyType?.toLowerCase() === "hotel" ? "hotel" : "airbnb");
      const isHotelProperty = modelType === "hotel";
      setIsHotel(isHotelProperty);

      // Load rooms and room types for hotel properties
      if (isHotelProperty) {
        const [roomsData, roomTypesData] = await Promise.all([
          getRooms(propertyId),
          getRoomTypes(propertyId).catch(() => []),
        ]);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setRoomTypes(Array.isArray(roomTypesData) ? roomTypesData : []);
      } else {
        setRooms([]);
        setRoomTypes([]);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load property");
      router.push("/properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Adding room...");

    try {
      await addRoom(propertyId, {
        roomNumber: roomForm.roomNumber,
        roomType: roomForm.roomType,
        price: Number(roomForm.price),
        maxOccupancy: roomForm.maxOccupancy ? Number(roomForm.maxOccupancy) : 2,
      });

      toast.success("Room added successfully!", { id: toastId });
      setAddRoomModalOpen(false);
      setRoomForm({ roomNumber: "", roomType: "", price: "", maxOccupancy: "" });
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to add room", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    const toastId = toast.loading("Deleting room...");
    try {
      await deleteRoom(propertyId, roomId);
      toast.success("Room deleted successfully!", { id: toastId });
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to delete room", { id: toastId });
    }
  };

  const handleAddRoomType = async (e) => {
    e?.preventDefault?.();
    if (!roomTypeForm.name?.trim() || !roomTypeForm.price) {
      toast.error("Name and price are required.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Adding room type...");
    try {
      const payload = {
        name: roomTypeForm.name.trim(),
        bedType: roomTypeForm.bedType || "Queen",
        bedCount: Number(roomTypeForm.bedCount) || 1,
        maxOccupancy: Number(roomTypeForm.maxOccupancy) || 2,
        price: Number(roomTypeForm.price),
        inventory: Math.max(1, Math.floor(Number(roomTypeForm.inventory) || 1)),
        amenities: Array.isArray(roomTypeForm.amenities) ? roomTypeForm.amenities : [],
      };
      if (roomTypeForm.size && Number(roomTypeForm.size) > 0) payload.size = Number(roomTypeForm.size);
      await addRoomType(propertyId, payload);
      toast.success("Room type added. Rooms created.", { id: toastId });
      setAddRoomTypeModalOpen(false);
      setRoomTypeForm(defaultRoomTypeForm);
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to add room type", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditRoomType = (rt) => {
    const id = rt.id ?? rt._id;
    setEditingRoomTypeId(id);
    setRoomTypeForm({
      name: rt.name ?? "",
      bedType: rt.bedType ?? "",
      bedCount: rt.bedCount ?? 1,
      maxOccupancy: rt.maxOccupancy ?? 2,
      size: rt.size ?? "",
      price: rt.price ?? "",
      inventory: rt.inventory ?? 1,
      amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
    });
    setEditRoomTypeModalOpen(true);
  };

  const handleUpdateRoomType = async (e) => {
    e?.preventDefault?.();
    if (!editingRoomTypeId || !roomTypeForm.name?.trim() || !roomTypeForm.price) {
      toast.error("Name and price are required.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Updating room type...");
    try {
      const payload = {
        name: roomTypeForm.name.trim(),
        bedType: roomTypeForm.bedType || "Queen",
        bedCount: Number(roomTypeForm.bedCount) || 1,
        maxOccupancy: Number(roomTypeForm.maxOccupancy) || 2,
        price: Number(roomTypeForm.price),
        inventory: Math.max(1, Math.floor(Number(roomTypeForm.inventory) || 1)),
        amenities: Array.isArray(roomTypeForm.amenities) ? roomTypeForm.amenities : [],
      };
      if (roomTypeForm.size && Number(roomTypeForm.size) > 0) payload.size = Number(roomTypeForm.size);
      await updateRoomType(propertyId, editingRoomTypeId, payload);
      toast.success("Room type updated.", { id: toastId });
      setEditRoomTypeModalOpen(false);
      setEditingRoomTypeId(null);
      setRoomTypeForm(defaultRoomTypeForm);
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to update room type", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoomType = async (roomTypeId) => {
    if (!confirm("Delete this room type and all its rooms? Rooms with active bookings cannot be removed.")) return;
    const toastId = toast.loading("Deleting room type...");
    try {
      await deleteRoomType(propertyId, roomTypeId);
      toast.success("Room type deleted.", { id: toastId });
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to delete room type", { id: toastId });
    }
  };

  const handleToggleVisibility = async () => {
    const toastId = toast.loading("Updating visibility...");
    try {
      await updateProperty(propertyId, {
        isPubliclyVisible: !property.isPubliclyVisible,
      });
      toast.success("Visibility updated!", { id: toastId });
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to update visibility", { id: toastId });
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading property..." />;
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Not Found</h2>
        <button
          onClick={() => router.push("/properties")}
          className="text-blue-600 hover:underline"
        >
          Back to Properties
        </button>
      </div>
    );
  }

  const images =
    property.images && property.images.length > 0
      ? property.images.map((img) => getImageUrl(img)).filter(Boolean)
      : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/properties")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{property.title}</h1>
            <p className="text-slate-600 mt-1">{property.location}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <button
            onClick={isEditFormOpen ? cancelEditForm : openEditForm}
            className="rounded-full px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            {isEditFormOpen ? "Cancel" : "Edit property"}
          </button>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleToggleVisibility}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                property.isPubliclyVisible
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {property.isPubliclyVisible ? "🌐 Public" : "🔒 Private"}
            </button>
            <span className="text-xs text-slate-500">
              {property.isPubliclyVisible ? "Shown on your tenant website" : "Hidden from tenant website"}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Property Form */}
      {isEditFormOpen && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm p-6 sm:p-8 space-y-8">
          <h2 className="text-xl font-semibold text-slate-900">Edit property</h2>

          {/* Basics */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Title *" value={editForm.title} onChange={(e) => handleEditFormChange("title", e.target.value)} placeholder="Property title" />
              <Select label="Status" value={editForm.status} onChange={(v) => handleEditFormChange("status", v)} options={[{ value: "available", label: "Available" }, { value: "unavailable", label: "Unavailable" }, { value: "maintenance", label: "Maintenance" }]} />
              {isHotel ? (
                <>
                  <Select label="Hotel type" value={editForm.placeType} onChange={(v) => handleEditFormChange("placeType", v)} options={["Hotel", "Boutique hotel", "Resort", "Aparthotel", "Guesthouse", "Hostel"]} />
                  <Select label="Star rating" value={editForm.starRating} onChange={(v) => handleEditFormChange("starRating", v)} placeholder="Select" options={["1", "2", "3", "4", "5"]} />
                </>
              ) : (
                <Select label="Property type" value={editForm.placeType} onChange={(v) => handleEditFormChange("placeType", v)} options={["Apartment", "House", "Villa", "Cabin", "Condo", "Guesthouse", "Loft", "Townhouse", "Cottage", "Other"]} />
              )}
            </div>
            <div className="mt-4">
              <FormField label="Description" as="textarea" rows={4} value={editForm.description} onChange={(e) => handleEditFormChange("description", e.target.value)} placeholder="Describe your property..." maxLength={500} />
            </div>
            {!isHotel && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Highlights (max 2)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Highlight 1" value={(editForm.highlights && editForm.highlights[0]) || ""} onChange={(e) => handleEditFormChange("highlights", [e.target.value, (editForm.highlights && editForm.highlights[1]) || ""])} placeholder="e.g. Peaceful" />
                  <FormField label="Highlight 2" value={(editForm.highlights && editForm.highlights[1]) || ""} onChange={(e) => handleEditFormChange("highlights", [(editForm.highlights && editForm.highlights[0]) || "", e.target.value])} placeholder="e.g. Spacious" />
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Location</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="City / Location *" value={editForm.location} onChange={(e) => handleEditFormChange("location", e.target.value)} placeholder="e.g. Islamabad, pk" />
              <FormField label="Full address" value={editForm.address} onChange={(e) => handleEditFormChange("address", e.target.value)} placeholder="Street, building, area" />
            </div>
          </div>

          {/* Capacity (Airbnb) */}
          {!isHotel && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Capacity & rooms</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField label="Max guests" type="number" min="1" value={editForm.maxGuests} onChange={(e) => handleEditFormChange("maxGuests", e.target.value)} />
                <FormField label="Bedrooms" type="number" min="0" value={editForm.bedrooms} onChange={(e) => handleEditFormChange("bedrooms", e.target.value)} />
                <FormField label="Beds" type="number" min="0" value={editForm.beds} onChange={(e) => handleEditFormChange("beds", e.target.value)} />
                <FormField label="Bathrooms" type="number" min="0" value={editForm.bathrooms} onChange={(e) => handleEditFormChange("bathrooms", e.target.value)} />
              </div>
              <div className="mt-4">
                <Select label="Guest access" value={editForm.guestPlaceType} onChange={(v) => handleEditFormChange("guestPlaceType", v)} options={[{ value: "entire_place", label: "Entire place" }, { value: "room", label: "Private room" }, { value: "shared_room", label: "Shared room" }]} />
              </div>
            </div>
          )}

          {/* Area (optional) */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Details</h3>
            <FormField label="Area (sq ft, optional)" type="number" min="0" value={editForm.area} onChange={(e) => handleEditFormChange("area", e.target.value)} placeholder="e.g. 1200" />
          </div>

          {/* Pricing */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Price per night *" type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => handleEditFormChange("price", e.target.value)} placeholder="60" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weekend premium (%)</label>
                <input
                  type="range"
                  min="0"
                  max="99"
                  step="1"
                  value={Number(editForm.weekendPremiumPercent) || 0}
                  onChange={(e) => handleEditFormChange("weekendPremiumPercent", Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <span className="text-sm text-slate-600 ml-2">{Number(editForm.weekendPremiumPercent) || 0}%</span>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Policies</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Check-in time" type="time" value={editForm.checkInTime} onChange={(e) => handleEditFormChange("checkInTime", e.target.value)} />
              <FormField label="Check-out time" type="time" value={editForm.checkOutTime} onChange={(e) => handleEditFormChange("checkOutTime", e.target.value)} />
              <Select label="Smoking" value={editForm.smokingPolicy} onChange={(v) => handleEditFormChange("smokingPolicy", v)} options={[{ value: "no_smoking", label: "No smoking" }, { value: "designated_areas", label: "Designated areas" }, { value: "allowed", label: "Allowed" }]} />
              <Select label="Pets" value={editForm.petPolicy} onChange={(v) => handleEditFormChange("petPolicy", v)} options={[{ value: "no_pets", label: "No pets" }, { value: "pets_allowed", label: "Pets allowed" }, { value: "on_request", label: "On request" }]} />
              <Select label="Cancellation" value={editForm.cancellationPolicy} onChange={(v) => handleEditFormChange("cancellationPolicy", v)} options={[{ value: "flexible", label: "Flexible" }, { value: "moderate", label: "Moderate" }, { value: "strict", label: "Strict" }, { value: "non_refundable", label: "Non-refundable" }]} />
            </div>
          </div>

          {/* Amenities */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{isHotel ? "Hotel facilities" : "Amenities"}</h3>
            {(() => {
              const amenityCats = isHotel ? HOTEL_AMENITIES : AIRBNB_AMENITIES;
              const catLabels = isHotel ? HOTEL_AMENITY_LABELS : AIRBNB_AMENITY_LABELS;
              const selected = Array.isArray(editForm.amenities) ? editForm.amenities : [];
              const toggleAmenity = (item) => {
                setEditForm((prev) => ({
                  ...prev,
                  amenities: selected.includes(item) ? (prev.amenities || []).filter((x) => x !== item) : [...(prev.amenities || []), item],
                }));
              };
              return (
                <>
                  {Object.entries(amenityCats).map(([key, items]) => (
                    <div key={key} className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">{catLabels[key]}</p>
                      <AmenityPills items={items} selected={selected} onToggle={toggleAmenity} />
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          {/* Discounts & Safety (Airbnb) */}
          {!isHotel && (
            <div className="border-t border-slate-200 pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Discounts</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {DISCOUNT_OPTIONS.map((d) => {
                    const checked = editForm.discounts?.[d.key] || false;
                    return (
                      <label key={d.key} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${checked ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                        <input type="checkbox" checked={checked} onChange={() => handleEditFormChange("discounts", { ...editForm.discounts, [d.key]: !checked })} className="sr-only" />
                        <span className="text-lg font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg min-w-14 text-center">{d.pct}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{d.label}</p>
                          <p className="text-xs text-slate-600">{d.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                          {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Safety disclosures</h3>
                <div className="space-y-2">
                  {SAFETY_DISCLOSURES.map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <span className="text-sm text-slate-900">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={editForm.safetyFeatures?.[item.key] || false}
                        onChange={() => handleEditFormChange("safetyFeatures", { ...editForm.safetyFeatures, [item.key]: !editForm.safetyFeatures?.[item.key] })}
                        className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Photos</h3>
            {(property.images || []).filter((p) => !editImagesToRemove.includes(p)).length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Current photos</p>
                <div className="flex flex-wrap gap-3">
                  {(property.images || []).filter((p) => !editImagesToRemove.includes(p)).map((pathOrUrl) => {
                    const src = getImageUrl(pathOrUrl);
                    return (
                      <div key={pathOrUrl} className="relative shrink-0 rounded-lg border border-slate-200 overflow-hidden group">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-100">
                          {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Photo</div>}
                        </div>
                        <button type="button" onClick={() => removeEditExistingImage(pathOrUrl)} className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-slate-500 shadow-sm hover:bg-rose-50 hover:text-rose-600" aria-label="Remove photo">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <FileUpload 
              label="Add more photos" 
              files={editImages} 
              onChange={(newImages) => {
                // Calculate total images after adding new ones
                const currentImages = (property.images || []).filter((p) => !editImagesToRemove.includes(p));
                const totalAfterAdd = currentImages.length + newImages.length;
                if (totalAfterAdd > 5) {
                  toast.error("Property can have a maximum of 5 images total. Please remove some existing images first.");
                  return;
                }
                setEditImages(newImages);
              }} 
              maxFiles={5} 
              maxSizeMB={5}
              helpText="Maximum 5 images total"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={handleSaveProperty} disabled={isSaving} className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" onClick={cancelEditForm} className="rounded-full border-2 border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Property Info Card (read-only when not editing) */}
      {!isEditFormOpen && (
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Images */}
          {images.length > 0 && (
            <div>
              <img
                src={images[0]}
                alt={property.title}
                className="w-full h-64 object-cover rounded-xl"
              />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.slice(1, 5).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${property.title} ${index + 2}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Description</h3>
              <p className="text-slate-900">{property.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Property Type</p>
                <p className="text-sm font-semibold text-slate-900">{property.propertyType}</p>
              </div>
              {property.bedrooms > 0 && (
                <div>
                  <p className="text-xs text-slate-600">Bedrooms</p>
                  <p className="text-sm font-semibold text-slate-900">{property.bedrooms}</p>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div>
                  <p className="text-xs text-slate-600">Bathrooms</p>
                  <p className="text-sm font-semibold text-slate-900">{property.bathrooms}</p>
                </div>
              )}
              {property.area > 0 && (
                <div>
                  <p className="text-xs text-slate-600">Area</p>
                  <p className="text-sm font-semibold text-slate-900">{property.area} sq ft</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-600">Base Price</p>
                <p className="text-sm font-semibold text-slate-900">${property.price}/night</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Room Types Section */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Room types ({roomTypes.length})
          </h2>
          <button
            onClick={() => {
              setRoomTypeForm(defaultRoomTypeForm);
              setAddRoomTypeModalOpen(true);
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add room type
          </button>
        </div>

        {roomTypes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No room types yet. Add a room type to auto-create rooms (e.g. Deluxe King x 12).</p>
          </div>
        ) : (
          <DataTable
            headers={["Name", "Bed", "Occupancy", "Price/night", "Inventory", "Actions"]}
            rows={roomTypes.map((rt) => ({
              id: rt.id ?? rt._id,
              cells: [
                rt.name,
                `${rt.bedCount ?? 1} x ${rt.bedType ?? "—"}`,
                rt.maxOccupancy ?? 2,
                `$${Number(rt.price ?? 0).toLocaleString()}`,
                rt.inventory ?? 0,
                <span key="actions" className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditRoomType(rt)}
                    className="text-slate-600 hover:text-slate-800 text-sm underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoomType(rt.id ?? rt._id)}
                    className="text-rose-600 hover:text-rose-700 text-sm underline"
                  >
                    Delete
                  </button>
                </span>,
              ],
            }))}
          />
        )}
        {rooms.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {rooms.length} individual room{rooms.length !== 1 ? "s" : ""} (created from room types).
            </p>
          </div>
        )}
      </div>

      {/* Add Room Type Modal */}
      <Modal
        title="Add room type"
        description="Creates this room type and auto-generates rooms (e.g. 12 Deluxe King rooms)."
        isOpen={isAddRoomTypeModalOpen}
        onClose={() => {
          setAddRoomTypeModalOpen(false);
          setRoomTypeForm(defaultRoomTypeForm);
        }}
        primaryActionLabel={isSaving ? "Adding..." : "Add room type"}
        onPrimaryAction={handleAddRoomType}
        disabled={isSaving}
      >
        <form className="space-y-4" onSubmit={handleAddRoomType}>
          <FormField
            label="Name *"
            value={roomTypeForm.name}
            onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })}
            placeholder="e.g. Deluxe King"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Bed type"
              value={roomTypeForm.bedType}
              onChange={(value) => setRoomTypeForm({ ...roomTypeForm, bedType: value })}
              placeholder="Select"
              options={["King", "Queen", "Double", "Twin", "Single", "Bunk"]}
            />
            <FormField
              label="Bed count"
              type="number"
              min="1"
              value={roomTypeForm.bedCount}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, bedCount: e.target.value })}
              placeholder="1"
            />
            <FormField
              label="Max occupancy"
              type="number"
              min="1"
              value={roomTypeForm.maxOccupancy}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxOccupancy: e.target.value })}
              placeholder="2"
            />
            <FormField
              label="Size (sq ft, optional)"
              type="number"
              min="0"
              value={roomTypeForm.size}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, size: e.target.value })}
              placeholder="350"
            />
            <FormField
              label="Price per night (USD) *"
              type="number"
              min="0"
              step="0.01"
              value={roomTypeForm.price}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, price: e.target.value })}
              placeholder="150"
            />
            <FormField
              label="Inventory (number of rooms)"
              type="number"
              min="1"
              value={roomTypeForm.inventory}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, inventory: e.target.value })}
              placeholder="10"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Room amenities (optional)</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_AMENITIES.map((a) => {
                const selected = (roomTypeForm.amenities || []).includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setRoomTypeForm({
                        ...roomTypeForm,
                        amenities: selected
                          ? (roomTypeForm.amenities || []).filter((x) => x !== a)
                          : [...(roomTypeForm.amenities || []), a],
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Room Type Modal */}
      <Modal
        title="Edit room type"
        description="Changing inventory adds or removes rooms. Price updates all rooms of this type."
        isOpen={isEditRoomTypeModalOpen}
        onClose={() => {
          setEditRoomTypeModalOpen(false);
          setEditingRoomTypeId(null);
          setRoomTypeForm(defaultRoomTypeForm);
        }}
        primaryActionLabel={isSaving ? "Saving..." : "Save"}
        onPrimaryAction={handleUpdateRoomType}
        disabled={isSaving}
      >
        <form className="space-y-4" onSubmit={handleUpdateRoomType}>
          <FormField
            label="Name *"
            value={roomTypeForm.name}
            onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })}
            placeholder="e.g. Deluxe King"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Bed type"
              value={roomTypeForm.bedType}
              onChange={(value) => setRoomTypeForm({ ...roomTypeForm, bedType: value })}
              placeholder="Select"
              options={["King", "Queen", "Double", "Twin", "Single", "Bunk"]}
            />
            <FormField
              label="Bed count"
              type="number"
              min="1"
              value={roomTypeForm.bedCount}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, bedCount: e.target.value })}
            />
            <FormField
              label="Max occupancy"
              type="number"
              min="1"
              value={roomTypeForm.maxOccupancy}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxOccupancy: e.target.value })}
            />
            <FormField
              label="Size (sq ft, optional)"
              type="number"
              min="0"
              value={roomTypeForm.size}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, size: e.target.value })}
            />
            <FormField
              label="Price per night (USD) *"
              type="number"
              min="0"
              step="0.01"
              value={roomTypeForm.price}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, price: e.target.value })}
            />
            <FormField
              label="Inventory (number of rooms)"
              type="number"
              min="1"
              value={roomTypeForm.inventory}
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, inventory: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Room amenities</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_AMENITIES.map((a) => {
                const selected = (roomTypeForm.amenities || []).includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setRoomTypeForm({
                        ...roomTypeForm,
                        amenities: selected
                          ? (roomTypeForm.amenities || []).filter((x) => x !== a)
                          : [...(roomTypeForm.amenities || []), a],
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Legacy Add Room Modal (individual room; kept for backward compat) */}
      <Modal
        title="Add Room"
        description="Add a single room (legacy). Prefer adding a room type to auto-create multiple rooms."
        isOpen={isAddRoomModalOpen}
        onClose={() => {
          setAddRoomModalOpen(false);
          setRoomForm({ roomNumber: "", roomType: "", price: "", maxOccupancy: "" });
        }}
        primaryActionLabel={isSaving ? "Adding..." : "Add Room"}
        onPrimaryAction={handleAddRoom}
        disabled={isSaving}
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Room Number *"
              value={roomForm.roomNumber}
              onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              placeholder="101"
            />
            <Select
              label="Room Type *"
              value={roomForm.roomType}
              onChange={(value) => setRoomForm({ ...roomForm, roomType: value })}
              placeholder="Select type"
              options={["Standard", "Deluxe", "Suite", "Executive", "Presidential"]}
            />
            <FormField
              label="Price per Night (USD) *"
              type="number"
              min="0"
              step="0.01"
              value={roomForm.price}
              onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
              placeholder="100"
            />
            <FormField
              label="Max Occupancy"
              type="number"
              min="1"
              value={roomForm.maxOccupancy}
              onChange={(e) => setRoomForm({ ...roomForm, maxOccupancy: e.target.value })}
              placeholder="2"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
