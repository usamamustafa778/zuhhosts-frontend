"use client";

import { useMemo, useState, useEffect } from "react";
import DataTable from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import { getAllGuests, createGuest, updateGuest, deleteGuest } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 10;

export default function GuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [guestsData, setGuestsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for create modal
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: null,
    profilePicture: null
  });

  // Form state for edit modal
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: null,
    profilePicture: null
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
    return guestsData.filter(
      (guest) =>
        (guest.name || "").toLowerCase().includes(query.toLowerCase()) ||
        (guest.email || "").toLowerCase().includes(query.toLowerCase()) ||
        (guest.phone || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [query, guestsData]);

  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Check if files are being uploaded
      const hasFiles = createForm.idCard || createForm.profilePicture;
      
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
        const token = typeof window !== "undefined" ? localStorage.getItem("luxeboard.authToken") : null;
        const response = await fetch("http://localhost:5001/api/guests", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create guest");
        }
        
        newGuest = await response.json();
      } else {
        // Use regular JSON API call
        newGuest = await createGuest({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone
        });
      }
      
      setGuestsData((prev) => [newGuest, ...prev]);
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", phone: "", idCard: null, profilePicture: null });
    } catch (err) {
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
        if (editForm.profilePicture) formData.append("profilePicture", editForm.profilePicture);
        
        // Call API with FormData
        const token = typeof window !== "undefined" ? localStorage.getItem("luxeboard.authToken") : null;
        const response = await fetch(`http://localhost:5001/api/guests/${guestId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
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
      setEditForm({ name: "", email: "", phone: "", idCard: null, profilePicture: null });
    } catch (err) {
      setError(err.message || "Failed to update guest");
    }
  };

  const handleDeleteGuest = async (guestId) => {
    if (!confirm("Are you sure you want to delete this guest? This may impact related bookings.")) return;
    
    try {
      setError(null);
      await deleteGuest(guestId);
      setGuestsData((prev) => prev.filter((guest) => {
        const id = guest.id || guest._id;
        return id !== guestId;
      }));
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
      profilePicture: null
    });
  };

  const fetchBookingHistory = async (guest) => {
    try {
      setIsLoadingHistory(true);
      setError(null);
      const guestId = guest.id || guest._id;
      
      const token = typeof window !== "undefined" ? localStorage.getItem("luxeboard.authToken") : null;
      const response = await fetch(`http://localhost:5001/api/guests/${guestId}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
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
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading guests…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Guests
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Guest directory</h1>
          <p className="text-sm text-slate-500">Search, filter, and manage guest contacts.</p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setCreateOpen(true)}
        >
          Add guest
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search guests by name or email..."
          className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
        />
        <div className="flex gap-2 text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30"
          >
            Prev
          </button>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      <DataTable
        headers={["", "Name", "Email", "Phone", "Created", ""]}
        rows={paginated.map((guest, index) => {
          const guestId = guest.id || guest._id || `guest-${index}`;
          const createdDate = guest.createdAt 
            ? new Date(guest.createdAt).toLocaleDateString() 
            : "N/A";
          const profilePicUrl = guest.profilePicture 
            ? `http://localhost:5001${guest.profilePicture}`
            : null;
          
          return {
            id: guestId,
            cells: [
              <div key={`photo-${guestId}`} className="flex items-center justify-center">
                {profilePicUrl ? (
                  <img 
                    src={profilePicUrl} 
                    alt={guest.name}
                    className="h-10 w-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-semibold">
                    {guest.name ? guest.name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>,
              <div key={`name-${guestId}`}>
                <div className="font-semibold text-slate-900">{guest.name || "N/A"}</div>
                <div className="text-xs text-slate-400">ID: {guestId.slice(-8)}</div>
              </div>,
              <div key={`email-${guestId}`} className="text-sm text-slate-600">
                {guest.email || "N/A"}
              </div>,
              <div key={`phone-${guestId}`} className="text-sm text-slate-600">
                {guest.phone || "N/A"}
              </div>,
              <span key={`created-${guestId}`} className="text-xs text-slate-500">
                {createdDate}
              </span>,
              <div key={`actions-${guestId}`} className="flex gap-2">
                <button
                  className="text-sm text-blue-500 underline-offset-2 hover:text-blue-900 hover:underline"
                  onClick={() => fetchBookingHistory(guest)}
                >
                  History
                </button>
              <button
                className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                  onClick={() => openEditModal(guest)}
              >
                Edit
                </button>
                <button
                  className="text-sm text-rose-500 underline-offset-2 hover:text-rose-900 hover:underline"
                  onClick={() => handleDeleteGuest(guestId)}
                >
                  Delete
                </button>
              </div>,
            ],
          };
        })}
        emptyLabel="No guests match your search."
      />

      <p className="text-center text-xs text-slate-500">
        Page {page + 1} of {Math.max(totalPages, 1)}
      </p>

      <Modal
        title="Edit guest"
        description="Update guest contact information and files."
        isOpen={Boolean(selectedGuest)}
        onClose={() => {
          setSelectedGuest(null);
          setEditForm({ name: "", email: "", phone: "", idCard: null, profilePicture: null });
        }}
        primaryActionLabel="Update guest"
        onPrimaryAction={handleUpdateGuest}
      >
        <form onSubmit={handleUpdateGuest} className="space-y-4">
          {/* Current Files Display */}
          {selectedGuest && (selectedGuest.profilePicture || selectedGuest.idCard) && (
            <div className="flex gap-4 p-3 bg-slate-50 rounded-lg">
              {selectedGuest.profilePicture && (
                <div className="text-center">
                  <img 
                    src={`http://localhost:5001${selectedGuest.profilePicture}`}
                    alt="Current Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 mb-1"
                  />
                  <p className="text-xs text-slate-500">Current Photo</p>
                </div>
              )}
              {selectedGuest.idCard && (
                <div className="text-center">
                  <a 
                    href={`http://localhost:5001${selectedGuest.idCard}`}
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
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="guest@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+1 555 000 0000"
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
                onChange={(e) => setEditForm({ ...editForm, idCard: e.target.files[0] })}
              />
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, GIF, PDF (max 5MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onChange={(e) => setEditForm({ ...editForm, profilePicture: e.target.files[0] })}
              />
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, GIF (max 5MB)</p>
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
          setCreateForm({ name: "", email: "", phone: "", idCard: null, profilePicture: null });
        }}
        primaryActionLabel="Create guest"
        onPrimaryAction={handleCreateGuest}
      >
        <form onSubmit={handleCreateGuest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
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
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="guest@email.com"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Must be unique per host</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="+1 555 000 0000"
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
                onChange={(e) => setCreateForm({ ...createForm, idCard: e.target.files[0] })}
              />
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, GIF, PDF (max 5MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onChange={(e) => setCreateForm({ ...createForm, profilePicture: e.target.files[0] })}
              />
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, GIF (max 5MB)</p>
            </div>
          </div>
        </form>
      </Modal>

      {/* Booking History Modal */}
      <Modal
        title={bookingHistoryGuest ? `${bookingHistoryGuest.name}'s Booking History` : "Booking History"}
        description="Complete booking history and statistics."
        isOpen={Boolean(bookingHistoryGuest)}
        onClose={() => {
          setBookingHistoryGuest(null);
          setBookingHistoryData(null);
        }}
        size="large"
      >
        {isLoadingHistory ? (
          <div className="text-center py-8 text-slate-500">Loading booking history...</div>
        ) : bookingHistoryData ? (
          <div className="space-y-6">
            {/* Guest Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              {bookingHistoryData.guest.profilePicture && (
                <img 
                  src={`http://localhost:5001${bookingHistoryData.guest.profilePicture}`}
                  alt={bookingHistoryData.guest.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                />
              )}
              <div>
                <h3 className="font-semibold text-slate-900">{bookingHistoryData.guest.name}</h3>
                <p className="text-sm text-slate-600">{bookingHistoryData.guest.email}</p>
                <p className="text-sm text-slate-600">{bookingHistoryData.guest.phone}</p>
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
                    {bookingHistoryData.statistics.averageStayDuration.toFixed(1)}
                  </div>
                  <div className="text-xs text-orange-600">Avg Stay (nights)</div>
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
                <p className="text-center text-slate-500 py-4">No bookings found</p>
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
                          <div className="font-semibold text-slate-900">${booking.amount}</div>
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

