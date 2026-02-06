"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getPropertyById,
  updateProperty,
  getRooms,
  getUnits,
  addRoom,
  addUnit,
  updateRoom,
  updateUnit,
  deleteRoom,
  deleteUnit,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import DataTable from "@/components/common/DataTable";
import { API_BASE_URL } from "@/lib/api";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [units, setUnits] = useState([]);
  const [isHotel, setIsHotel] = useState(false);

  const [isAddRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [isAddUnitModalOpen, setAddUnitModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomType: "",
    price: "",
    maxOccupancy: "",
  });

  const [unitForm, setUnitForm] = useState({
    unitName: "",
    price: "",
    maxOccupancy: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadProperty();
  }, [isAuthenticated, propertyId]);

  const loadProperty = async () => {
    try {
      setIsLoading(true);
      const propertyData = await getPropertyById(propertyId);
      setProperty(propertyData);

      // Determine if it's a hotel or airbnb property
      const isHotelProperty =
        propertyData.propertyType?.toLowerCase().includes("hotel") ||
        propertyData.propertyType?.toLowerCase() === "hotel";
      setIsHotel(isHotelProperty);

      // Load rooms or units
      if (isHotelProperty) {
        const roomsData = await getRooms(propertyId);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } else {
        const unitsData = await getUnits(propertyId);
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load property");
      router.push("/properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
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

  const handleAddUnit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Adding unit...");

    try {
      await addUnit(propertyId, {
        unitName: unitForm.unitName,
        price: Number(unitForm.price),
        maxOccupancy: unitForm.maxOccupancy ? Number(unitForm.maxOccupancy) : 2,
      });

      toast.success("Unit added successfully!", { id: toastId });
      setAddUnitModalOpen(false);
      setUnitForm({ unitName: "", price: "", maxOccupancy: "" });
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to add unit", { id: toastId });
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

  const handleDeleteUnit = async (unitId) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;

    const toastId = toast.loading("Deleting unit...");
    try {
      await deleteUnit(propertyId, unitId);
      toast.success("Unit deleted successfully!", { id: toastId });
      loadProperty();
    } catch (error) {
      toast.error(error.message || "Failed to delete unit", { id: toastId });
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
      ? property.images.map((img) => `${API_BASE_URL}${img}`)
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

        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Property Info Card */}
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

      {/* Rooms/Units Section */}
      {isHotel ? (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Rooms ({rooms.length})
            </h2>
            <button
              onClick={() => setAddRoomModalOpen(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Room
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No rooms added yet. Click "Add Room" to get started.</p>
            </div>
          ) : (
            <DataTable
              headers={["Room #", "Type", "Price/Night", "Max Occupancy", "Status", "Actions"]}
              rows={rooms.map((room) => ({
                id: room.id || room._id,
                cells: [
                  room.roomNumber,
                  room.roomType,
                  `$${room.price}`,
                  room.maxOccupancy || 2,
                  <span
                    key="status"
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      room.status === "clean"
                        ? "bg-green-100 text-green-700"
                        : room.status === "dirty"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {room.status || "clean"}
                  </span>,
                  <button
                    key="delete"
                    onClick={() => handleDeleteRoom(room.id || room._id)}
                    className="text-rose-600 hover:text-rose-700 text-sm underline"
                  >
                    Delete
                  </button>,
                ],
              }))}
            />
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Units ({units.length})
            </h2>
            <button
              onClick={() => setAddUnitModalOpen(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Unit
            </button>
          </div>

          {units.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No units added. This property uses base pricing.</p>
              <p className="text-sm mt-2">Add units if you have multiple rental spaces.</p>
            </div>
          ) : (
            <DataTable
              headers={["Unit Name", "Price/Night", "Max Occupancy", "Actions"]}
              rows={units.map((unit) => ({
                id: unit.id || unit._id,
                cells: [
                  unit.unitName,
                  `$${unit.price}`,
                  unit.maxOccupancy || 2,
                  <button
                    key="delete"
                    onClick={() => handleDeleteUnit(unit.id || unit._id)}
                    className="text-rose-600 hover:text-rose-700 text-sm underline"
                  >
                    Delete
                  </button>,
                ],
              }))}
            />
          )}
        </div>
      )}

      {/* Add Room Modal */}
      <Modal
        title="Add Room"
        description="Add a new room to this hotel property"
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

      {/* Add Unit Modal */}
      <Modal
        title="Add Unit"
        description="Add a new unit to this property"
        isOpen={isAddUnitModalOpen}
        onClose={() => {
          setAddUnitModalOpen(false);
          setUnitForm({ unitName: "", price: "", maxOccupancy: "" });
        }}
        primaryActionLabel={isSaving ? "Adding..." : "Add Unit"}
        onPrimaryAction={handleAddUnit}
        disabled={isSaving}
      >
        <form className="space-y-4">
          <FormField
            label="Unit Name *"
            value={unitForm.unitName}
            onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
            placeholder="Unit A, Villa 1, etc."
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Price per Night (USD) *"
              type="number"
              min="0"
              step="0.01"
              value={unitForm.price}
              onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })}
              placeholder="100"
            />

            <FormField
              label="Max Occupancy"
              type="number"
              min="1"
              value={unitForm.maxOccupancy}
              onChange={(e) => setUnitForm({ ...unitForm, maxOccupancy: e.target.value })}
              placeholder="2"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
