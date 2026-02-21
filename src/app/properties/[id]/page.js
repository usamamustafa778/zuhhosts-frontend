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

/** Normalize room type id from a room (handles populated or raw ref) */
function roomTypeIdFromRoom(r) {
  if (!r) return "";
  const rt = r.roomTypeId;
  if (rt == null) return "";
  if (typeof rt === "string") return rt;
  return (rt._id ?? rt.id)?.toString?.() ?? String(rt);
}

/** Normalize room type id from a room type object */
function roomTypeIdFromType(rt) {
  if (!rt) return "";
  return (rt._id ?? rt.id)?.toString?.() ?? String(rt._id ?? rt.id ?? "");
}

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
  const [isEditRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [isAddRoomTypeModalOpen, setAddRoomTypeModalOpen] = useState(false);
  const [isEditRoomTypeModalOpen, setEditRoomTypeModalOpen] = useState(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRoomTypes, setExpandedRoomTypes] = useState(new Set());
  const [roomsViewMode, setRoomsViewMode] = useState("categories"); // "categories" or "table"

  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomType: "",
    roomTypeId: "", // For hotel properties - required
    price: "",
    maxOccupancy: "",
    bedType: "",
    bedCount: "",
    size: "",
    bathrooms: "",
    amenities: [],
  });
  const [roomBatches, setRoomBatches] = useState([{ batchStart: "", batchEnd: "" }]);
  const [roomBatchErrors, setRoomBatchErrors] = useState([]);
  const [batchEditRoomTypeId, setBatchEditRoomTypeId] = useState(null);
  /** When editing a single batch: { batchStart, batchEnd } for the range being replaced */
  const [batchEditOldRange, setBatchEditOldRange] = useState(null);

  const defaultRoomTypeForm = {
    name: "",
    bedType: "",
    bedCount: 1,
    maxOccupancy: 2,
    size: "",
    price: "",
    amenities: [],
  };
  const [roomTypeForm, setRoomTypeForm] = useState(defaultRoomTypeForm);
  const [roomTypeImageFiles, setRoomTypeImageFiles] = useState([]);
  const [editRoomTypeImageFiles, setEditRoomTypeImageFiles] = useState([]);

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

  const defaultRoomForm = {
    roomNumber: "",
    roomType: "",
    roomTypeId: "",
    price: "",
    maxOccupancy: "",
    bedType: "",
    bedCount: "",
    size: "",
    bathrooms: "",
    amenities: [],
  };

  const handleAddRoom = async (e) => {
    if (e) e.preventDefault();

    // For hotel properties, roomTypeId is required
    if (isHotel && !roomForm.roomTypeId) {
      toast.error("Please select a room type category first");
      return;
    }

    // Validate batch configuration
    if (!Array.isArray(roomBatches) || roomBatches.length === 0) {
      toast.error("Please add at least one batch range");
      return;
    }

    const nextErrors = roomBatches.map(() => ({}));
    const ranges = [];

    roomBatches.forEach((batch, index) => {
      const start = Number(batch.batchStart);
      const end = Number(batch.batchEnd);

      if (!Number.isFinite(start)) {
        nextErrors[index].start = "Batch start is required";
      }
      if (!Number.isFinite(end)) {
        nextErrors[index].end = "Batch end is required";
      }
      if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
        nextErrors[index].end = "End must be greater than or equal to start";
      }

      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        ranges.push({ start, end, index });
      }
    });

    // Prevent overlapping ranges within the same submission
    ranges.sort((a, b) => a.start - b.start);
    for (let i = 1; i < ranges.length; i++) {
      const prev = ranges[i - 1];
      const curr = ranges[i];
      if (curr.start <= prev.end) {
        nextErrors[prev.index].range = "Overlaps with another batch";
        nextErrors[curr.index].range = "Overlaps with another batch";
      }
    }

    const hasErrors = nextErrors.some(
      (err) => err.start || err.end || err.range,
    );
    if (hasErrors) {
      setRoomBatchErrors(nextErrors);
      toast.error("Please fix batch configuration errors");
      return;
    }

    setRoomBatchErrors(nextErrors);

    setIsSaving(true);
    const toastId = toast.loading(batchEditRoomTypeId ? "Updating room batch..." : "Adding room batch...");

    try {
      // Edit existing batch via dedicated endpoint
      if (batchEditRoomTypeId) {
        const firstBatch = roomBatches[0];
        const payload = {
          batchStart: Number(firstBatch.batchStart),
          batchEnd: Number(firstBatch.batchEnd),
        };
        if (batchEditOldRange) {
          payload.oldBatchStart = Number(batchEditOldRange.batchStart);
          payload.oldBatchEnd = Number(batchEditOldRange.batchEnd);
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("luxeboard.authToken")
            : null;
        const res = await fetch(
          `${baseUrl}/api/properties/${propertyId}/rooms/batch/${batchEditRoomTypeId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to update room batch");
        }

        toast.success("Room batch updated successfully!", { id: toastId });
      } else {
        // Initial batch creation: use existing createRoom endpoint
        const roomData = {
          batches: roomBatches.map((batch) => ({
            batchStart: Number(batch.batchStart),
            batchEnd: Number(batch.batchEnd),
          })),
        };

        // Hotel: send roomTypeId so backend can inherit all configuration from RoomType
        if (isHotel && roomForm.roomTypeId) {
          roomData.roomTypeId = roomForm.roomTypeId;
        }

        await addRoom(propertyId, roomData);

        toast.success("Batch added successfully!", { id: toastId });
      }

      setAddRoomModalOpen(false);
      setRoomForm(defaultRoomForm);
      setRoomBatches([{ batchStart: "", batchEnd: "" }]);
      setRoomBatchErrors([]);
      setBatchEditRoomTypeId(null);
      setBatchEditOldRange(null);
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to save room batch", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditRoom = (room) => {
    setEditingRoomId(room.id || room._id);
    setRoomForm({
      roomNumber: room.roomNumber || "",
      roomType: room.roomType || "",
      roomTypeId: room.roomTypeId || "",
      price: room.basePrice || room.price || "",
      maxOccupancy: room.maxOccupancy || "",
      bedType: room.bedType || "",
      bedCount: room.bedCount || "",
      size: room.size || "",
      bathrooms: room.bathrooms || "",
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
    });
    setEditRoomModalOpen(true);
  };

  const handleUpdateRoom = async (e) => {
    if (e) e.preventDefault();
    if (!editingRoomId) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating room...");

    try {
      const roomData = {
        roomNumber: roomForm.roomNumber,
        roomType: roomForm.roomType,
        basePrice: Number(roomForm.price),
        maxOccupancy: roomForm.maxOccupancy ? Number(roomForm.maxOccupancy) : 2,
      };

      // Add optional fields
      if (roomForm.bedType) roomData.bedType = roomForm.bedType;
      if (roomForm.bedCount) roomData.bedCount = Number(roomForm.bedCount);
      if (roomForm.size) roomData.size = Number(roomForm.size);
      if (roomForm.bedrooms) roomData.bedrooms = Number(roomForm.bedrooms);
      if (roomForm.bathrooms) roomData.bathrooms = Number(roomForm.bathrooms);
      if (Array.isArray(roomForm.amenities)) {
        roomData.amenities = roomForm.amenities;
      }

      await updateRoom(propertyId, editingRoomId, roomData);

      toast.success("Room updated successfully!", { id: toastId });
      setEditRoomModalOpen(false);
      setEditingRoomId(null);
      setRoomForm(defaultRoomForm);
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to update room", { id: toastId });
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
      const hasImages = roomTypeImageFiles && roomTypeImageFiles.length > 0;
      if (hasImages) {
        const formData = new FormData();
        formData.append("name", roomTypeForm.name.trim());
        formData.append("bedType", roomTypeForm.bedType || "Queen");
        formData.append("bedCount", String(Number(roomTypeForm.bedCount) || 1));
        formData.append("maxOccupancy", String(Number(roomTypeForm.maxOccupancy) || 2));
        formData.append("price", String(roomTypeForm.price));
        if (roomTypeForm.size && Number(roomTypeForm.size) > 0) formData.append("size", String(roomTypeForm.size));
        formData.append("amenities", JSON.stringify(Array.isArray(roomTypeForm.amenities) ? roomTypeForm.amenities : []));
        roomTypeImageFiles.forEach((file) => formData.append("images", file));
        await addRoomType(propertyId, formData);
      } else {
        const payload = {
          name: roomTypeForm.name.trim(),
          bedType: roomTypeForm.bedType || "Queen",
          bedCount: Number(roomTypeForm.bedCount) || 1,
          maxOccupancy: Number(roomTypeForm.maxOccupancy) || 2,
          price: Number(roomTypeForm.price),
          amenities: Array.isArray(roomTypeForm.amenities) ? roomTypeForm.amenities : [],
        };
        if (roomTypeForm.size && Number(roomTypeForm.size) > 0) payload.size = Number(roomTypeForm.size);
        await addRoomType(propertyId, payload);
      }
      toast.success("Room type category added. You can now add rooms under this category.", { id: toastId });
      setAddRoomTypeModalOpen(false);
      setRoomTypeForm(defaultRoomTypeForm);
      setRoomTypeImageFiles([]);
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
      amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
    });
    setEditRoomTypeImageFiles([]);
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
      const hasNewImages = editRoomTypeImageFiles && editRoomTypeImageFiles.length > 0;
      if (hasNewImages) {
        const formData = new FormData();
        formData.append("name", roomTypeForm.name.trim());
        formData.append("bedType", roomTypeForm.bedType || "Queen");
        formData.append("bedCount", String(Number(roomTypeForm.bedCount) || 1));
        formData.append("maxOccupancy", String(Number(roomTypeForm.maxOccupancy) || 2));
        formData.append("price", String(roomTypeForm.price));
        if (roomTypeForm.size != null && roomTypeForm.size !== "") formData.append("size", String(roomTypeForm.size));
        formData.append("amenities", JSON.stringify(Array.isArray(roomTypeForm.amenities) ? roomTypeForm.amenities : []));
        editRoomTypeImageFiles.forEach((file) => formData.append("images", file));
        await updateRoomType(propertyId, editingRoomTypeId, formData);
      } else {
        const payload = {
          name: roomTypeForm.name.trim(),
          bedType: roomTypeForm.bedType || "Queen",
          bedCount: Number(roomTypeForm.bedCount) || 1,
          maxOccupancy: Number(roomTypeForm.maxOccupancy) || 2,
          price: Number(roomTypeForm.price),
          amenities: Array.isArray(roomTypeForm.amenities) ? roomTypeForm.amenities : [],
        };
        if (roomTypeForm.size != null && roomTypeForm.size !== "") payload.size = Number(roomTypeForm.size);
        await updateRoomType(propertyId, editingRoomTypeId, payload);
      }
      toast.success("Room type updated.", { id: toastId });
      setEditRoomTypeModalOpen(false);
      setEditingRoomTypeId(null);
      setRoomTypeForm(defaultRoomTypeForm);
      setEditRoomTypeImageFiles([]);
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
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${property.isPubliclyVisible
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
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Room types ({roomTypes.length})
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Total rooms: <span className="font-semibold text-slate-900">{rooms.length}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isHotel && rooms.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setRoomsViewMode("categories")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${roomsViewMode === "categories"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => setRoomsViewMode("table")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${roomsViewMode === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Table View
                </button>
              </div>
            )}
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
        </div>

        {roomTypes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No room type categories yet. Add a category first (e.g. Deluxe King), then add rooms under each category.</p>
          </div>
        ) : roomsViewMode === "table" ? (
          <div>
            <DataTable
              headers={["Room Number", "Category", "Bed Type", "Bed Count", "Size (sq ft)", "Price/Night", "Max Occupancy", "Bathrooms", "Status", "Actions"]}
              rows={rooms.map((room) => {
                const roomType = roomTypes.find(rt => (rt.id || rt._id).toString() === (room.roomTypeId?.toString() || room.roomTypeId));
                return {
                  id: room.id || room._id,
                  cells: [
                    <span key="number" className="font-medium text-slate-900">{room.roomNumber}</span>,
                    <span key="category" className="text-slate-700">{roomType?.name || room.roomType || "—"}</span>,
                    <span key="bedType" className="text-slate-700">{room.bedType || "—"}</span>,
                    <span key="bedCount" className="text-slate-700">{room.bedCount || "—"}</span>,
                    <span key="size" className="text-slate-700">{room.size ? `${room.size} sq ft` : "—"}</span>,
                    <span key="price" className="font-medium text-slate-900">${Number(room.basePrice || room.price || 0).toLocaleString()}</span>,
                    <span key="occupancy" className="text-slate-700">{room.maxOccupancy || "—"}</span>,
                    <span key="bathrooms" className="text-slate-700">{room.bathrooms || "—"}</span>,
                    <span key="status" className={`px-2 py-1 rounded-full text-xs font-medium ${room.status === "available" ? "bg-green-100 text-green-700" :
                      room.status === "occupied" ? "bg-blue-100 text-blue-700" :
                        room.status === "maintenance" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-700"
                      }`}>{room.status || "available"}</span>,
                    <span key="actions" className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditRoom(room)}
                        className="text-slate-600 hover:text-slate-800 text-sm underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id || room._id)}
                        className="text-rose-600 hover:text-rose-700 text-sm underline"
                      >
                        Delete
                      </button>
                    </span>,
                  ],
                };
              })}
              emptyLabel="No rooms added yet"
            />
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {roomTypes.map((rt) => {
                  const rtId = roomTypeIdFromType(rt);
                  const roomsInCategory = rooms.filter((r) => roomTypeIdFromRoom(r) === rtId);
                  return (
                    <div key={rtId} className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-semibold text-slate-900">{rt.name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Inventory: <span className="font-semibold text-blue-600">{roomsInCategory.length}</span> room{roomsInCategory.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {roomTypes.map((rt) => {
              const rtId = roomTypeIdFromType(rt);
              const roomsInCategory = rooms.filter((r) => roomTypeIdFromRoom(r) === rtId);
              const isExpanded = expandedRoomTypes.has(rtId);
              const hasBatches = Array.isArray(rt.batches) && rt.batches.length > 0;
              const showEditBatch = hasBatches || roomsInCategory.length > 0;

              const firstImage = Array.isArray(rt.images) && rt.images.length > 0 ? rt.images[0] : null;
              const imageUrl = firstImage ? getImageUrl(firstImage) : null;
              return (
                <div key={rtId} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex">
                    <div className="w-28 h-28 shrink-0 bg-slate-200 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={rt.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 text-xs">No image</span>
                      )}
                    </div>
                    <div className="bg-slate-50 p-4 flex-1 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                        <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">
                          {rt.bedCount ?? 1}x {rt.bedType ?? "—"}
                        </span>
                        <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">
                          {rt.maxOccupancy ?? 2} guests
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          ${Number(rt.price ?? 0).toLocaleString()}/night
                        </span>
                        {rt.size && <span className="text-xs text-slate-600">{rt.size} sq ft</span>}
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-sm">
                        <span className="font-semibold text-slate-900">
                          Inventory:{" "}
                          <span className="text-blue-600">
                            {roomsInCategory.length}
                          </span>{" "}
                          room{roomsInCategory.length !== 1 ? "s" : ""}
                        </span>
                        {(hasBatches || roomsInCategory.length > 0) && (() => {
                          let batchStart, batchEnd;
                          if (hasBatches && rt.batches.length > 0) {
                            const starts = rt.batches.map((b) => Number(b.batchStart)).filter((n) => Number.isFinite(n));
                            const ends = rt.batches.map((b) => Number(b.batchEnd)).filter((n) => Number.isFinite(n));
                            if (starts.length === 0 || ends.length === 0) return null;
                            batchStart = Math.min(...starts);
                            batchEnd = Math.max(...ends);
                          } else {
                            const numeric = roomsInCategory.map((r) => Number(r.roomNumber)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
                            if (numeric.length === 0) return null;
                            batchStart = numeric[0];
                            batchEnd = numeric[numeric.length - 1];
                          }
                          return (
                            <div className="mt-1 text-slate-700">
                              <span>Batch-1: {batchStart} to {batchEnd}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Determine aggregate batch range (or derive from existing rooms if none)
                          let aggregatedStart = "";
                          let aggregatedEnd = "";

                          if (hasBatches) {
                            const starts = rt.batches.map((b) => b.batchStart);
                            const ends = rt.batches.map((b) => b.batchEnd);
                            aggregatedStart = String(Math.min(...starts));
                            aggregatedEnd = String(Math.max(...ends));
                          } else if (roomsInCategory.length > 0) {
                            const numeric = roomsInCategory
                              .map((r) => Number(r.roomNumber))
                              .filter((n) => Number.isFinite(n))
                              .sort((a, b) => a - b);
                            if (numeric.length > 0) {
                              aggregatedStart = String(numeric[0]);
                              aggregatedEnd = String(numeric[numeric.length - 1]);
                            }
                          }

                          setRoomForm({
                            roomNumber: "",
                            roomType: rt.name,
                            roomTypeId: String(rtId),
                            price: String(rt.price || ""),
                            maxOccupancy: String(rt.maxOccupancy || 2),
                            bedType: rt.bedType || "",
                            bedCount: rt.bedCount ? String(rt.bedCount) : "",
                            size: rt.size ? String(rt.size) : "",
                            bathrooms: "",
                            amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
                          });
                          setRoomBatches([
                            {
                              batchStart: aggregatedStart,
                              batchEnd: aggregatedEnd,
                            },
                          ]);
                          setRoomBatchErrors([]);
                          setBatchEditRoomTypeId(showEditBatch ? String(rtId) : null);
                          setBatchEditOldRange(
                            showEditBatch && aggregatedStart !== "" && aggregatedEnd !== ""
                              ? { batchStart: aggregatedStart, batchEnd: aggregatedEnd }
                              : null
                          );
                          setAddRoomModalOpen(true);
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        {showEditBatch ? "Edit" : "+ Add Room"}
                      </button>
                    </div>
                  </div>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditRoomType(rt)}
                      className="text-slate-600 hover:text-slate-800 text-sm underline"
                    >
                      Edit Category
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoomType(rtId)}
                      className="text-rose-600 hover:text-rose-700 text-sm underline"
                    >
                      Delete Category
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Room Type Modal */}
      <Modal
        title="Add room type category"
        description="Create a room type category (e.g. Deluxe King). You can then add individual rooms under this category."
        isOpen={isAddRoomTypeModalOpen}
        onClose={() => {
          setAddRoomTypeModalOpen(false);
          setRoomTypeForm(defaultRoomTypeForm);
          setRoomTypeImageFiles([]);
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
                    className={`rounded-full px-3 py-1.5 text-sm ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Images (optional)</p>
            <FileUpload
              label=""
              accept="image/jpeg,image/png,image/gif,image/webp"
              maxFiles={10}
              maxSizeMB={5}
              files={roomTypeImageFiles}
              onChange={setRoomTypeImageFiles}
              helpText="Upload images for this room category. First image will show on the card. Max 5MB each."
              showPreview={true}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Room Type Modal */}
      <Modal
        title="Edit room type category"
        description="Update room type details. Price changes will apply to all rooms of this type."
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
                    className={`rounded-full px-3 py-1.5 text-sm ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Add more images (optional)</p>
            <FileUpload
              label=""
              accept="image/jpeg,image/png,image/gif,image/webp"
              maxFiles={10}
              maxSizeMB={5}
              files={editRoomTypeImageFiles}
              onChange={setEditRoomTypeImageFiles}
              helpText="New uploads will be added to existing images. First image shows on the card."
              showPreview={true}
            />
          </div>
        </form>
      </Modal>

      {/* Room Batch Modal */}
      <Modal
        title="Room Batch"
        description={
          "Configure one or more batches of room numbers under this category. A separate room will be created for each number."
        }
        isOpen={isAddRoomModalOpen}
        onClose={() => {
          setAddRoomModalOpen(false);
          setRoomForm(defaultRoomForm);
          setRoomBatches([{ batchStart: "", batchEnd: "" }]);
          setRoomBatchErrors([]);
        }}
        primaryActionLabel={isSaving ? "Adding..." : "Room Batch"}
        onPrimaryAction={handleAddRoom}
        disabled={isSaving || roomBatches.length === 0}
      >
        <form className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Batch</h3>
            <div className="space-y-2">
              {roomBatches.map((batch, index) => {
                const errors = roomBatchErrors[index] || {};
                return (
                  <div
                    key={index}
                    className="grid grid-cols-2 gap-3 items-start"
                  >
                    <div>
                      <FormField
                        label="Batch Start"
                        type="number"
                        min="0"
                        value={batch.batchStart}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRoomBatches((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, batchStart: value } : row,
                            ),
                          );
                        }}
                        placeholder="201"
                      />
                      {errors.start && (
                        <p className="mt-1 text-xs text-rose-600">{errors.start}</p>
                      )}
                    </div>
                    <div>
                      <FormField
                        label="Batch End"
                        type="number"
                        min="0"
                        value={batch.batchEnd}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRoomBatches((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, batchEnd: value } : row,
                            ),
                          );
                        }}
                        placeholder="205"
                      />
                      {errors.end && (
                        <p className="mt-1 text-xs text-rose-600">{errors.end}</p>
                      )}
                    </div>
                    {errors.range && (
                      <p className="col-span-2 mt-1 text-xs text-rose-600">
                        {errors.range}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {isHotel && roomTypes.length === 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              Please create a room type category first before adding rooms.
            </div>
          )}
        </form>
      </Modal>

      {/* Edit Room Modal */}
      <Modal
        title="Edit Room"
        description="Update room details. Each room can have different properties even within the same category."
        isOpen={isEditRoomModalOpen}
        onClose={() => {
          setEditRoomModalOpen(false);
          setEditingRoomId(null);
          setRoomForm(defaultRoomForm);
        }}
        primaryActionLabel={isSaving ? "Saving..." : "Save Changes"}
        onPrimaryAction={handleUpdateRoom}
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
              label="Max Occupancy *"
              type="number"
              min="1"
              value={roomForm.maxOccupancy}
              onChange={(e) => setRoomForm({ ...roomForm, maxOccupancy: e.target.value })}
              placeholder="2"
            />
            <Select
              label="Bed Type"
              value={roomForm.bedType}
              onChange={(value) => setRoomForm({ ...roomForm, bedType: value })}
              placeholder="Select bed type"
              options={["King", "Queen", "Double", "Twin", "Single", "Bunk"]}
            />
            <FormField
              label="Bed Count"
              type="number"
              min="1"
              value={roomForm.bedCount}
              onChange={(e) => setRoomForm({ ...roomForm, bedCount: e.target.value })}
              placeholder="1"
            />
            <FormField
              label="Size (sq ft)"
              type="number"
              min="0"
              value={roomForm.size}
              onChange={(e) => setRoomForm({ ...roomForm, size: e.target.value })}
              placeholder="400"
            />
            <FormField
              label="Bathrooms"
              type="number"
              min="0"
              value={roomForm.bathrooms}
              onChange={(e) => setRoomForm({ ...roomForm, bathrooms: e.target.value })}
              placeholder="1"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Room Amenities</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_AMENITIES.map((a) => {
                const selected = (roomForm.amenities || []).includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setRoomForm({
                        ...roomForm,
                        amenities: selected
                          ? (roomForm.amenities || []).filter((x) => x !== a)
                          : [...(roomForm.amenities || []), a],
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-sm ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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

    </div>
  );
}
