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
  const [roomBatches, setRoomBatches] = useState([{ batchStart: "", batchEnd: "" }]);
  const [roomBatchErrors, setRoomBatchErrors] = useState([]);
  /** When editing a batch: { roomTypeId, batchStart, batchEnd } */
  const [editingBatch, setEditingBatch] = useState(null);

  const openAddRoomModal = (roomTypeId) => {
    setEditingBatch(null);
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
      setRoomBatches([{ batchStart: "", batchEnd: "" }]);
      setRoomBatchErrors([]);
      setIsAddRoomModalOpen(true);
    }
  };

  const openEditBatchModal = (roomTypeId, batchStart, batchEnd) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (!roomType) return;
    setSelectedRoomTypeId(roomTypeId);
    setEditingBatch({ roomTypeId, batchStart, batchEnd });
    setRoomForm({
      roomNumber: "",
      price: String(roomType.price || ""),
      maxOccupancy: String(roomType.maxOccupancy || 2),
      bedType: roomType.bedType || "",
      bedCount: roomType.bedCount ? String(roomType.bedCount) : "",
      size: roomType.size || "",
      bedrooms: "",
      bathrooms: "",
      amenities: Array.isArray(roomType.amenities) ? roomType.amenities : [],
    });
    setRoomBatches([{ batchStart: String(batchStart), batchEnd: String(batchEnd) }]);
    setRoomBatchErrors([]);
    setIsAddRoomModalOpen(true);
  };

  const handleAddRoom = () => {
    if (!selectedRoomTypeId) return;

    // Validate batch configuration
    if (!Array.isArray(roomBatches) || roomBatches.length === 0) {
      alert("Please add at least one batch range");
      return;
    }

    const nextErrors = roomBatches.map(() => ({}));
    const ranges = [];
    const allNumbers = [];

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
        nextErrors[index].end = "End must be ≥ start";
      }

      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        ranges.push({ start, end, index });
        for (let n = start; n <= end; n++) {
          allNumbers.push(String(n).trim());
        }
      }
    });

    // Prevent overlapping ranges within this submission
    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.start <= prev.end) {
        nextErrors[prev.index].range = "Overlaps another batch";
        nextErrors[curr.index].range = "Overlaps another batch";
      }
    }

    // Prevent duplicate numbers within this submission
    const seen = new Set();
    for (const num of allNumbers) {
      if (seen.has(num)) {
        // mark a generic range error
        nextErrors.forEach((err) => {
          if (!err.range) err.range = "Overlapping batches create duplicate room numbers";
        });
        break;
      }
      seen.add(num);
    }

    // Check against existing rooms for this room type (when editing a batch, exclude the old range)
    let existingForType = rooms.filter((r) => r.roomTypeId === selectedRoomTypeId);
    if (editingBatch && editingBatch.roomTypeId === selectedRoomTypeId) {
      const oldStart = Number(editingBatch.batchStart);
      const oldEnd = Number(editingBatch.batchEnd);
      if (Number.isFinite(oldStart) && Number.isFinite(oldEnd)) {
        existingForType = existingForType.filter((r) => {
          const n = Number(r.roomNumber);
          return !Number.isFinite(n) || n < oldStart || n > oldEnd;
        });
      }
    }
    const existingNumbers = new Set(
      existingForType.map((r) => String(r.roomNumber).trim()),
    );
    const duplicateInExisting = allNumbers.find((num) =>
      existingNumbers.has(num),
    );
    if (duplicateInExisting) {
      // Attach a generic error; message via alert for clarity
      nextErrors[0].range =
        nextErrors[0].range ||
        `Room number ${duplicateInExisting} already exists for this category`;
    }

    const hasErrors = nextErrors.some(
      (err) => err.start || err.end || err.range,
    );
    if (hasErrors) {
      setRoomBatchErrors(nextErrors);
      if (duplicateInExisting) {
        alert(`Room number ${duplicateInExisting} already exists for this category`);
      } else {
        alert("Please fix batch configuration errors");
      }
      return;
    }

    setRoomBatchErrors(nextErrors);

    // When editing a batch, remove rooms in the old range first
    if (editingBatch && editingBatch.roomTypeId === selectedRoomTypeId) {
      const oldStart = Number(editingBatch.batchStart);
      const oldEnd = Number(editingBatch.batchEnd);
      if (Number.isFinite(oldStart) && Number.isFinite(oldEnd)) {
        const toRemove = rooms.filter(
          (r) =>
            r.roomTypeId === selectedRoomTypeId &&
            (() => {
              const n = Number(r.roomNumber);
              return Number.isFinite(n) && n >= oldStart && n <= oldEnd;
            })()
        );
        toRemove.forEach((room) => removeRoom(room.id));
      }
    }

    // Add one room entry per generated number
    allNumbers.forEach((num) => {
      addRoom({
        roomTypeId: selectedRoomTypeId,
        roomNumber: num,
        price: roomForm.price || undefined,
        maxOccupancy: roomForm.maxOccupancy || undefined,
        bedType: roomForm.bedType || undefined,
        bedCount: roomForm.bedCount || undefined,
        size: roomForm.size || undefined,
        bathrooms: roomForm.bathrooms || undefined,
        amenities: roomForm.amenities || [],
      });
    });

    setIsAddRoomModalOpen(false);
    setRoomForm({
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
    setRoomBatches([{ batchStart: "", batchEnd: "" }]);
    setRoomBatchErrors([]);
    setSelectedRoomTypeId(null);
    setEditingBatch(null);
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
                        <div className="mt-2 flex flex-col gap-1 text-sm">
                          <span className="font-semibold text-slate-900">
                            Inventory: <span className="text-blue-600">{roomsInCategory.length}</span> room{roomsInCategory.length !== 1 ? "s" : ""}
                          </span>
                          {roomsInCategory.length > 0 && (() => {
                            const numeric = roomsInCategory.map((r) => Number(r.roomNumber)).filter((n) => Number.isFinite(n));
                            const sorted = [...new Set(numeric)].sort((a, b) => a - b);
                            if (sorted.length === 0) return null;
                            const batchStart = sorted[0];
                            const batchEnd = sorted[sorted.length - 1];
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
                            if (roomsInCategory.length > 0) {
                              const numeric = roomsInCategory.map((r) => Number(r.roomNumber)).filter((n) => Number.isFinite(n));
                              const sorted = [...new Set(numeric)].sort((a, b) => a - b);
                              if (sorted.length > 0) {
                                openEditBatchModal(rt.id, sorted[0], sorted[sorted.length - 1]);
                              } else {
                                openAddRoomModal(rt.id);
                              }
                            } else {
                              openAddRoomModal(rt.id);
                            }
                          }}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          {roomsInCategory.length > 0 ? "Edit" : "+ Add Room"}
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

        {/* Room Batch Modal */}
        <Modal
          title="Room Batch"
          description="Configure one or more batches of room numbers for this category. A separate room will be created for each number."
          isOpen={isAddRoomModalOpen}
          onClose={() => {
            setIsAddRoomModalOpen(false);
            setSelectedRoomTypeId(null);
            setEditingBatch(null);
            setRoomForm({
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
            setRoomBatches([{ batchStart: "", batchEnd: "" }]);
            setRoomBatchErrors([]);
          }}
          primaryActionLabel="Room Batch"
          onPrimaryAction={handleAddRoom}
          disabled={roomBatches.length === 0}
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddRoom(); }}>
            {/* Room Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700">Room Configuration</h3>
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
          </form>
        </Modal>
      </div>
    </StepLayout>
  );
}
