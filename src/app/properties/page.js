"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, MapPin, DollarSign, Home, Bed, Bath, Users, Square, Calendar, Clock, Ban, Dog, FileText, Star, Globe, Lock, Edit3, CheckCircle } from "lucide-react";
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
  deleteProperty,
  updateProperty,
  getRoomTypes,
  getRooms,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { getImageUrl } from "@/lib/api";
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
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [viewProperty, setViewProperty] = useState(null);
  const [viewPropertyRoomTypes, setViewPropertyRoomTypes] = useState([]);
  const [viewPropertyRooms, setViewPropertyRooms] = useState([]);
  const [isLoadingRoomData, setIsLoadingRoomData] = useState(false);
  const [propertiesData, setPropertiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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
    propertyType: "house",
    area: "",
    status: "available",
  });
  // modelType: "hotel" | "airbnb" — derived from propertyType (Hotel → hotel, others → airbnb)
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllProperties();
        setPropertiesData(Array.isArray(data) ? data : []);
      } catch (err) {
        let errorMessage = err.message || "Failed to load properties";

        // Provide more helpful error messages for common backend issues
        if (errorMessage.includes("is not a function")) {
          errorMessage = "Backend API error: Please contact support or check backend logs";
          console.error("🔴 Backend Error:", err.message);
        } else if (errorMessage.includes("fetch")) {
          errorMessage = "Unable to connect to server. Please check your connection.";
        }

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
      propertyType: "house",
      area: "",
      status: "available",
    });
    setNewImages([]);
  };

  const handleToggleVisibility = async (propertyId, currentVisibility) => {
    const toastId = toast.loading("Updating visibility...");
    try {
      await updateProperty(propertyId, {
        isPubliclyVisible: !currentVisibility,
      });
      toast.success("Visibility updated!", { id: toastId });
      // Reload properties to reflect the change
      const data = await getAllProperties();
      setPropertiesData(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to update visibility", { id: toastId });
    }
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
      const priceNum = Number(data.price);
      if (!data.price || isNaN(priceNum) || priceNum <= 0) {
        return "Price must be a positive number";
      }
      if (!data.location || data.location.trim().length === 0) {
        return "Location is required";
      }
      const areaNum = Number(data.area);
      if (!data.area || isNaN(areaNum) || areaNum <= 0) {
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
      if (data.price) {
        const priceNum = Number(data.price);
        if (isNaN(priceNum) || priceNum < 0) {
          return "Price must be a positive number";
        }
      }
      if (data.area) {
        const areaNum = Number(data.area);
        if (isNaN(areaNum) || areaNum < 0) {
          return "Area must be a positive number";
        }
      }
    }
    return null;
  };

  const handleCreateProperty = async (e) => {
    console.log("🔵 handleCreateProperty START - Function called!", {
      isCreating,
      formData,
      newImages,
      event: e
    });

    if (isCreating) {
      console.log("⚠️ Already creating, returning early");
      return; // Prevent double submission
    }

    let toastId;
    try {
      console.log("🔵 handleCreateProperty - Starting validation", { formData, newImages });
      setIsCreating(true);

      // Validate form
      const validationError = validatePropertyForm(formData, false);
      if (validationError) {
        console.log("❌ Validation error:", validationError);
        toast.error(validationError);
        return;
      }

      // Validate image count
      if (newImages.length > 5) {
        toast.error("Maximum 5 images allowed per property");
        return;
      }

      // modelType: "hotel" or "airbnb" per backend; propertyType: display category (hotel, apartment, villa, etc.)
      const propertyTypeLower = formData.propertyType ? formData.propertyType.toLowerCase() : "house";
      const payload = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        propertyType: propertyTypeLower,
        modelType: propertyTypeLower === "hotel" ? "hotel" : "airbnb",
        status: "available",
      };

      console.log("🔵 Creating property with payload:", payload);
      toastId = toast.loading("Creating property...");
      const newProperty = await createProperty(payload, newImages);
      console.log("✅ Property created:", newProperty);
      setPropertiesData((prev) => [...prev, newProperty]);
      setCreateOpen(false);
      resetForm();
      toast.success("Property created successfully!", { id: toastId });
    } catch (err) {
      console.error("❌ Error creating property:", err);
      const errorMessage = err.message || "Failed to create property";
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCreating(false);
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

  const closeCreateModal = () => {
    if (isCreating) return; // Prevent closing during submission
    setCreateOpen(false);
    resetForm();
    setIsCreating(false);
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

      // Property type filter (match modelType or propertyType for hotel/airbnb)
      if (filters.propertyType) {
        const propType = property.propertyType?.toLowerCase();
        const matchType =
          propType === filters.propertyType ||
          (filters.propertyType === "hotel" && property.modelType === "hotel");
        if (!matchType) return false;
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

  // Show error state if there's an error loading properties
  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Unable to Load Properties
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Go to Dashboard
            </button>
          </div>
          {error.includes("Backend") && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-rose-200">
              <p className="text-xs text-slate-600 font-mono text-left">
                <strong>Technical Details:</strong><br />
                This appears to be a backend server error. Please ensure:<br />
                1. Backend server is running<br />
                2. API endpoint is correctly configured<br />
                3. Backend dependencies are up to date
              </p>
            </div>
          )}
        </div>
      </div>
    );
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
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "blog"
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
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "list"
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
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "table"
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
            onClick={() => router.push("/properties/new")}
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
                { value: "hotel", label: "Hotel" },
                { value: "house", label: "House" },
                { value: "apartment", label: "Apartment" },
                { value: "villa", label: "Villa" },
                { value: "land", label: "Land" },
                { value: "commercial", label: "Commercial" },
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
                ? property.images.map((img) => getImageUrl(img)).filter(Boolean)
                : (property.photos || (property.photo ? [property.photo] : [])).map((p) => (typeof p === "string" ? getImageUrl(p) : p)).filter(Boolean);

            return (
              <div
                key={propertyId}
                className="flex flex-col rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/properties/${property.id || property._id}`)}
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
                    {property.propertyType
                      ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)
                      : "House"}
                    {property.placeType && (
                      <span className="text-slate-400"> · {property.placeType}</span>
                    )}{" "}
                    in {property.location || property.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
                    {property.maxGuests > 0 && (
                      <span>Up to {property.maxGuests} guests</span>
                    )}
                    {property.starRating != null && property.starRating > 0 && (
                      <span>★ {Number(property.starRating).toFixed(1)}</span>
                    )}
                  </div>
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
                ? property.images.map((img) => getImageUrl(img)).filter(Boolean)
                : (property.photos || (property.photo ? [property.photo] : [])).map((p) => (typeof p === "string" ? getImageUrl(p) : p)).filter(Boolean);

            return (
              <div
                key={propertyId}
                className="flex gap-2 items-center rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/properties/${property.id || property._id}`)}
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
                    {property.propertyType
                      ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)
                      : "House"}
                    {property.placeType && (
                      <span className="text-slate-400"> · {property.placeType}</span>
                    )}{" "}
                    in {property.location || property.address}
                    {property.maxGuests > 0 && ` · ${property.maxGuests} guests`}
                    {property.starRating != null && property.starRating > 0 && ` · ★ ${Number(property.starRating).toFixed(1)}`}
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
              "Image",
              "Title",
              "Host Name",
              "Location",
              "Type",
              "Beds/Baths",
              "Area",
              "Price",
              "Status",
              "Public Available",
              "Drafted",
              "Actions",
            ]}
            rows={filteredProperties.map((property, index) => {
              const propertyId = property.id || property._id;
              const hostName = property.hostId?.name || "N/A";

              // Get property image
              const images = property.images && property.images.length > 0
                ? property.images.map((img) => getImageUrl(img)).filter(Boolean)
                : (property.photos || (property.photo ? [property.photo] : [])).map((p) => (typeof p === "string" ? getImageUrl(p) : p)).filter(Boolean);
              const firstImage = images.length > 0 ? images[0] : null;

              return {
                id: propertyId,
                cells: [
                  index + 1,
                  <div key="image" className="flex items-center justify-center">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={property.title || "Property"}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center ${firstImage ? 'hidden' : ''}`}
                    >
                      <svg
                        className="w-8 h-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>,
                  property.title || property.name || property.propertyName,
                  hostName,
                  property.location || property.address,
                  (property.propertyType
                    ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)
                    : "House") +
                  (property.starRating != null && property.starRating > 0
                    ? ` ★${Number(property.starRating).toFixed(1)}`
                    : ""),
                  `${property.bedrooms || 0} / ${property.bathrooms || 0}` +
                  (property.maxGuests > 0 ? ` · ${property.maxGuests} guests` : ""),
                  `${property.area || 0} sq ft`,
                  formatCurrency(property.price || 0, property.currency || null),
                  <StatusPill
                    key="status"
                    label={property.status || "available"}
                  />,
                  <div key="public-available" className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(propertyId, property.isPubliclyVisible)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${property.isPubliclyVisible
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      title={property.isPubliclyVisible ? "Click to make private" : "Click to make public"}
                    >
                      {property.isPubliclyVisible ? "🌐 Public" : "🔒 Private"}
                    </button>
                  </div>,
                  <div key="drafted" className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${!property.isPubliclyVisible
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                      }`}>
                      {!property.isPubliclyVisible ? "📝 Draft" : "✅ Published"}
                    </span>
                  </div>,
                  <div key="actions" className="flex gap-2 items-center">
                    <button
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      onClick={async () => {
                        setViewProperty(property);
                        // If it's a hotel property, fetch room types and rooms
                        const modelType = property.modelType || (property.propertyType?.toLowerCase() === "hotel" ? "hotel" : "airbnb");
                        if (modelType === "hotel") {
                          setIsLoadingRoomData(true);
                          try {
                            const propertyId = property.id || property._id;
                            const [roomTypesData, roomsData] = await Promise.all([
                              getRoomTypes(propertyId).catch(() => []),
                              getRooms(propertyId).catch(() => []),
                            ]);
                            setViewPropertyRoomTypes(Array.isArray(roomTypesData) ? roomTypesData : []);
                            setViewPropertyRooms(Array.isArray(roomsData) ? roomsData : []);
                          } catch (error) {
                            console.error("Failed to load room data:", error);
                            setViewPropertyRoomTypes([]);
                            setViewPropertyRooms([]);
                          } finally {
                            setIsLoadingRoomData(false);
                          }
                        } else {
                          setViewPropertyRoomTypes([]);
                          setViewPropertyRooms([]);
                        }
                      }}
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="text-slate-900 underline-offset-2 hover:underline text-sm"
                      onClick={() => router.push(`/properties/${property.id || property._id}`)}
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
        title="Add property"
        description="Create a new property listing"
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        primaryActionLabel="Create property"
        onPrimaryAction={handleCreateProperty}
        disabled={isCreating}
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
            label="Price per night (USD) *"
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
            { value: "hotel", label: "Hotel (rooms)" },
            { value: "house", label: "House" },
            { value: "apartment", label: "Apartment" },
            { value: "villa", label: "Villa" },
            { value: "land", label: "Land" },
            { value: "commercial", label: "Commercial" },
          ]}
        />
      </Modal>

      {/* View Property Details Modal */}
      {viewProperty && (
        <Modal
          title=""
          isOpen={!!viewProperty}
          onClose={() => {
            setViewProperty(null);
            setViewPropertyRoomTypes([]);
            setViewPropertyRooms([]);
          }}
          hidePrimaryAction={true}
          size="large"
        >
          <div className="space-y-6">
            {/* Hero Section with Image and Title */}
            {(() => {
              const images = viewProperty.images && viewProperty.images.length > 0
                ? viewProperty.images.map((img) => getImageUrl(img)).filter(Boolean)
                : (viewProperty.photos || (viewProperty.photo ? [viewProperty.photo] : [])).map((p) => (typeof p === "string" ? getImageUrl(p) : p)).filter(Boolean);

              return (
                <div className="relative -mx-6 -mt-6 mb-6">
                  {images.length > 0 ? (
                    <div className="relative h-72 md:h-96 w-full overflow-hidden rounded-t-3xl">
                      <PhotoCarousel photos={images} />
                    </div>
                  ) : (
                    <div className="h-72 md:h-96 w-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center rounded-t-3xl">
                      <Home className="w-16 h-16 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          {viewProperty.title || viewProperty.name || "Untitled Property"}
                        </h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          {viewProperty.location && (
                            <div className="flex items-center gap-1.5 text-white/90">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{viewProperty.location}</span>
                            </div>
                          )}
                          {viewProperty.starRating != null && viewProperty.starRating > 0 && (
                            <div className="flex items-center gap-1 text-white/90">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{Number(viewProperty.starRating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <StatusPill label={viewProperty.status || "available"} />
                        {viewProperty.isPubliclyVisible ? (
                          <span className="px-3 py-1 bg-green-500/90 text-white rounded-full text-xs font-semibold flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Public
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-600/90 text-white rounded-full text-xs font-semibold flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-blue-600">Price</p>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(viewProperty.price || 0, viewProperty.currency || null)}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">per night</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bed className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-600">Bedrooms</p>
                </div>
                <p className="text-lg font-bold text-purple-900">{viewProperty.bedrooms || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bath className="w-4 h-4 text-pink-600" />
                  <p className="text-xs font-medium text-pink-600">Bathrooms</p>
                </div>
                <p className="text-lg font-bold text-pink-900">{viewProperty.bathrooms || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-600">Max Guests</p>
                </div>
                <p className="text-lg font-bold text-emerald-900">{viewProperty.maxGuests || "N/A"}</p>
              </div>
            </div>

            {/* Description Card */}
            {viewProperty.description && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{viewProperty.description}</p>
              </div>
            )}

            {/* Property Information Grid */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-slate-600" />
                Property Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg">
                    <Home className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 mb-1">Property Type</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {viewProperty.propertyType ? viewProperty.propertyType.charAt(0).toUpperCase() + viewProperty.propertyType.slice(1) : "N/A"}
                    </p>
                  </div>
                </div>
                {viewProperty.modelType && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg">
                      <Home className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">Model Type</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {viewProperty.modelType.charAt(0).toUpperCase() + viewProperty.modelType.slice(1)}
                      </p>
                    </div>
                  </div>
                )}
                {viewProperty.address && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg">
                      <MapPin className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">Address</p>
                      <p className="text-sm font-semibold text-slate-900">{viewProperty.address}</p>
                    </div>
                  </div>
                )}
                {viewProperty.area && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg">
                      <Square className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">Area</p>
                      <p className="text-sm font-semibold text-slate-900">{viewProperty.area} sq ft</p>
                    </div>
                  </div>
                )}
                {viewProperty.beds && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg">
                      <Bed className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">Beds</p>
                      <p className="text-sm font-semibold text-slate-900">{viewProperty.beds}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg">
                    {viewProperty.isPubliclyVisible ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Edit3 className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 mb-1">Publication Status</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {!viewProperty.isPubliclyVisible ? "📝 Draft" : "✅ Published"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {viewProperty.amenities && Array.isArray(viewProperty.amenities) && viewProperty.amenities.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-slate-600" />
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {viewProperty.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Airbnb Specific */}
            {(viewProperty.placeType || viewProperty.guestPlaceType || viewProperty.weekendPremiumPercent) && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-purple-600" />
                  Airbnb Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewProperty.placeType && (
                    <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">Place Type</p>
                      <p className="text-sm font-semibold text-slate-900">{viewProperty.placeType}</p>
                    </div>
                  )}
                  {viewProperty.guestPlaceType && (
                    <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">Guest Place Type</p>
                      <p className="text-sm font-semibold text-slate-900">{viewProperty.guestPlaceType}</p>
                    </div>
                  )}
                  {viewProperty.weekendPremiumPercent && (
                    <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">Weekend Premium</p>
                      <p className="text-sm font-semibold text-slate-900">{viewProperty.weekendPremiumPercent}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hotel Specific */}
            {(() => {
              const modelType = viewProperty.modelType || (viewProperty.propertyType?.toLowerCase() === "hotel" ? "hotel" : "airbnb");
              const isHotel = modelType === "hotel";

              if (!isHotel) return null;

              return (
                <>
                  {/* Hotel Policies */}
                  {(viewProperty.checkInTime || viewProperty.checkOutTime || viewProperty.smokingPolicy || viewProperty.petPolicy || viewProperty.cancellationPolicy) && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Hotel Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewProperty.checkInTime && (
                          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <p className="text-xs font-medium text-slate-500">Check-in Time</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{viewProperty.checkInTime}</p>
                          </div>
                        )}
                        {viewProperty.checkOutTime && (
                          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <p className="text-xs font-medium text-slate-500">Check-out Time</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{viewProperty.checkOutTime}</p>
                          </div>
                        )}
                        {viewProperty.smokingPolicy && (
                          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Ban className="w-4 h-4 text-blue-600" />
                              <p className="text-xs font-medium text-slate-500">Smoking Policy</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {viewProperty.smokingPolicy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                        )}
                        {viewProperty.petPolicy && (
                          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Dog className="w-4 h-4 text-blue-600" />
                              <p className="text-xs font-medium text-slate-500">Pet Policy</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {viewProperty.petPolicy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                        )}
                        {viewProperty.cancellationPolicy && (
                          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <p className="text-xs font-medium text-slate-500">Cancellation Policy</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {viewProperty.cancellationPolicy.charAt(0).toUpperCase() + viewProperty.cancellationPolicy.slice(1)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Room Types */}
                  {isLoadingRoomData ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <p className="text-sm text-slate-500">Loading room data...</p>
                    </div>
                  ) : viewPropertyRoomTypes.length > 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Bed className="w-5 h-5 text-indigo-600" />
                        Room Types ({viewPropertyRoomTypes.length})
                      </h3>
                      <div className="space-y-3">
                        {viewPropertyRoomTypes.map((roomType) => (
                          <div key={roomType.id || roomType._id} className="bg-white/80 rounded-lg p-4 border border-indigo-100">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-900 mb-1">{roomType.name}</h4>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                  <span>{roomType.bedCount || 1} x {roomType.bedType || "King"}</span>
                                  <span>•</span>
                                  <span>Max {roomType.maxOccupancy || 2} guests</span>
                                  {roomType.size && (
                                    <>
                                      <span>•</span>
                                      <span>{roomType.size} sq ft</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-indigo-900">
                                  {formatCurrency(roomType.price || 0, viewProperty.currency || "USD")}/night
                                </p>
                                <p className="text-xs text-slate-500">Inventory: {roomType.inventory || 0}</p>
                              </div>
                            </div>
                            {roomType.amenities && Array.isArray(roomType.amenities) && roomType.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {roomType.amenities.map((amenity, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {viewPropertyRooms.length > 0 && (
                        <p className="text-xs text-slate-500 mt-4">
                          {viewPropertyRooms.length} individual room{viewPropertyRooms.length !== 1 ? 's' : ''} created from room types
                        </p>
                      )}
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}
