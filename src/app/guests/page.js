"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import PhoneInput from "@/components/common/PhoneInput";
import { getAllGuests, createGuest, updateGuest, deleteGuest, API_BASE_URL } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

const PAGE_SIZE = 10;

export default function GuestsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  
  // SEO
  useSEO({
    title: "Guests | Zuha Host",
    description: "Manage your guest directory. View, create, and update guest profiles with contact information.",
    keywords: "guests, guest directory, guest management, customer profiles",
  });
  
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [guestsData, setGuestsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Default to table on desktop, cards on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "cards";
    }
    return "table";
  });
  const [filters, setFilters] = useState({
    search: "",
    hasIdCard: "",
    hasProfilePicture: "",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Form state for create modal
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: null,
    profilePicture: null,
  });

  // Form state for edit modal
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: null,
    profilePicture: null,
  });

  // Preview URLs for create modal
  const [createPreviews, setCreatePreviews] = useState({
    idCard: null,
    profilePicture: null,
  });

  // Preview URLs for edit modal
  const [editPreviews, setEditPreviews] = useState({
    idCard: null,
    profilePicture: null,
  });

  // Booking history state
  const [bookingHistoryGuest, setBookingHistoryGuest] = useState(null);
  const [bookingHistoryData, setBookingHistoryData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadGuests();
  }, [isAuthenticated]);

  const loadGuests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllGuests();
      setGuestsData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load guests");
      console.error("Error loading guests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return guestsData.filter((guest) => {
      // Search filter (name, email, or phone)
      const searchQuery = filters.search || query;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = (guest.name || "").toLowerCase().includes(searchLower);
        const emailMatch = (guest.email || "").toLowerCase().includes(searchLower);
        const phoneMatch = (guest.phone || "").toLowerCase().includes(searchLower);
        if (!nameMatch && !emailMatch && !phoneMatch) return false;
      }

      // Has ID Card filter
      if (filters.hasIdCard === "yes" && !guest.idCard) return false;
      if (filters.hasIdCard === "no" && guest.idCard) return false;

      // Has Profile Picture filter
      if (filters.hasProfilePicture === "yes" && !guest.profilePicture) return false;
      if (filters.hasProfilePicture === "no" && guest.profilePicture) return false;

      return true;
    });
  }, [query, filters, guestsData]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      hasIdCard: "",
      hasProfilePicture: "",
    });
    setQuery("");
    setPage(0);
  };

  const paginated = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Reset page if current page is beyond available pages
  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    } else if (totalPages === 0 && page > 0) {
      setPage(0);
    }
  }, [totalPages, page]);

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    console.log("🚀 Create guest form submitted", createForm);

    try {
      setError(null);

      // Check if files are being uploaded
      const hasFiles = createForm.idCard || createForm.profilePicture;
      console.log("📁 Has files:", hasFiles);

      let newGuest;
      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append("name", createForm.name);
        formData.append("email", createForm.email);
        formData.append("phone", createForm.phone);

        if (createForm.idCard) {
          formData.append("idCard", createForm.idCard);
        }
        if (createForm.profilePicture) {
          formData.append("profilePicture", createForm.profilePicture);
        }

        // Call API with FormData
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("luxeboard.authToken")
            : null;
        console.log("📤 Sending FormData to API...", { hasToken: !!token });

        const response = await fetch(`${API_BASE_URL}/guests`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        console.log("📥 API Response:", response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ API Error:", errorData);
          throw new Error(errorData.error || "Failed to create guest");
        }

        newGuest = await response.json();
        console.log("✅ Guest created successfully:", newGuest);
      } else {
        // Use regular JSON API call
        console.log("📤 Sending JSON to API...");
        newGuest = await createGuest({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
        });
        console.log("✅ Guest created successfully:", newGuest);
      }

      setGuestsData((prev) => [newGuest, ...prev]);
      setCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        idCard: null,
        profilePicture: null,
      });
      cleanupCreatePreviews();
      console.log("✅ Modal closed and form reset");
    } catch (err) {
      console.error("❌ Error creating guest:", err);
      setError(err.message || "Failed to create guest");
    }
  };

  const handleUpdateGuest = async (e) => {
    e.preventDefault();
    if (!selectedGuest) return;

    try {
      setError(null);
      const guestId = selectedGuest.id || selectedGuest._id;

      // Check if files are being uploaded
      const hasFiles = editForm.idCard || editForm.profilePicture;

      let updatedGuest;
      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();

        // Only append fields that have values
        if (editForm.name) formData.append("name", editForm.name);
        if (editForm.email) formData.append("email", editForm.email);
        if (editForm.phone) formData.append("phone", editForm.phone);
        if (editForm.idCard) formData.append("idCard", editForm.idCard);
        if (editForm.profilePicture)
          formData.append("profilePicture", editForm.profilePicture);

        // Call API with FormData
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("luxeboard.authToken")
            : null;
        const response = await fetch(
          `${API_BASE_URL}/guests/${guestId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update guest");
        }

        updatedGuest = await response.json();
      } else {
        // Use regular JSON API call
        const updateData = {};
        if (editForm.name) updateData.name = editForm.name;
        if (editForm.email) updateData.email = editForm.email;
        if (editForm.phone) updateData.phone = editForm.phone;

        updatedGuest = await updateGuest(guestId, updateData);
      }

      setGuestsData((prev) =>
        prev.map((guest) => {
          const id = guest.id || guest._id;
          return id === guestId ? updatedGuest : guest;
        })
      );
      setSelectedGuest(null);
      setEditForm({
        name: "",
        email: "",
        phone: "",
        idCard: null,
        profilePicture: null,
      });
      cleanupEditPreviews();
    } catch (err) {
      setError(err.message || "Failed to update guest");
    }
  };

  const handleDeleteGuest = async (guestId) => {
    if (
      !confirm(
        "Are you sure you want to delete this guest? This may impact related bookings."
      )
    )
      return;

    try {
      setError(null);
      await deleteGuest(guestId);
      setGuestsData((prev) =>
        prev.filter((guest) => {
          const id = guest.id || guest._id;
          return id !== guestId;
        })
      );
    } catch (err) {
      setError(err.message || "Failed to delete guest");
    }
  };

  const openEditModal = (guest) => {
    setSelectedGuest(guest);
    setEditForm({
      name: guest.name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      idCard: null,
      profilePicture: null,
    });
    // Reset previews
    setEditPreviews({ idCard: null, profilePicture: null });
  };

  // Helper function to create preview URL
  const createPreviewUrl = (file) => {
    if (!file) return null;
    // Only create preview for images, not PDFs
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Handle file selection for create form
  const handleCreateFileChange = (fieldName, file) => {
    setCreateForm({ ...createForm, [fieldName]: file });

    // Create preview URL
    const previewUrl = createPreviewUrl(file);
    setCreatePreviews((prev) => ({
      ...prev,
      [fieldName]: previewUrl,
    }));
  };

  // Handle file selection for edit form
  const handleEditFileChange = (fieldName, file) => {
    setEditForm({ ...editForm, [fieldName]: file });

    // Create preview URL
    const previewUrl = createPreviewUrl(file);
    setEditPreviews((prev) => ({
      ...prev,
      [fieldName]: previewUrl,
    }));
  };

  // Cleanup preview URLs when modal closes
  const cleanupCreatePreviews = () => {
    if (createPreviews.idCard) URL.revokeObjectURL(createPreviews.idCard);
    if (createPreviews.profilePicture)
      URL.revokeObjectURL(createPreviews.profilePicture);
    setCreatePreviews({ idCard: null, profilePicture: null });
  };

  const cleanupEditPreviews = () => {
    if (editPreviews.idCard) URL.revokeObjectURL(editPreviews.idCard);
    if (editPreviews.profilePicture)
      URL.revokeObjectURL(editPreviews.profilePicture);
    setEditPreviews({ idCard: null, profilePicture: null });
  };

  const fetchBookingHistory = async (guest) => {
    try {
      setIsLoadingHistory(true);
      setError(null);
      const guestId = guest.id || guest._id;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("luxeboard.authToken")
          : null;
      const response = await fetch(
        `${API_BASE_URL}/guests/${guestId}/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch booking history");
      }

      const data = await response.json();
      setBookingHistoryGuest(guest);
      setBookingHistoryData(data);
    } catch (err) {
      setError(err.message || "Failed to fetch booking history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading guests..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
            >
              <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="mt-2 text-2xl lg:text-3xl font-semibold text-slate-900">
              Guest directory
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

            {/* View Mode Switcher */}
            <div className="flex rounded-full border border-slate-200 p-1">
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setViewMode("cards")}
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
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setViewMode("table")}
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

            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={() => setCreateOpen(true)}
            >
              <span className="hidden sm:inline">Add guest</span>
              <span className="sm:hidden">Add</span>
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
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Has ID Card */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ID Card
                </label>
                <select
                  value={filters.hasIdCard}
                  onChange={(e) => handleFilterChange("hasIdCard", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">All</option>
                  <option value="yes">Has ID Card</option>
                  <option value="no">No ID Card</option>
                </select>
              </div>

              {/* Has Profile Picture */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Profile Picture
                </label>
                <select
                  value={filters.hasProfilePicture}
                  onChange={(e) => handleFilterChange("hasProfilePicture", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">All</option>
                  <option value="yes">Has Photo</option>
                  <option value="no">No Photo</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filtered.length}
                </span>{" "}
                of {guestsData.length} guest{guestsData.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Pagination Controls - Only for table view */}
        {viewMode === "table" && filtered.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex gap-2 text-sm">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Prev
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </p>
          </div>
        )}
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No guests found</h3>
              <p className="text-sm text-slate-600 mb-6">Try adjusting your filters or add a new guest</p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setCreateOpen(true)}
              >
                Add guest
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {paginated.map((guest, index) => {
                const guestId = guest.id || guest._id || `guest-${index}`;
                const profilePicUrl = guest.profilePicture
                  ? `${API_BASE_URL}${guest.profilePicture}`
                  : null;
                const idCardUrl = guest.idCard
                  ? `${API_BASE_URL}${guest.idCard}`
                  : null;
                const createdDate = guest.createdAt
                  ? new Date(guest.createdAt).toLocaleDateString()
                  : "N/A";

                return (
                  <div
                    key={guestId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Guest Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        {profilePicUrl ? (
                          <img
                            src={profilePicUrl}
                            alt={guest.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                            {guest.name?.charAt(0)?.toUpperCase() || "G"}
                          </div>
                        )}
                        
                        {/* Name, Phone, and ID Card */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate mb-1">{guest.name || "N/A"}</h3>
                          <p className="text-sm text-slate-600 mb-1">{guest.phone || "N/A"}</p>
                          <div className="text-sm">
                            {idCardUrl ? (
                              <a
                                href={idCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline font-medium"
                              >
                                View ID Card
                              </a>
                            ) : (
                              <span className="text-slate-400">ID Card: N/A</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions Dropdown */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === guestId ? null : guestId)}
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
                        >
                          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdownId === guestId && (
                          <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                            <button
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                              onClick={() => {
                                fetchBookingHistory(guest);
                                setOpenDropdownId(null);
                              }}
                              title="View Booking History"
                            >
                              <Eye className="w-4 h-4" />
                              History
                            </button>
                            <button
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                              onClick={() => {
                                openEditModal(guest);
                                setOpenDropdownId(null);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                              onClick={() => {
                                handleDeleteGuest(guestId);
                                setOpenDropdownId(null);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination for Cards View */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm mt-4">
              <div className="flex gap-2 text-sm">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
              <p className="text-sm text-slate-600">
                Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} guest{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <DataTable
        headers={[
          "#",
          "Profile Pic",
          "Name",
          "Email",
          "Phone",
          "ID Card",
          "Created",
          "Actions",
        ]}
        rows={paginated.map((guest, index) => {
          const guestId = guest.id || guest._id || `guest-${index}`;
          const createdDate = guest.createdAt
            ? new Date(guest.createdAt).toLocaleDateString()
            : "N/A";
          const profilePicUrl = guest.profilePicture
            ? `${API_BASE_URL}${guest.profilePicture}`
            : null;
          const idCardUrl = guest.idCard
            ? `${API_BASE_URL}${guest.idCard}`
            : null;

          // Calculate serial number based on current page
          const serialNumber = page * PAGE_SIZE + index + 1;

          return {
            id: guestId,
            cells: [
              <span
                key={`serial-${guestId}`}
                className="text-sm font-medium text-slate-500"
              >
                {serialNumber}
              </span>,
              <div
                key={`photo-${guestId}`}
                className="flex items-center justify-center"
              >
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt={guest.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200"
                    title="View Profile Picture"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-semibold">
                    {guest.name ? guest.name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>,
              <div key={`name-${guestId}`}>
                <div className="font-semibold text-slate-900">
                  {guest.name || "N/A"}
                </div>
                <div className="text-xs text-slate-400">
                  ID: {guestId.slice(-8)}
                </div>
              </div>,
              <div key={`email-${guestId}`} className="text-sm text-slate-600">
                {guest.email || "N/A"}
              </div>,
              <div key={`phone-${guestId}`} className="text-sm text-slate-600">
                {guest.phone || "N/A"}
              </div>,
              <div key={`idcard-${guestId}`} className="text-center">
                {idCardUrl ? (
                  <a
                    href={idCardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    title="View ID Card"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No ID</span>
                )}
              </div>,
              <span
                key={`created-${guestId}`}
                className="text-xs text-slate-500"
              >
                {createdDate}
              </span>,
              <div key={`actions-${guestId}`} className="flex gap-2">
                <button
                  className="text-blue-500 hover:text-blue-900 transition-colors"
                  onClick={() => fetchBookingHistory(guest)}
                  title="View Booking History"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                  onClick={() => openEditModal(guest)}
                  title="Edit Guest"
                >
                  Edit
                </button>
                <button
                  className="text-sm text-rose-500 underline-offset-2 hover:text-rose-900 hover:underline"
                  onClick={() => handleDeleteGuest(guestId)}
                  title="Delete Guest"
                >
                  Delete
                </button>
              </div>,
            ],
          };
        })}
        emptyLabel="No guests match your search."
      />
      )}

      <Modal
        title="Edit guest"
        description="Update guest contact information and files."
        isOpen={Boolean(selectedGuest)}
        onClose={() => {
          setSelectedGuest(null);
          setEditForm({
            name: "",
            email: "",
            phone: "",
            idCard: null,
            profilePicture: null,
          });
          cleanupEditPreviews();
        }}
        primaryActionLabel="Update guest"
        onPrimaryAction={() => {
          // Trigger form submission
          document.getElementById("edit-guest-form")?.requestSubmit();
        }}
      >
        <form
          id="edit-guest-form"
          onSubmit={handleUpdateGuest}
          className="space-y-4"
        >
          {/* Current Files Display */}
          {selectedGuest &&
            (selectedGuest.profilePicture || selectedGuest.idCard) && (
              <div className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                {selectedGuest.profilePicture && (
                  <div className="text-center">
                    <img
                      src={`${API_BASE_URL}${selectedGuest.profilePicture}`}
                      alt="Current Profile"
                      className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 mb-1"
                    />
                    <p className="text-xs text-slate-500">Current Photo</p>
                  </div>
                )}
                {selectedGuest.idCard && (
                  <div className="text-center">
                    <a
                      href={`${API_BASE_URL}${selectedGuest.idCard}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View ID Card
                    </a>
                    <p className="text-xs text-slate-500 mt-1">Current ID</p>
                  </div>
                )}
              </div>
            )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Guest full name"
              minLength={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              placeholder="guest@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone <span className="text-rose-500">*</span>
            </label>
            <PhoneInput
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              placeholder="123 456 7890"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID Card
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onChange={(e) =>
                  handleEditFileChange("idCard", e.target.files[0])
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                JPEG, PNG, GIF, PDF (max 5MB)
              </p>
              {editPreviews.idCard && (
                <div className="mt-2">
                  <img
                    src={editPreviews.idCard}
                    alt="ID Card Preview"
                    className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-slate-50"
                  />
                  <p className="mt-1 text-xs text-green-600">
                    ✓ New ID card selected
                  </p>
                </div>
              )}
              {editForm.idCard &&
                !editPreviews.idCard &&
                editForm.idCard.type === "application/pdf" && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ PDF file selected: {editForm.idCard.name}
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onChange={(e) =>
                  handleEditFileChange("profilePicture", e.target.files[0])
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                JPEG, PNG, GIF (max 5MB)
              </p>
              {editPreviews.profilePicture && (
                <div className="mt-2">
                  <img
                    src={editPreviews.profilePicture}
                    alt="Profile Picture Preview"
                    className="w-24 h-24 object-cover border-2 border-slate-200 rounded-full mx-auto bg-slate-50"
                  />
                  <p className="mt-1 text-xs text-green-600 text-center">
                    ✓ New photo selected
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        title="Add guest"
        description="Quick-create guest profiles with ID and photo."
        isOpen={isCreateOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateForm({
            name: "",
            email: "",
            phone: "",
            idCard: null,
            profilePicture: null,
          });
          cleanupCreatePreviews();
        }}
        primaryActionLabel="Create guest"
        onPrimaryAction={() => {
          // Trigger form submission
          document.getElementById("create-guest-form")?.requestSubmit();
        }}
      >
        <form
          id="create-guest-form"
          onSubmit={handleCreateGuest}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="Guest full name"
              minLength={2}
              required
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 2 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="guest@email.com"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Must be unique per host
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone <span className="text-rose-500">*</span>
            </label>
            <PhoneInput
              value={createForm.phone}
              onChange={(e) =>
                setCreateForm({ ...createForm, phone: e.target.value })
              }
              placeholder="123 456 7890"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID Card
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onChange={(e) =>
                  handleCreateFileChange("idCard", e.target.files[0])
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                JPEG, PNG, GIF, PDF (max 5MB)
              </p>
              {createPreviews.idCard && (
                <div className="mt-2">
                  <img
                    src={createPreviews.idCard}
                    alt="ID Card Preview"
                    className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-slate-50"
                  />
                  <p className="mt-1 text-xs text-green-600">
                    ✓ ID card ready to upload
                  </p>
                </div>
              )}
              {createForm.idCard &&
                !createPreviews.idCard &&
                createForm.idCard.type === "application/pdf" && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ PDF file selected: {createForm.idCard.name}
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onChange={(e) =>
                  handleCreateFileChange("profilePicture", e.target.files[0])
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                JPEG, PNG, GIF (max 5MB)
              </p>
              {createPreviews.profilePicture && (
                <div className="mt-2">
                  <img
                    src={createPreviews.profilePicture}
                    alt="Profile Picture Preview"
                    className="w-24 h-24 object-cover border-2 border-slate-200 rounded-full mx-auto bg-slate-50"
                  />
                  <p className="mt-1 text-xs text-green-600 text-center">
                    ✓ Photo ready to upload
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Booking History Modal */}
      <Modal
        title={
          bookingHistoryGuest
            ? `${bookingHistoryGuest.name}'s Booking History`
            : "Booking History"
        }
        description="Complete booking history and statistics."
        isOpen={Boolean(bookingHistoryGuest)}
        onClose={() => {
          setBookingHistoryGuest(null);
          setBookingHistoryData(null);
        }}
        size="large"
      >
        {isLoadingHistory ? (
          <div className="text-center py-8 text-slate-500">
            Loading booking history...
          </div>
        ) : bookingHistoryData ? (
          <div className="space-y-6">
            {/* Guest Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                {bookingHistoryData.guest.profilePicture ? (
                  <img
                    src={`${API_BASE_URL}${bookingHistoryData.guest.profilePicture}`}
                    alt={bookingHistoryData.guest.name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                    {bookingHistoryData.guest.name?.charAt(0)?.toUpperCase() || "G"}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {bookingHistoryData.guest.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {bookingHistoryData.guest.email}
                  </p>
                  <p className="text-sm text-slate-600">
                    {bookingHistoryData.guest.phone}
                  </p>
                </div>
              </div>
              
              {/* ID Card */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">ID Card</h4>
                {bookingHistoryData.guest.idCard ? (
                  <div className="space-y-2">
                    <a
                      href={`${API_BASE_URL}${bookingHistoryData.guest.idCard}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={`${API_BASE_URL}${bookingHistoryData.guest.idCard}`}
                        alt="ID Card"
                        className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-white"
                      />
                    </a>
                    <a
                      href={`${API_BASE_URL}${bookingHistoryData.guest.idCard}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Full Size
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No ID card available</p>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {bookingHistoryData.statistics.totalBookings}
                  </div>
                  <div className="text-xs text-blue-600">Total Bookings</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    ${bookingHistoryData.statistics.totalSpent}
                  </div>
                  <div className="text-xs text-green-600">Total Spent</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {bookingHistoryData.statistics.totalNights}
                  </div>
                  <div className="text-xs text-purple-600">Total Nights</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">
                    {bookingHistoryData.statistics.averageStayDuration.toFixed(
                      1
                    )}
                  </div>
                  <div className="text-xs text-orange-600">
                    Avg Stay (nights)
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {bookingHistoryData.statistics.upcomingBookings}
                  </div>
                  <div className="text-xs text-slate-600">Upcoming</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {bookingHistoryData.statistics.currentBookings}
                  </div>
                  <div className="text-xs text-slate-600">Current</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {bookingHistoryData.statistics.pastBookings}
                  </div>
                  <div className="text-xs text-slate-600">Past</div>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">
                Bookings ({bookingHistoryData.bookings.length})
              </h4>
              {bookingHistoryData.bookings.length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  No bookings found
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bookingHistoryData.bookings.map((booking) => (
                    <div
                      key={booking.id || booking._id}
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-slate-900">
                            {booking.property_id?.title || "N/A"}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {booking.property_id?.location || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">
                            ${booking.amount}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID: {(booking.id || booking._id).slice(-8)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Check-in:</span>{" "}
                          {new Date(booking.start_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Check-out:</span>{" "}
                          {new Date(booking.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
