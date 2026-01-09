"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PhotoCarousel from "@/components/modules/PhotoCarousel";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import StatusPill from "@/components/common/StatusPill";
import PageLoader from "@/components/common/PageLoader";
import FileUpload from "@/components/common/FileUpload";
import {
  getAllProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { API_BASE_URL } from "@/lib/api";
import { formatCurrency } from "@/utils/currencyUtils";

export default function PropertiesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  // SEO
  useSEO({
    title: "Properties | Zuha Host",
    description:
      "Manage your property listings. Add, edit, and monitor all your vacation rental properties.",
    keywords:
      "properties, listings, vacation rentals, property management, rental properties",
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [propertiesData, setPropertiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Default view: table for desktop, list for mobile
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? "table" : "list";
    }
    return "table";
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    propertyType: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    propertyType: "House",
    area: "",
    status: "available",
  });
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllProperties();
        setPropertiesData(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMessage = err.message || "Failed to load properties";
        console.error("🔴 PropertiesPage: API call failed:", err);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [isAuthenticated]);

  // Handle window resize to update view mode on screen size change
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      // Only auto-switch if user hasn't manually changed view
      if (isMobile && viewMode === "table") {
        setViewMode("list");
      } else if (!isMobile && viewMode === "list") {
        setViewMode("table");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      location: "",
      propertyType: "House",
      area: "",
      status: "available",
    });
    setNewImages([]);
    setExistingImages([]);
    setImagesToRemove([]);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePropertyForm = (data, isUpdate = false) => {
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
    let toastId;
    try {
      // Validate form
      const validationError = validatePropertyForm(formData, false);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Validate image count
      if (newImages.length > 5) {
        toast.error("Maximum 5 images allowed per property");
        return;
      }

      // Convert string numbers to actual numbers
      const payload = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        status: "available", // Always set to available for new properties
      };

      toastId = toast.loading("Creating property...");
      const newProperty = await createProperty(payload, newImages);
      setPropertiesData((prev) => [...prev, newProperty]);
      setCreateOpen(false);
      resetForm();
      toast.success("Property created successfully!", { id: toastId });
    } catch (err) {
      const errorMessage = err.message || "Failed to create property";
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUpdateProperty = async () => {
    let toastId;
    try {
      const propertyId = selectedProperty.id || selectedProperty._id;

      // Validate image count (existing - removed + new)
      const totalImages =
        existingImages.length - imagesToRemove.length + newImages.length;
      if (totalImages > 5) {
        toast.error("Maximum 5 images allowed per property");
        return;
      }

      // Only include fields that have values
      const payload = {};
      if (formData.title) payload.title = formData.title;
      if (formData.description) payload.description = formData.description;
      if (formData.price) payload.price = Number(formData.price);
      if (formData.location) payload.location = formData.location;
      if (formData.propertyType) payload.propertyType = formData.propertyType;
      if (formData.area) payload.area = Number(formData.area);
      if (formData.status) payload.status = formData.status;

      // Validate form (only fields being updated)
      const validationError = validatePropertyForm(payload, true);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      toastId = toast.loading("Updating property...");
      const updatedProperty = await updateProperty(
        propertyId,
        payload,
        newImages,
        imagesToRemove
      );
      setPropertiesData((prev) =>
        prev.map((prop) =>
          prop.id === propertyId || prop._id === propertyId
            ? updatedProperty
            : prop
        )
      );
      setSelectedProperty(null);
      resetForm();
      toast.success("Property updated successfully!", { id: toastId });
    } catch (err) {
      const errorMessage = err.message || "Failed to update property";
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    let toastId;
    try {
      toastId = toast.loading("Deleting property...");
      await deleteProperty(propertyId);
      setPropertiesData((prev) =>
        prev.filter((prop) => (prop.id || prop._id) !== propertyId)
      );
      toast.success("Property deleted successfully!", { id: toastId });
    } catch (err) {
      const errorMessage = err.message || "Failed to delete property";
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title || "",
      description: property.description || "",
      price: property.price?.toString() || "",
      location: property.location || "",
      propertyType: property.propertyType || "House",
      area: property.area?.toString() || "",
      status: property.status || "available",
    });
    setExistingImages(property.images || []);
    setNewImages([]);
    setImagesToRemove([]);
  };

  const closeEditModal = () => {
    setSelectedProperty(null);
    resetForm();
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetForm();
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      propertyType: "",
      status: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
    });
  };

  // Filter properties based on filter criteria
  const filteredProperties = useMemo(() => {
    return propertiesData.filter((property) => {
      // Search filter (title or location)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = (property.title || "")
          .toLowerCase()
          .includes(searchLower);
        const locationMatch = (property.location || "")
          .toLowerCase()
          .includes(searchLower);
        if (!titleMatch && !locationMatch) return false;
      }

      // Property type filter
      if (
        filters.propertyType &&
        property.propertyType !== filters.propertyType
      ) {
        return false;
      }

      // Status filter
      if (filters.status && property.status !== filters.status) {
        return false;
      }

      // Min price filter
      if (filters.minPrice && property.price < Number(filters.minPrice)) {
        return false;
      }

      // Max price filter
      if (filters.maxPrice && property.price > Number(filters.maxPrice)) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms && property.bedrooms !== Number(filters.bedrooms)) {
        return false;
      }

      return true;
    });
  }, [propertiesData, filters]);

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading properties..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg
              className="w-6 h-6 text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Properties
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filters Button */}
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {Object.values(filters).some((val) => val !== "") && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-slate-900 rounded-full">
                {Object.values(filters).filter((val) => val !== "").length}
              </span>
            )}
          </button>

          <div className="flex rounded-full border border-slate-200 p-1">
            {/* Blog Card View */}
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "blog"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("blog")}
              title="Blog Cards"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            {/* List View */}
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* Table View */}
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
          {/* Add Property button - same for all screens */}
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            onClick={() => setCreateOpen(true)}
          >
            Add Property
          </button>
          <button className="hidden sm:inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Import Property
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
            <button
              className="text-sm text-slate-600 hover:text-slate-900 underline"
              onClick={() => {
                clearFilters();
              }}
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Title or location..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Property Type */}
            <Select
              label="Property Type"
              value={filters.propertyType}
              onChange={(value) => handleFilterChange("propertyType", value)}
              placeholder="All Types"
              options={[
                { value: "", label: "All Types" },
                "Apartment",
                "House",
                "Secondary unit",
                "Unique space",
                "Bed and breakfast",
                "Boutique hotel",
              ]}
            />

            {/* Status */}
            <Select
              label="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="All Status"
              options={[
                { value: "", label: "All Status" },
                "available",
                "rented",
                "sold",
                "unavailable",
              ]}
            />

            {/* Min Price */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Min Price
              </label>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange("bedrooms", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredProperties.length}
              </span>{" "}
              of {propertiesData.length} properties
            </p>
          </div>
        </div>
      )}

      {/* Blog Card View - Large cards with full-width image */}
      {viewMode === "blog" && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const propertyId = property.id || property._id;
            const images =
              property.images && property.images.length > 0
                ? property.images.map((img) => `${API_BASE_URL}${img}`)
                : property.photos || (property.photo ? [property.photo] : []);

            return (
              <div
                key={propertyId}
                className="flex flex-col rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEditModal(property)}
              >
                {/* Full-width Image */}
                <div className="relative w-full h-56">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[0]}
                        alt={
                          property.title ||
                          property.name ||
                          property.propertyName
                        }
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          +{images.length - 1}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-slate-100">
                      <svg
                        className="h-12 w-12 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <StatusPill label={property.status || "available"} />
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {property.title || property.name || property.propertyName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {property.propertyType || "House"} in{" "}
                    {property.location || property.address}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(property.price || 0, property.currency || null)}
                      <span className="text-sm font-normal text-slate-500">
                        {" "}
                        / night
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* List View - Compact horizontal layout */}
      {viewMode === "list" && (
        <section className="space-y-3">
          {filteredProperties.map((property) => {
            const propertyId = property.id || property._id;
            const images =
              property.images && property.images.length > 0
                ? property.images.map((img) => `${API_BASE_URL}${img}`)
                : property.photos || (property.photo ? [property.photo] : []);

            return (
              <div
                key={propertyId}
                className="flex gap-2 items-center rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEditModal(property)}
              >
                {/* Small Thumbnail */}
                <div className="shrink-0 w-12 h-12">
                  {images.length > 0 ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <img
                        src={images[0]}
                        alt={
                          property.title ||
                          property.name ||
                          property.propertyName
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-slate-100 rounded-lg">
                      <svg
                        className="h-4 w-4 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-slate-900 truncate">
                    {property.title || property.name || property.propertyName}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {property.propertyType || "House"} in{" "}
                    {property.location || property.address}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {viewMode === "table" && (
        <section>
          <DataTable
            headers={[
              "S.No",
              "Title",
              "Host Name",
              "Location",
              "Type",
              "Beds/Baths",
              "Area",
              "Price",
              "Status",
              "Actions",
            ]}
            rows={filteredProperties.map((property, index) => {
              const propertyId = property.id || property._id;
              const hostName = property.hostId?.name || "N/A";
              return {
                id: propertyId,
                cells: [
                  index + 1,
                  property.title || property.name || property.propertyName,
                  hostName,
                  property.location || property.address,
                  property.propertyType || "House",
                  `${property.bedrooms || 0} / ${property.bathrooms || 0}`,
                  `${property.area || 0} sq ft`,
                  formatCurrency(property.price || 0, property.currency || null),
                  <StatusPill
                    key="status"
                    label={property.status || "available"}
                  />,
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
        </section>
      )}

      <Modal
        title="Edit property"
        description="Update property details"
        isOpen={Boolean(selectedProperty)}
        onClose={closeEditModal}
        primaryActionLabel="Update property"
        primaryAction={handleUpdateProperty}
      >
        {/* Images and Top Fields Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Images Box - Left Side */}
          <div className="shrink-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property Images (
              {existingImages.length - imagesToRemove.length + newImages.length}
              /5)
            </label>
            <div className="grid grid-cols-2 gap-2 w-48">
              {/* Existing Images */}
              {existingImages
                .filter((img) => !imagesToRemove.includes(img))
                .map((image, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-slate-200"
                  >
                    <img
                      src={`${API_BASE_URL}${image}`}
                      alt={`Property ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImagesToRemove((prev) => [...prev, image])
                      }
                      className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                      aria-label="Remove image"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}

              {/* New Images */}
              {newImages.map((file, index) => (
                <div
                  key={`new-${index}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-blue-300"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                    aria-label="Remove image"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] px-1 rounded">
                    New
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              {existingImages.length -
                imagesToRemove.length +
                newImages.length <
                5 && (
                <div className="aspect-square">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const remaining =
                        5 -
                        (existingImages.length -
                          imagesToRemove.length +
                          newImages.length);
                      const filesToAdd = files.slice(0, remaining);

                      // Validate file sizes
                      const maxSizeBytes = 5 * 1024 * 1024;
                      const oversized = filesToAdd.filter(
                        (f) => f.size > maxSizeBytes
                      );

                      if (oversized.length > 0) {
                        toast.error(`Some files exceed 5MB limit`);
                        return;
                      }

                      setNewImages((prev) => [...prev, ...filesToAdd]);
                      e.target.value = "";
                    }}
                    className="hidden"
                    id="add-more-images-edit"
                  />
                  <label
                    htmlFor="add-more-images-edit"
                    className="flex items-center justify-center w-full h-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <svg
                      className="h-8 w-8 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Max 5 images, 5MB each
            </p>
            {imagesToRemove.length > 0 && (
              <p className="text-xs text-rose-600 mt-1">
                {imagesToRemove.length} marked for removal
              </p>
            )}
          </div>

          {/* Title and Description - Right Side */}
          <div className="flex-1 space-y-4">
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
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                placeholder="Describe the property..."
              />
              <p className="mt-1 text-xs text-slate-500">
                {formData.description.length}/10 characters minimum
              </p>
            </div>
          </div>
        </div>

        {/* Rest of the Form */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Price Per Night (USD)"
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
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Select
            label="Property Type"
            value={formData.propertyType}
            onChange={(value) => handleFormChange("propertyType", value)}
            options={[
              "Apartment",
              "House",
              "Secondary unit",
              "Unique space",
              "Bed and breakfast",
              "Boutique hotel",
            ]}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => handleFormChange("status", value)}
            options={["available", "rented", "sold", "unavailable"]}
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
        {/* Images and Top Fields Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Images Box - Left Side */}
          <div className="shrink-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property Images ({newImages.length}/5)
            </label>
            <div className="grid grid-cols-2 gap-2 w-48">
              {newImages.map((file, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-slate-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                    aria-label="Remove image"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Add More Button */}
              {newImages.length < 5 && (
                <div className="aspect-square">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const remaining = 5 - newImages.length;
                      const filesToAdd = files.slice(0, remaining);

                      // Validate file sizes
                      const maxSizeBytes = 5 * 1024 * 1024;
                      const oversized = filesToAdd.filter(
                        (f) => f.size > maxSizeBytes
                      );

                      if (oversized.length > 0) {
                        toast.error(`Some files exceed 5MB limit`);
                        return;
                      }

                      setNewImages((prev) => [...prev, ...filesToAdd]);
                      e.target.value = "";
                    }}
                    className="hidden"
                    id="add-more-images-create"
                  />
                  <label
                    htmlFor="add-more-images-create"
                    className="flex items-center justify-center w-full h-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <svg
                      className="h-8 w-8 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Max 5 images, 5MB each
            </p>
          </div>

          {/* Title and Description - Right Side */}
          <div className="flex-1 space-y-4">
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
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                placeholder="Describe the property..."
              />
              <p className="mt-1 text-xs text-slate-500">
                {formData.description.length}/10 characters minimum
              </p>
            </div>
          </div>
        </div>

        {/* Rest of the Form */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Price per night (USD)"
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

        <Select
          label="Property Type"
          value={formData.propertyType}
          onChange={(value) => handleFormChange("propertyType", value)}
          className="pt-4"
          options={[
            "Apartment",
            "House",
            "Secondary unit",
            "Unique space",
            "Bed and breakfast",
            "Boutique hotel",
          ]}
        />
      </Modal>
    </div>
  );
}
