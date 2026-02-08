"use client";

import StepLayout from "./StepLayout";
import AmenityPills from "./AmenityPills";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import { ROOM_AMENITIES } from "../_constants/amenities";

export default function Step4HotelRoomTypes({ roomTypes, roomTypeForm, setRoomTypeForm, addRoomType, removeRoomType, toggleRoomAmenity, onBack, onNext, isSaving = false }) {
  return (
    <StepLayout stepLabel="Room Types & Inventory" totalSteps={5} currentStep={4} onBack={onBack} onNext={onNext} nextDisabled={roomTypes.length === 0} isSaving={isSaving}>
      <div className="space-y-6">
        {/* Add Room Type Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Add a Room Type</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <FormField label="Room Type Name *" value={roomTypeForm.name} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })} placeholder="e.g. Deluxe King, Standard Twin" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Bed Type" value={roomTypeForm.bedType} onChange={(v) => setRoomTypeForm({ ...roomTypeForm, bedType: v })} options={["King", "Queen", "Twin", "Double", "Single", "Bunk"]} />
              <FormField label="Bed Count" type="number" min="1" value={String(roomTypeForm.bedCount)} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, bedCount: Number(e.target.value) })} />
            </div>
            <FormField label="Max Occupancy" type="number" min="1" value={roomTypeForm.maxOccupancy} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxOccupancy: e.target.value })} placeholder="2" />
            <FormField label="Price / Night (USD) *" type="number" min="0" step="0.01" value={roomTypeForm.price} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, price: e.target.value })} placeholder="100" />
            <FormField label="No. of Rooms *" type="number" min="1" value={roomTypeForm.inventory} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, inventory: e.target.value })} placeholder="10" />
            <FormField label="Size (sq ft)" type="number" min="0" value={roomTypeForm.size} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, size: e.target.value })} placeholder="350" />
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Room Amenities</p>
            <AmenityPills items={ROOM_AMENITIES} selected={roomTypeForm.amenities || []} onToggle={toggleRoomAmenity} />
          </div>

          <button type="button" onClick={addRoomType} className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
            + Add Room Type
          </button>
        </div>

        {/* Room Type List */}
        {roomTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Room Types ({roomTypes.length})</h2>
            <div className="space-y-3">
              {roomTypes.map((rt) => (
                <div key={rt.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-900">{rt.name}</span>
                      <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">{rt.bedCount} {rt.bedType}</span>
                      <span className="text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">{rt.maxOccupancy} guests</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">${rt.price}/night</span>
                      <span>{rt.inventory} room{Number(rt.inventory) !== 1 ? "s" : ""}</span>
                      {rt.size && <span>{rt.size} sq ft</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeRoomType(rt.id)} className="ml-4 text-slate-400 hover:text-rose-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-900">
              Total inventory: {roomTypes.reduce((sum, rt) => sum + (Number(rt.inventory) || 0), 0)} rooms across {roomTypes.length} type{roomTypes.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
