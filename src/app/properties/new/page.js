"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createProperty, addRoom, addUnit, getMyTenant } from "@/lib/api";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import FileUpload from "@/components/common/FileUpload";
import PageLoader from "@/components/common/PageLoader";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [tenant, setTenant] = useState(null);
  const [propertyModel, setPropertyModel] = useState(""); // 'hotel' or 'airbnb'
  const [images, setImages] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    address: "",
    starRating: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    price: "",
    currency: "USD",
    amenities: [],
  });

  // For hotel model
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomType: "",
    price: "",
    maxOccupancy: "",
  });

  // For airbnb model
  const [units, setUnits] = useState([]);
  const [unitForm, setUnitForm] = useState({
    unitName: "",
    price: "",
    maxOccupancy: "",
  });

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const tenantData = await getMyTenant();
      setTenant(tenantData);
      
      // Pre-select property model based on tenant's business type
      if (tenantData.businessType === "hotel") {
        setPropertyModel("hotel");
      } else if (tenantData.businessType === "airbnb") {
        setPropertyModel("airbnb");
      }
      // If 'both', let user choose
      
      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to load tenant information");
      router.push("/onboarding");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!propertyModel) {
        toast.error("Please select a property model");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.title || formData.title.trim().length < 3) {
        toast.error("Property title must be at least 3 characters");
        return;
      }
      if (!formData.description || formData.description.trim().length < 10) {
        toast.error("Property description must be at least 10 characters");
        return;
      }
      if (!formData.location) {
        toast.error("Please enter property location");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (propertyModel === "hotel" && rooms.length === 0) {
        toast.error("Please add at least one room");
        return;
      }
      if (propertyModel === "airbnb" && !formData.price) {
        toast.error("Please enter property price");
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addRoomToList = () => {
    if (!roomForm.roomNumber || !roomForm.roomType || !roomForm.price) {
      toast.error("Please fill in all room details");
      return;
    }
    
    setRooms([...rooms, { ...roomForm, id: Date.now() }]);
    setRoomForm({
      roomNumber: "",
      roomType: "",
      price: "",
      maxOccupancy: "",
    });
  };

  const removeRoom = (id) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  const addUnitToList = () => {
    if (!unitForm.unitName || !unitForm.price) {
      toast.error("Please fill in all unit details");
      return;
    }
    
    setUnits([...units, { ...unitForm, id: Date.now() }]);
    setUnitForm({
      unitName: "",
      price: "",
      maxOccupancy: "",
    });
  };

  const removeUnit = (id) => {
    setUnits(units.filter((unit) => unit.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const toastId = toast.loading("Creating property...");

    try {
      // Create base property
      const propertyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        address: formData.address?.trim() || formData.location.trim(),
        propertyType: propertyModel === "hotel" ? "Hotel" : "Apartment",
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        price: propertyModel === "airbnb" ? Number(formData.price) : 0,
        currency: formData.currency,
        starRating: formData.starRating ? Number(formData.starRating) : undefined,
        status: "available",
        isPubliclyVisible: false,
      };

      const property = await createProperty(propertyData, images);
      const propertyId = property.id || property._id;

      // Add rooms for hotel model
      if (propertyModel === "hotel") {
        for (const room of rooms) {
          await addRoom(propertyId, {
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            price: Number(room.price),
            maxOccupancy: room.maxOccupancy ? Number(room.maxOccupancy) : 2,
          });
        }
      }

      // Add units for airbnb model
      if (propertyModel === "airbnb" && units.length > 0) {
        for (const unit of units) {
          await addUnit(propertyId, {
            unitName: unit.unitName,
            price: Number(unit.price),
            maxOccupancy: unit.maxOccupancy ? Number(unit.maxOccupancy) : 2,
          });
        }
      }

      toast.success("Property created successfully!", { id: toastId });
      router.push("/properties");
    } catch (error) {
      const errorMessage = error.message || "Failed to create property";
      toast.error(errorMessage, { id: toastId });
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Add New Property</h1>
          <p className="text-slate-600 mt-2">
            Create a new property listing for your {tenant?.name}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Model" },
              { step: 2, label: "Details" },
              { step: 3, label: "Rooms/Units" },
              { step: 4, label: "Review" },
            ].map((s, index) => (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step >= s.step
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-400 border-2 border-slate-200"
                    }`}
                  >
                    {s.step}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${step >= s.step ? "text-slate-900" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`h-1 flex-1 mx-2 rounded ${step > s.step ? "bg-slate-900" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Property Model */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  What type of property is this?
                </h2>

                <div className="grid gap-4">
                  <div
                    onClick={() => setPropertyModel("hotel")}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      propertyModel === "hotel"
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">🏨</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">Hotel</h3>
                        <p className="text-sm text-slate-600">
                          Traditional hotel with multiple rooms, room types, and optional floor organization
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          propertyModel === "hotel"
                            ? "border-slate-900 bg-slate-900"
                            : "border-slate-300"
                        }`}
                      >
                        {propertyModel === "hotel" && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPropertyModel("airbnb")}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      propertyModel === "airbnb"
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">🏠</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">Airbnb / Vacation Rental</h3>
                        <p className="text-sm text-slate-600">
                          Apartment, villa, or house with optional individual units
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          propertyModel === "airbnb"
                            ? "border-slate-900 bg-slate-900"
                            : "border-slate-300"
                        }`}
                      >
                        {propertyModel === "airbnb" && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Property Details</h2>

                <FormField
                  label="Property Title *"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. Grand Plaza Hotel, Seaside Villa"
                />

                <FormField
                  label="Description *"
                  as="textarea"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your property..."
                />

                <FormField
                  label="Location *"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="City, State/Province"
                />

                <FormField
                  label="Full Address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Main Street, District, City"
                />

                <div className="grid grid-cols-2 gap-4">
                  {propertyModel === "hotel" && (
                    <FormField
                      label="Star Rating"
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      value={formData.starRating}
                      onChange={(e) => handleChange("starRating", e.target.value)}
                      placeholder="1-5"
                    />
                  )}
                  
                  <FormField
                    label="Bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange("bedrooms", e.target.value)}
                    placeholder="0"
                  />

                  <FormField
                    label="Bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange("bathrooms", e.target.value)}
                    placeholder="0"
                  />

                  <FormField
                    label="Area (sq ft)"
                    type="number"
                    min="0"
                    value={formData.area}
                    onChange={(e) => handleChange("area", e.target.value)}
                    placeholder="1000"
                  />
                </div>

                <FileUpload
                  label="Property Images"
                  files={images}
                  onChange={setImages}
                  maxFiles={5}
                  maxSizeMB={5}
                  helpText="Upload up to 5 images. JPG, PNG, GIF accepted. Max 5MB each."
                />
              </div>
            )}

            {/* Step 3: Rooms/Units */}
            {step === 3 && (
              <div className="space-y-6">
                {propertyModel === "hotel" ? (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Add Rooms</h2>
                    <p className="text-sm text-slate-600">
                      Add individual rooms to your hotel. Each room can have its own type and pricing.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Room Number *"
                          value={roomForm.roomNumber}
                          onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                          placeholder="e.g. 101, 102"
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

                      <button
                        type="button"
                        onClick={addRoomToList}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Add Room
                      </button>
                    </div>

                    {rooms.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Rooms Added ({rooms.length})
                        </h3>
                        <div className="space-y-2">
                          {rooms.map((room) => (
                            <div
                              key={room.id}
                              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3"
                            >
                              <div className="flex-1">
                                <span className="font-semibold text-slate-900">Room {room.roomNumber}</span>
                                <span className="text-slate-600 mx-2">•</span>
                                <span className="text-slate-600">{room.roomType}</span>
                                <span className="text-slate-600 mx-2">•</span>
                                <span className="text-slate-900 font-semibold">${room.price}/night</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRoom(room.id)}
                                className="text-rose-600 hover:text-rose-700"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Property Pricing</h2>
                    
                    <FormField
                      label="Base Price per Night (USD) *"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="100"
                    />

                    <div className="border-t border-slate-200 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Units (Optional)
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        If your property has multiple units (e.g., Apartment A, Apartment B), add them here.
                      </p>

                      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            label="Unit Name"
                            value={unitForm.unitName}
                            onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                            placeholder="e.g. Unit A, Villa 1"
                          />

                          <FormField
                            label="Price per Night (USD)"
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

                        <button
                          type="button"
                          onClick={addUnitToList}
                          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Add Unit
                        </button>
                      </div>

                      {units.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <h3 className="text-sm font-semibold text-slate-700">
                            Units Added ({units.length})
                          </h3>
                          <div className="space-y-2">
                            {units.map((unit) => (
                              <div
                                key={unit.id}
                                className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3"
                              >
                                <div className="flex-1">
                                  <span className="font-semibold text-slate-900">{unit.unitName}</span>
                                  <span className="text-slate-600 mx-2">•</span>
                                  <span className="text-slate-900 font-semibold">${unit.price}/night</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeUnit(unit.id)}
                                  className="text-rose-600 hover:text-rose-700"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Review & Submit</h2>

                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-1">Property Type</h3>
                    <p className="text-slate-900 capitalize">{propertyModel}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-1">Title</h3>
                    <p className="text-slate-900">{formData.title}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-1">Location</h3>
                    <p className="text-slate-900">{formData.location}</p>
                  </div>

                  {propertyModel === "hotel" && rooms.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 mb-1">Rooms</h3>
                      <p className="text-slate-900">{rooms.length} room(s)</p>
                    </div>
                  )}

                  {propertyModel === "airbnb" && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 mb-1">Base Price</h3>
                      <p className="text-slate-900">${formData.price}/night</p>
                    </div>
                  )}

                  {propertyModel === "airbnb" && units.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 mb-1">Units</h3>
                      <p className="text-slate-900">{units.length} unit(s)</p>
                    </div>
                  )}

                  {images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 mb-1">Images</h3>
                      <p className="text-slate-900">{images.length} image(s)</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    ℹ️ Your property will be created as private (not visible on public website). You can enable public visibility later from the properties page.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isCreating}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create Property"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
