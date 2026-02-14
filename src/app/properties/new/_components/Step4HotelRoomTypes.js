"use client";

import { useState } from "react";
import StepLayout from "./StepLayout";
import AmenityPills from "./AmenityPills";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import { ROOM_AMENITIES } from "../_constants/amenities";

export default function Step4HotelRoomTypes({ 
  roomTypes, 
  roomTypeForm, 
  setRoomTypeForm, 
  addRoomType, 
  removeRoomType, 
  toggleRoomAmenity,
  rooms = [],
  addRoom,
  removeRoom,
  expandedRoomTypes,
  setExpandedRoomTypes,
  onBack, 
  onNext, 
  isSaving = false 
}) {
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    price: "",
    maxOccupancy: "",
    bedType: "",
    bedCount: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    amenities: [],
  });

  const toggleRoomTypeExpansion = (roomTypeId) => {
    const newExpanded = new Set(expandedRoomTypes);
    if (newExpanded.has(roomTypeId)) {
      newExpanded.delete(roomTypeId);
    } else {
      newExpanded.add(roomTypeId);
    }
    setExpandedRoomTypes(newExpanded);
  };

  const openAddRoomModal = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (roomType) {
      setSelectedRoomTypeId(roomTypeId);
      setRoomForm({
        roomNumber: "",
        price: String(roomType.price || ""),
        maxOccupancy: String(roomType.maxOccupancy || 2),
        bedType: roomType.bedType || "",
        bedCount: roomType.bedCount ? String(roomType.bedCount) : "",
        size: roomType.size ? String(roomType.size) : "",
        bedrooms: "",
        bathrooms: "",
        amenities: Array.isArray(roomType.amenities) ? roomType.amenities : [],
      });
      setIsAddRoomModalOpen(true);
    }
  };

  const handleAddRoom = () => {
    if (!selectedRoomTypeId) return;
    if (!roomForm.roomNumber || !roomForm.roomNumber.trim()) {
      alert("Room number is required");
      return;
    }
    
    // Check for duplicate room numbers
    const existingRoom = rooms.find(r => 
      r.roomTypeId === selectedRoomTypeId && 
      r.roomNumber === roomForm.roomNumber.trim()
    );
    if (existingRoom) {
      alert(`Room number ${roomForm.roomNumber} already exists for this category`);
      return;
    }

    addRoom({
      roomTypeId: selectedRoomTypeId,
      roomNumber: roomForm.roomNumber.trim(),
      price: roomForm.price || undefined,
      maxOccupancy: roomForm.maxOccupancy || undefined,
      bedType: roomForm.bedType || undefined,
      bedCount: roomForm.bedCount || undefined,
      size: roomForm.size || undefined,
      bathrooms: roomForm.bathrooms || undefined,
      amenities: roomForm.amenities || [],
    });

    setIsAddRoomModalOpen(false);
    setRoomForm({
      roomNumber: "",
      price: "",
      maxOccupancy: "",
      bedType: "",
      bedCount: "",
      size: "",
      bathrooms: "",
      amenities: [],
    });
    setSelectedRoomTypeId(null);
  };

  const getRoomsForRoomType = (roomTypeId) => {
    return rooms.filter(r => r.roomTypeId === roomTypeId);
  };

  const totalRooms = rooms.length;

  return (
    <StepLayout 
      stepLabel="Room Types & Inventory" 
      totalSteps={5} 
      currentStep={4} 
      onBack={onBack} 
      onNext={onNext} 
      nextDisabled={roomTypes.length === 0} 
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Add Room Type Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Add a Room Type</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <FormField 
              label="Room Type Name *" 
              value={roomTypeForm.name} 
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })} 
              placeholder="e.g. Deluxe King, Standard Twin" 
            />
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Bed Type" 
                value={roomTypeForm.bedType} 
                onChange={(v) => setRoomTypeForm({ ...roomTypeForm, bedType: v })} 
                options={["King", "Queen", "Twin", "Double", "Single", "Bunk"]} 
              />
              <FormField 
                label="Bed Count" 
                type="number" 
                min="1" 
                value={String(roomTypeForm.bedCount)} 
                onChange={(e) => setRoomTypeForm({ ...roomTypeForm, bedCount: Number(e.target.value) })} 
              />
            </div>
            <FormField 
              label="Max Occupancy" 
              type="number" 
              min="1" 
              value={roomTypeForm.maxOccupancy} 
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxOccupancy: e.target.value })} 
              placeholder="2" 
            />
            <FormField 
              label="Price / Night (USD) *" 
              type="number" 
              min="0" 
              step="0.01" 
              value={roomTypeForm.price} 
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, price: e.target.value })} 
              placeholder="100" 
            />
            <FormField 
              label="Size (sq ft)" 
              type="number" 
              min="0" 
              value={roomTypeForm.size} 
              onChange={(e) => setRoomTypeForm({ ...roomTypeForm, size: e.target.value })} 
              placeholder="350" 
            />
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Room Amenities</p>
            <AmenityPills items={ROOM_AMENITIES} selected={roomTypeForm.amenities || []} onToggle={toggleRoomAmenity} />
          </div>

          <button 
            type="button" 
            onClick={addRoomType} 
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            + Add Room Type
          </button>
        </div>

        {/* Room Type List with Rooms */}
        {roomTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Room Types ({roomTypes.length})</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Total rooms: <span className="font-semibold text-blue-600">{totalRooms}</span>
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {roomTypes.map((rt) => {
                const roomsInCategory = getRoomsForRoomType(rt.id);
                const isExpanded = expandedRoomTypes.has(rt.id);
                
                return (
                  <div key={rt.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-slate-900">{rt.name}</span>
                          <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">
                            {rt.bedCount} {rt.bedType}
                          </span>
                          <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">
                            {rt.maxOccupancy} guests
                          </span>
                          <span className="text-sm font-semibold text-slate-900">${rt.price}/night</span>
                          {rt.size && <span className="text-xs text-slate-600">{rt.size} sq ft</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="font-semibold text-slate-900">
                            Inventory: <span className="text-blue-600">{roomsInCategory.length}</span> room{roomsInCategory.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAddRoomModal(rt.id)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          + Add Room
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRoomTypeExpansion(rt.id)}
                          className="p-2 text-slate-600 hover:text-slate-900"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRoomType(rt.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 bg-white">
                        {roomsInCategory.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">
                            No rooms added yet. Click "+ Add Room" to add rooms under this category.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {roomsInCategory.map((room) => (
                              <div
                                key={room.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-slate-900">Room {room.roomNumber}</span>
                                    {room.bedCount && room.bedType && (
                                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                                        {room.bedCount}x {room.bedType}
                                      </span>
                                    )}
                                    {room.size && (
                                      <span className="text-xs text-slate-500">{room.size} sq ft</span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-600 flex-wrap">
                                    {room.price && <span>${Number(room.price).toLocaleString()}/night</span>}
                                    {room.maxOccupancy && (
                                      <>
                                        {room.price && <span>•</span>}
                                        <span>Max {room.maxOccupancy} guests</span>
                                      </>
                                    )}
                                    {room.bathrooms && <span>• {room.bathrooms} bathroom{room.bathrooms !== 1 ? 's' : ''}</span>}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRoom(room.id)}
                                  className="text-rose-600 hover:text-rose-700 text-sm underline ml-4"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {totalRooms > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-900">
                <p className="font-medium">
                  ✓ {totalRooms} room{totalRooms !== 1 ? "s" : ""} will be created with this property
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Room Modal */}
        <Modal
          title="Add Room"
          description="Add a room to this category. You can customize room details or use the category defaults."
          isOpen={isAddRoomModalOpen}
          onClose={() => {
            setIsAddRoomModalOpen(false);
            setSelectedRoomTypeId(null);
            setRoomForm({
              roomNumber: "",
              price: "",
              maxOccupancy: "",
              bedType: "",
              bedCount: "",
              size: "",
              bathrooms: "",
              amenities: [],
            });
          }}
          primaryActionLabel="Add Room"
          onPrimaryAction={handleAddRoom}
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddRoom(); }}>
            <FormField
              label="Room Number *"
              value={roomForm.roomNumber}
              onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              placeholder="101"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Price per Night (USD)"
                type="number"
                min="0"
                step="0.01"
                value={roomForm.price}
                onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                placeholder="Auto-filled from category"
              />
              <FormField
                label="Max Occupancy"
                type="number"
                min="1"
                value={roomForm.maxOccupancy}
                onChange={(e) => setRoomForm({ ...roomForm, maxOccupancy: e.target.value })}
                placeholder="Auto-filled from category"
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
                placeholder="350"
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
              <p className="text-sm font-medium text-slate-700 mb-2">Room Amenities (optional)</p>
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
      </div>
    </StepLayout>
  );
}
