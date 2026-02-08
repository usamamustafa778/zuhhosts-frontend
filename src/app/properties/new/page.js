"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  createProperty,
  updateProperty,
  getPropertyById,
  addRoomType,
  getMyTenant,
} from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";

const DRAFT_STORAGE_KEY = "property-draft-id";
const STEP_STORAGE_KEY = "property-draft-step";

// Step components
import Step1ModelSelect from "./_components/Step1ModelSelect";
import Step2Details from "./_components/Step2Details";
import Step3AmenitiesMedia from "./_components/Step3AmenitiesMedia";
import Step4HotelRoomTypes from "./_components/Step4HotelRoomTypes";
import Step4AirbnbPricing from "./_components/Step4AirbnbPricing";
import Step5Review from "./_components/Step5Review";

// ─── Initial state factories ────────────────────────────────────
const INITIAL_FORM_DATA = {
  title: "",
  description: "",
  location: "",
  address: "",
  starRating: "",
  bedrooms: "",
  bathrooms: "1",
  area: "",
  price: "",
  weekendPremiumPercent: 0,
  currency: "USD",
  amenities: [],
  highlights: [],
  // Airbnb-specific
  placeType: "",
  guestPlaceType: "entire_place",
  maxGuests: 2,
  beds: 1,
  discounts: { newListing: false, lastMinute: false, weekly: false, monthly: false },
  safetyFeatures: { exteriorCamera: false, noiseMonitor: false, weapons: false },
  // Hotel-specific
  checkInTime: "14:00",
  checkOutTime: "11:00",
  smokingPolicy: "no_smoking",
  petPolicy: "no_pets",
  cancellationPolicy: "moderate",
};

const INITIAL_ROOM_TYPE_FORM = {
  name: "",
  bedType: "King",
  bedCount: 1,
  maxOccupancy: "2",
  size: "",
  price: "",
  inventory: "1",
  amenities: [],
};

// ═════════════════════════════════════════════════════════════════
export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [tenant, setTenant] = useState(null);
  const [draftPropertyId, setDraftPropertyId] = useState(null);
  const [propertyModel, setPropertyModel] = useState("");
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomTypeForm, setRoomTypeForm] = useState(INITIAL_ROOM_TYPE_FORM);
  const [units] = useState([]);

  const isAirbnbFlow = propertyModel === "airbnb";
  const isHotelFlow = propertyModel === "hotel";

  const totalImageCount = existingImages.length - imagesToRemove.length + images.length;

  // ─── Load tenant and optional draft on mount ─────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyTenant();
        if (cancelled) return;
        setTenant(data);
        if (data.businessType === "hotel") setPropertyModel("hotel");
        else if (data.businessType === "airbnb") setPropertyModel("airbnb");

        const savedDraftId = typeof window !== "undefined" ? sessionStorage.getItem(DRAFT_STORAGE_KEY) : null;
        const savedStep = typeof window !== "undefined" ? sessionStorage.getItem(STEP_STORAGE_KEY) : null;
        if (savedDraftId) {
          try {
            const property = await getPropertyById(savedDraftId);
            if (cancelled) return;
            setDraftPropertyId(savedDraftId);
            setPropertyModel(property.modelType || propertyModel);
            setStep(Math.min(parseInt(savedStep || "1", 10) || 1, 5));
            setExistingImages(property.images || []);
            setFormData({
              title: property.title || "",
              description: property.description || "",
              location: property.location || "",
              address: property.address || property.location || "",
              starRating: property.starRating != null ? String(property.starRating) : "",
              bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
              bathrooms: property.bathrooms != null ? String(property.bathrooms) : "1",
              area: property.area != null ? String(property.area) : "",
              price: property.price != null ? String(property.price) : "",
              weekendPremiumPercent: property.weekendPremiumPercent ?? 0,
              currency: property.currency || "USD",
              amenities: property.amenities || [],
              highlights: property.highlights || [],
              placeType: property.placeType || "",
              guestPlaceType: property.guestPlaceType || "entire_place",
              maxGuests: property.maxGuests ?? 2,
              beds: property.beds ?? 1,
              discounts: property.discounts || { newListing: false, lastMinute: false, weekly: false, monthly: false },
              safetyFeatures: property.safetyFeatures || { exteriorCamera: false, noiseMonitor: false, weapons: false },
              checkInTime: property.checkInTime || "14:00",
              checkOutTime: property.checkOutTime || "11:00",
              smokingPolicy: property.smokingPolicy || "no_smoking",
              petPolicy: property.petPolicy || "no_pets",
              cancellationPolicy: property.cancellationPolicy || "moderate",
            });
            if (property.roomTypes && property.roomTypes.length > 0) {
              setRoomTypes(
                property.roomTypes.map((rt) => ({
                  id: rt.id || rt._id,
                  name: rt.name,
                  bedType: rt.bedType || "King",
                  bedCount: rt.bedCount ?? 1,
                  maxOccupancy: String(rt.maxOccupancy ?? 2),
                  size: rt.size != null ? String(rt.size) : "",
                  price: String(rt.price ?? ""),
                  inventory: String(rt.inventory ?? 1),
                  amenities: rt.amenities || [],
                  saved: true,
                }))
              );
            }
          } catch (err) {
            if (!cancelled) {
              toast.error("Could not load draft. Starting fresh.");
              if (typeof window !== "undefined") {
                sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                sessionStorage.removeItem(STEP_STORAGE_KEY);
              }
            }
          }
        }
        if (!cancelled) setIsLoading(false);
      } catch {
        if (!cancelled) {
          toast.error("Failed to load tenant information");
          router.push("/onboarding");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // ─── Helpers ───────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity) => {
    const list = Array.isArray(formData.amenities) ? formData.amenities : [];
    handleChange("amenities", list.includes(amenity) ? list.filter((a) => a !== amenity) : [...list, amenity]);
  };

  const persistStep = useCallback((s) => {
    setStep(s);
    if (typeof window !== "undefined") sessionStorage.setItem(STEP_STORAGE_KEY, String(s));
  }, []);

  // ─── Step navigation: validate and save each step to backend ─────
  const handleNext = async () => {
    if (step === 1) {
      if (!propertyModel) { toast.error("Please select a property model"); return; }
      if (draftPropertyId) {
        persistStep(2);
        return;
      }
      setIsSaving(true);
      const toastId = toast.loading("Creating draft...");
      try {
        const minimal = {
          title: "New property",
          modelType: propertyModel,
          propertyType: propertyModel === "hotel" ? "hotel" : "apartment",
          status: "available",
          isPubliclyVisible: false,
        };
        const created = await createProperty(minimal, []);
        const id = created.id || created._id;
        setDraftPropertyId(id);
        if (typeof window !== "undefined") sessionStorage.setItem(DRAFT_STORAGE_KEY, id);
        toast.success("Draft saved.", { id: toastId });
        persistStep(2);
      } catch (err) {
        toast.error(err.message || "Failed to create draft", { id: toastId });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (step === 2) {
      if (!formData.title || formData.title.trim().length < 3) { toast.error("Property name must be at least 3 characters"); return; }
      if (!formData.location) { toast.error("Please enter property location"); return; }
      if (isAirbnbFlow && !formData.placeType) { toast.error("Please select a property type"); return; }
      if (!draftPropertyId) { toast.error("Draft missing. Please go back and start again."); return; }
      setIsSaving(true);
      const toastId = toast.loading("Saving details...");
      try {
        const payload = {
          title: formData.title.trim(),
          description: formData.description?.trim() || "",
          location: formData.location.trim(),
          address: formData.address?.trim() || formData.location.trim(),
          propertyType: isHotelFlow ? "hotel" : (formData.placeType || "apartment"),
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
          area: formData.area ? Number(formData.area) : undefined,
          starRating: formData.starRating ? Number(formData.starRating) : undefined,
          placeType: formData.placeType || undefined,
          guestPlaceType: formData.guestPlaceType || undefined,
          maxGuests: isAirbnbFlow ? Number(formData.maxGuests) : undefined,
          beds: isAirbnbFlow ? Number(formData.beds) : undefined,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          smokingPolicy: formData.smokingPolicy,
          petPolicy: formData.petPolicy,
          cancellationPolicy: formData.cancellationPolicy,
        };
        await updateProperty(draftPropertyId, payload);
        toast.success("Details saved.", { id: toastId });
        persistStep(3);
      } catch (err) {
        toast.error(err.message || "Failed to save details", { id: toastId });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (step === 3) {
      if (totalImageCount < 1) { toast.error("Please upload at least one photo"); return; }
      if (!draftPropertyId) return;
      setIsSaving(true);
      const toastId = toast.loading("Saving photos & amenities...");
      try {
        const payload = {
          description: formData.description?.trim() || "",
          amenities: formData.amenities,
          highlights: formData.highlights,
          discounts: formData.discounts,
          safetyFeatures: formData.safetyFeatures,
        };
        const updated = await updateProperty(draftPropertyId, payload, images, imagesToRemove);
        if (updated && Array.isArray(updated.images)) setExistingImages(updated.images);
        else setExistingImages((prev) => prev.filter((p) => !imagesToRemove.includes(p)));
        setImagesToRemove([]);
        setImages([]);
        toast.success("Photos & amenities saved.", { id: toastId });
        persistStep(4);
      } catch (err) {
        toast.error(err.message || "Failed to save", { id: toastId });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (step === 4) {
      if (isHotelFlow && roomTypes.length === 0) { toast.error("Please add at least one room type"); return; }
      if (isAirbnbFlow && (!formData.price || Number(formData.price) <= 0)) { toast.error("Please enter a valid base price"); return; }
      if (!draftPropertyId) return;
      setIsSaving(true);
      const toastId = toast.loading("Saving pricing...");
      try {
        if (isHotelFlow) {
          const unsaved = roomTypes.filter((r) => !r.saved);
          for (const rt of unsaved) {
            await addRoomType(draftPropertyId, {
              name: rt.name,
              bedType: rt.bedType || "King",
              bedCount: Number(rt.bedCount) || 1,
              maxOccupancy: Number(rt.maxOccupancy) || 2,
              price: Number(rt.price),
              inventory: Math.max(1, Math.floor(Number(rt.inventory) || 1)),
              size: rt.size && Number(rt.size) > 0 ? Number(rt.size) : undefined,
              amenities: rt.amenities || [],
            });
          }
          setRoomTypes((prev) => prev.map((r) => ({ ...r, saved: true })));
        } else {
          await updateProperty(draftPropertyId, {
            price: Number(formData.price),
            weekendPremiumPercent: formData.weekendPremiumPercent ?? 0,
            currency: formData.currency,
          });
        }
        toast.success("Pricing saved.", { id: toastId });
        persistStep(5);
      } catch (err) {
        toast.error(err.message || "Failed to save pricing", { id: toastId });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    const next = Math.max(step - 1, 1);
    setStep(next);
    if (typeof window !== "undefined") sessionStorage.setItem(STEP_STORAGE_KEY, String(next));
  };

  // ─── Room type management ─────────────────────────────────────
  const addRoomTypeLocal = () => {
    if (!roomTypeForm.name || !roomTypeForm.price) { toast.error("Room type name and price are required"); return; }
    setRoomTypes((prev) => [...prev, { ...roomTypeForm, id: Date.now(), saved: false }]);
    setRoomTypeForm(INITIAL_ROOM_TYPE_FORM);
  };

  const removeRoomType = (id) => setRoomTypes((prev) => prev.filter((r) => r.id !== id));

  const removeExistingImage = (pathOrUrl) => {
    setImagesToRemove((prev) => (prev.includes(pathOrUrl) ? prev : [...prev, pathOrUrl]));
  };

  const toggleRoomAmenity = (amenity) => {
    const list = roomTypeForm.amenities || [];
    setRoomTypeForm((prev) => ({
      ...prev,
      amenities: list.includes(amenity) ? list.filter((a) => a !== amenity) : [...list, amenity],
    }));
  };

  // ─── Submit (publish): clear draft and redirect ──────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(STEP_STORAGE_KEY);
    }
    setDraftPropertyId(null);
    toast.success("Property is ready. You can edit or publish from the list.");
    router.push("/properties");
  };

  // ─── Render ────────────────────────────────────────────────────
  if (isLoading) return <PageLoader message="Loading..." />;

  switch (step) {
    case 1:
      return <Step1ModelSelect propertyModel={propertyModel} setPropertyModel={setPropertyModel} onBack={() => router.push("/properties")} onNext={handleNext} isSaving={isSaving} />;

    case 2:
      return <Step2Details formData={formData} handleChange={handleChange} isHotelFlow={isHotelFlow} isAirbnbFlow={isAirbnbFlow} onBack={handleBack} onNext={handleNext} isSaving={isSaving} />;

    case 3:
      return (
        <Step3AmenitiesMedia
          formData={formData}
          handleChange={handleChange}
          toggleAmenity={toggleAmenity}
          images={images}
          setImages={setImages}
          existingImages={existingImages}
          imagesToRemove={imagesToRemove}
          removeExistingImage={removeExistingImage}
          isHotelFlow={isHotelFlow}
          onBack={handleBack}
          onNext={handleNext}
          nextDisabled={totalImageCount < 1}
          isSaving={isSaving}
        />
      );

    case 4:
      return isHotelFlow
        ? (
          <Step4HotelRoomTypes
            roomTypes={roomTypes}
            roomTypeForm={roomTypeForm}
            setRoomTypeForm={setRoomTypeForm}
            addRoomType={addRoomTypeLocal}
            removeRoomType={removeRoomType}
            toggleRoomAmenity={toggleRoomAmenity}
            onBack={handleBack}
            onNext={handleNext}
            isSaving={isSaving}
          />
        )
        : <Step4AirbnbPricing formData={formData} handleChange={handleChange} onBack={handleBack} onNext={handleNext} isSaving={isSaving} />;

    case 5:
      return <Step5Review formData={formData} existingImages={existingImages} images={images} propertyModel={propertyModel} isHotelFlow={isHotelFlow} isAirbnbFlow={isAirbnbFlow} roomTypes={roomTypes} onBack={handleBack} onSubmit={handleSubmit} />;

    default:
      return null;
  }
}
