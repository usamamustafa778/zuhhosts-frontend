"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import PhotoCarousel from "@/components/modules/PhotoCarousel";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import StatusPill from "@/components/common/StatusPill";
import { getAllProperties, createProperty, updateProperty, deleteProperty } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

export default function PropertiesPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [propertiesData, setPropertiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    propertyType: "house",
    bedrooms: "",
    bathrooms: "",
    area: "",
    status: "available"
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    console.log("🟢 PropertiesPage: useEffect triggered, calling getAllProperties");
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🟢 PropertiesPage: Starting API call...");
        const data = await getAllProperties();
        console.log("🟢 PropertiesPage: API call successful, data received:", data);
        setPropertiesData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("🔴 PropertiesPage: API call failed:", err);
        setError(err.message || "Failed to load properties");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [isAuthenticated]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      location: "",
      propertyType: "house",
      bedrooms: "",
      bathrooms: "",
      area: "",
      status: "available"
    });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePropertyForm = (data, isUpdate = false) => {
    // For updates, only validate fields that are provided
    if (!isUpdate) {
      // Required fields for creation
      if (!data.title || data.title.trim().length < 3) {
        return "Title must be at least 3 characters long";
      }
      if (!data.description || data.description.trim().length < 10) {
        return "Description must be at least 10 characters long";
      }
      if (!data.price || Number(data.price) < 0) {
        return "Price must be a positive number";
      }
      if (!data.location || data.location.trim().length === 0) {
        return "Location is required";
      }
      if (!data.area || Number(data.area) < 0) {
        return "Area must be a positive number";
      }
    } else {
      // For updates, only validate if field is provided
      if (data.title && data.title.trim().length < 3) {
        return "Title must be at least 3 characters long";
      }
      if (data.description && data.description.trim().length < 10) {
        return "Description must be at least 10 characters long";
      }
      if (data.price && Number(data.price) < 0) {
        return "Price must be a positive number";
      }
      if (data.area && Number(data.area) < 0) {
        return "Area must be a positive number";
      }
    }
    return null;
  };

  const handleCreateProperty = async () => {
    try {
      // Validate form
      const validationError = validatePropertyForm(formData, false);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      
      // Convert string numbers to actual numbers
      const payload = {
        ...formData,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : 0,
        area: Number(formData.area)
      };
      
      const toastId = toast.loading("Creating property...");
      const newProperty = await createProperty(payload);
      setPropertiesData((prev) => [...prev, newProperty]);
      setCreateOpen(false);
      resetForm();
      toast.success("Property created successfully!", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Failed to create property");
    }
  };

  const handleUpdateProperty = async () => {
    try {
      const propertyId = selectedProperty.id || selectedProperty._id;
      
      // Only include fields that have values
      const payload = {};
      if (formData.title) payload.title = formData.title;
      if (formData.description) payload.description = formData.description;
      if (formData.price) payload.price = Number(formData.price);
      if (formData.location) payload.location = formData.location;
      if (formData.propertyType) payload.propertyType = formData.propertyType;
      if (formData.bedrooms !== "") payload.bedrooms = Number(formData.bedrooms);
      if (formData.bathrooms !== "") payload.bathrooms = Number(formData.bathrooms);
      if (formData.area) payload.area = Number(formData.area);
      if (formData.status) payload.status = formData.status;
      
      // Validate form (only fields being updated)
      const validationError = validatePropertyForm(payload, true);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      
      const toastId = toast.loading("Updating property...");
      const updatedProperty = await updateProperty(propertyId, payload);
      setPropertiesData((prev) =>
        prev.map((prop) => (prop.id === propertyId || prop._id === propertyId ? updatedProperty : prop))
      );
      setSelectedProperty(null);
      resetForm();
      toast.success("Property updated successfully!", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Failed to update property");
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    
    try {
      const toastId = toast.loading("Deleting property...");
      await deleteProperty(propertyId);
      setPropertiesData((prev) => prev.filter((prop) => (prop.id || prop._id) !== propertyId));
      toast.success("Property deleted successfully!", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Failed to delete property");
    }
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title || "",
      description: property.description || "",
      price: property.price?.toString() || "",
      location: property.location || "",
      propertyType: property.propertyType || "house",
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      area: property.area?.toString() || "",
      status: property.status || "available"
    });
  };

  const closeEditModal = () => {
    setSelectedProperty(null);
    resetForm();
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetForm();
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading properties…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Properties
          </h1>
          <p className="text-sm text-slate-500">
            Manage units, track occupancy, and keep photos fresh.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={() => setCreateOpen(true)}
          >
            Add property
          </button>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Import Property
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {propertiesData.map((property) => {
          const propertyId = property.id || property._id;
          const photos = property.photos || (property.photo ? [property.photo] : []);
          return (
          <div
            key={propertyId}
            className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  {propertyId}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {property.title || property.name || property.propertyName}
                </h3>
                <p className="text-sm text-slate-500">{property.location || property.address}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {property.bedrooms || 0} bed • {property.bathrooms || 0} bath • {property.area || 0} sq ft
                </p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p className="text-xs uppercase text-slate-400">Price</p>
                <p className="text-2xl font-semibold text-slate-900">
                  ${property.price || 0}
                </p>
                <p className="text-xs text-slate-400">{property.propertyType || "house"}</p>
              </div>
            </div>
            {photos.length > 0 && <PhotoCarousel photos={photos} />}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <StatusPill label={property.status || "available"} />
              <div className="flex gap-2">
                <button
                  className="text-slate-900 underline-offset-2 hover:underline"
                  onClick={() => openEditModal(property)}
                >
                  Edit
                </button>
                <button
                  className="text-rose-600 underline-offset-2 hover:underline"
                  onClick={() => handleDeleteProperty(propertyId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Portfolio table</h2>
            <p className="text-sm text-slate-500">Complete property management</p>
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Search property..."
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 focus:outline-none"
            />
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm">
              Filters
            </button>
          </div>
        </div>
        <div className="mt-4">
          <DataTable
            headers={[
              "ID",
              "Title",
              "Location",
              "Type",
              "Beds/Baths",
              "Area",
              "Price",
              "Status",
              "Actions",
            ]}
            rows={propertiesData.map((property) => {
              const propertyId = property.id || property._id;
              return {
                id: propertyId,
                cells: [
                  propertyId.substring(0, 8) + "...",
                  property.title || property.name || property.propertyName,
                  property.location || property.address,
                  property.propertyType || "house",
                  `${property.bedrooms || 0} / ${property.bathrooms || 0}`,
                  `${property.area || 0} sq ft`,
                  `$${property.price || 0}`,
                  <StatusPill key="status" label={property.status || "available"} />,
                  <div key="actions" className="flex gap-2">
                    <button
                      className="text-slate-900 underline-offset-2 hover:underline text-sm"
                      onClick={() => openEditModal(property)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-rose-600 underline-offset-2 hover:underline text-sm"
                      onClick={() => handleDeleteProperty(propertyId)}
                    >
                      Delete
                    </button>
                  </div>,
                ],
              };
            })}
          />
        </div>
      </section>

      <Modal
        title="Edit property"
        description="Update property details"
        isOpen={Boolean(selectedProperty)}
        onClose={closeEditModal}
        primaryActionLabel="Update property"
        primaryAction={handleUpdateProperty}
      >
        <FormField 
          label="Title" 
          value={formData.title}
          onChange={(e) => handleFormChange("title", e.target.value)}
          placeholder="e.g. Beautiful Beach House"
        />
        <div>
          <FormField 
            label="Description" 
            as="textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            placeholder="Describe the property..."
          />
          <p className="mt-1 text-xs text-slate-500">
            {formData.description.length}/10 characters minimum
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Price (per night)" 
            type="number"
            value={formData.price}
            onChange={(e) => handleFormChange("price", e.target.value)}
            placeholder="250"
          />
          <FormField 
            label="Area (sq ft)" 
            type="number"
            value={formData.area}
            onChange={(e) => handleFormChange("area", e.target.value)}
            placeholder="2000"
          />
        </div>
        <FormField 
          label="Location" 
          value={formData.location}
          onChange={(e) => handleFormChange("location", e.target.value)}
          placeholder="123 Ocean Drive, Miami, FL"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Property Type" 
            as="select"
            value={formData.propertyType}
            onChange={(e) => handleFormChange("propertyType", e.target.value)}
            options={["house", "apartment", "villa", "land", "commercial"]}
          />
          <FormField 
            label="Status" 
            as="select"
            value={formData.status}
            onChange={(e) => handleFormChange("status", e.target.value)}
            options={["available", "rented", "sold"]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Bedrooms" 
            type="number"
            value={formData.bedrooms}
            onChange={(e) => handleFormChange("bedrooms", e.target.value)}
            placeholder="3"
          />
          <FormField 
            label="Bathrooms" 
            type="number"
            value={formData.bathrooms}
            onChange={(e) => handleFormChange("bathrooms", e.target.value)}
            placeholder="2"
          />
        </div>
      </Modal>

      <Modal
        title="Add property"
        description="Create a new property listing"
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        primaryActionLabel="Create property"
        primaryAction={handleCreateProperty}
      >
        <div>
          <FormField 
            label="Title *" 
            value={formData.title}
            onChange={(e) => handleFormChange("title", e.target.value)}
            placeholder="e.g. Beautiful Beach House"
          />
          <p className="mt-1 text-xs text-slate-500">
            Minimum 3 characters
          </p>
        </div>
        <div>
          <FormField 
            label="Description *" 
            as="textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            placeholder="Describe the property..."
          />
          <p className="mt-1 text-xs text-slate-500">
            {formData.description.length}/10 characters minimum
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Price * (per night)" 
            type="number"
            value={formData.price}
            onChange={(e) => handleFormChange("price", e.target.value)}
            placeholder="250"
          />
          <FormField 
            label="Area * (sq ft)" 
            type="number"
            value={formData.area}
            onChange={(e) => handleFormChange("area", e.target.value)}
            placeholder="2000"
          />
        </div>
        <FormField 
          label="Location *" 
          value={formData.location}
          onChange={(e) => handleFormChange("location", e.target.value)}
          placeholder="123 Ocean Drive, Miami, FL"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Property Type" 
            as="select"
            value={formData.propertyType}
            onChange={(e) => handleFormChange("propertyType", e.target.value)}
            options={["house", "apartment", "villa", "land", "commercial"]}
          />
          <FormField 
            label="Status" 
            as="select"
            value={formData.status}
            onChange={(e) => handleFormChange("status", e.target.value)}
            options={["available", "rented", "sold"]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Bedrooms" 
            type="number"
            value={formData.bedrooms}
            onChange={(e) => handleFormChange("bedrooms", e.target.value)}
            placeholder="3"
          />
          <FormField 
            label="Bathrooms" 
            type="number"
            value={formData.bathrooms}
            onChange={(e) => handleFormChange("bathrooms", e.target.value)}
            placeholder="2"
          />
        </div>
      </Modal>
    </div>
  );
}

