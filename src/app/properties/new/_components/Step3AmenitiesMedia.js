"use client";

import StepLayout from "./StepLayout";
import AmenityPills from "./AmenityPills";
import FormField from "@/components/common/FormField";
import FileUpload from "@/components/common/FileUpload";
import { getImageUrl } from "@/lib/api";
import { AIRBNB_AMENITIES, HOTEL_AMENITIES, AIRBNB_AMENITY_LABELS, HOTEL_AMENITY_LABELS } from "../_constants/amenities";

export default function Step3AmenitiesMedia({
  formData,
  handleChange,
  toggleAmenity,
  images,
  setImages,
  existingImages = [],
  imagesToRemove = [],
  removeExistingImage,
  isHotelFlow,
  onBack,
  onNext,
  nextDisabled = false,
  isSaving = false,
}) {
  const amenityCats = isHotelFlow ? HOTEL_AMENITIES : AIRBNB_AMENITIES;
  const catLabels = isHotelFlow ? HOTEL_AMENITY_LABELS : AIRBNB_AMENITY_LABELS;
  const visibleExisting = (existingImages || []).filter((p) => !(imagesToRemove || []).includes(p));

  return (
    <StepLayout
      stepLabel="Amenities, Photos & Description"
      totalSteps={5}
      currentStep={3}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={nextDisabled}
      isSaving={isSaving}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        {/* Amenities */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {isHotelFlow ? "Hotel Facilities & Services" : "Amenities"}
          </h2>
          {Object.entries(amenityCats).map(([key, items]) => (
            <div key={key} className="mb-5">
              <p className="text-sm font-medium text-slate-700 mb-2">{catLabels[key]}</p>
              <AmenityPills items={items} selected={formData.amenities} onToggle={toggleAmenity} />
            </div>
          ))}
        </div>

        {/* Photos */}
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Photos</h2>
          {visibleExisting.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Existing photos</p>
              <div className="flex flex-wrap gap-3">
                {visibleExisting.map((pathOrUrl) => {
                  const src = getImageUrl(pathOrUrl);
                  return (
                    <div key={pathOrUrl} className="relative shrink-0 rounded-lg border border-slate-200 overflow-hidden group">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-100">
                        {src ? (
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Photo</div>
                        )}
                      </div>
                      {removeExistingImage && (
                        <button
                          type="button"
                          onClick={() => removeExistingImage(pathOrUrl)}
                          className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-slate-500 shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          aria-label="Remove photo"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <FileUpload
            label={visibleExisting.length > 0 ? "Add more photos" : ""}
            files={images}
            onChange={setImages}
            maxFiles={15}
            maxSizeMB={5}
            helpText={isHotelFlow ? "Upload photos of lobby, exterior, facilities, etc." : "Upload at least 5 high-quality photos"}
          />
        </div>

        {/* Description */}
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
          <FormField
            label="Description"
            as="textarea"
            rows={5}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder={isHotelFlow ? "Describe your hotel, its unique features, and what guests can expect..." : "Describe your property and what makes it special..."}
            maxLength={500}
          />
        </div>
      </div>
    </StepLayout>
  );
}
