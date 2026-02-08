"use client";

import StepLayout from "./StepLayout";
import Counter from "./Counter";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";

export default function Step2Details({ formData, handleChange, isHotelFlow, isAirbnbFlow, onBack, onNext, isSaving = false }) {
  const nextDisabled = !formData.title || !formData.location || (isAirbnbFlow && !formData.placeType);

  return (
    <StepLayout
      stepLabel={isHotelFlow ? "Hotel Details" : "Property Details"}
      totalSteps={5}
      currentStep={2}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={nextDisabled}
      isSaving={isSaving}
    >
      <form onSubmit={(e) => { e.preventDefault(); onNext(); }}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          {/* Name & Type */}
          <div className="grid lg:grid-cols-2 gap-6">
            <FormField
              label={isHotelFlow ? "Hotel Name *" : "Property Title *"}
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder={isHotelFlow ? "e.g. Grand Plaza Hotel" : "e.g. Cozy Downtown Apartment"}
            />
            {isHotelFlow ? (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Hotel Type"
                  value={formData.placeType || "hotel"}
                  onChange={(v) => handleChange("placeType", v)}
                  options={["Hotel", "Boutique hotel", "Resort", "Aparthotel", "Guesthouse", "Hostel"]}
                />
                <Select
                  label="Star Rating"
                  value={formData.starRating}
                  onChange={(v) => handleChange("starRating", v)}
                  placeholder="Select"
                  options={["1", "2", "3", "4", "5"]}
                />
              </div>
            ) : (
              <Select
                label="Property Type *"
                value={formData.placeType}
                onChange={(v) => handleChange("placeType", v)}
                placeholder="Select property type"
                options={["Apartment", "House", "Villa", "Cabin", "Condo", "Guesthouse", "Loft", "Townhouse", "Cottage", "Other"]}
              />
            )}
          </div>

          {/* Location */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
            <div className="grid lg:grid-cols-2 gap-4">
              <FormField label="City / Location *" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="e.g. Dubai, UAE" />
              <FormField label="Full Address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Street, building, area" />
            </div>
          </div>

          {/* Capacity — Airbnb only */}
          {isAirbnbFlow && (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Capacity & Rooms</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Counter label="Guests" value={Number(formData.maxGuests) || 1} min={1} onChange={(v) => handleChange("maxGuests", v)} />
                <Counter label="Bedrooms" value={Number(formData.bedrooms) || 0} min={0} onChange={(v) => handleChange("bedrooms", String(v))} />
                <Counter label="Beds" value={Number(formData.beds) || 1} min={0} onChange={(v) => handleChange("beds", v)} />
                <Counter label="Bathrooms" value={Number(formData.bathrooms) || 1} min={0} onChange={(v) => handleChange("bathrooms", String(v))} />
              </div>
              <div className="mt-4">
                <Select
                  label="Guest Access"
                  value={formData.guestPlaceType}
                  onChange={(v) => handleChange("guestPlaceType", v)}
                  options={[
                    { value: "entire_place", label: "Entire place" },
                    { value: "room", label: "Private room" },
                    { value: "shared_room", label: "Shared room" },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Check-in & Policies — Hotel only */}
          {isHotelFlow && (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Check-in & Policies</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField label="Check-in Time" type="time" value={formData.checkInTime} onChange={(e) => handleChange("checkInTime", e.target.value)} />
                <FormField label="Check-out Time" type="time" value={formData.checkOutTime} onChange={(e) => handleChange("checkOutTime", e.target.value)} />
                <Select label="Smoking" value={formData.smokingPolicy} onChange={(v) => handleChange("smokingPolicy", v)} options={[{ value: "no_smoking", label: "No smoking" }, { value: "designated_areas", label: "Designated areas" }, { value: "allowed", label: "Allowed" }]} />
                <Select label="Pets" value={formData.petPolicy} onChange={(v) => handleChange("petPolicy", v)} options={[{ value: "no_pets", label: "No pets" }, { value: "pets_allowed", label: "Pets allowed" }, { value: "on_request", label: "On request" }]} />
              </div>
            </div>
          )}
        </div>
      </form>
    </StepLayout>
  );
}
