const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log("🔧 API_BASE_URL configured as:", API_BASE_URL);

/**
 * Get authentication token from localStorage
 * @returns {string|null} Auth token
 */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("luxeboard.authToken");
}

/**
 * Create headers with authentication token
 * @param {boolean} requireAuth - Whether auth token is required
 * @returns {Object} Headers object
 */
function createHeaders(requireAuth = true) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Centralized fetch wrapper with automatic auth token injection
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {boolean} requireAuth - Whether to require authentication (default: true)
 * @returns {Promise<Response>}
 */
async function fetchWithAuth(url, options = {}, requireAuth = true) {
  const headers = createHeaders(requireAuth);
  
  // Merge with any additional headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

async function handleResponse(response, fallbackMessage) {
  if (!response.ok) {
    // Try to parse JSON error first
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || fallbackMessage);
    } catch (parseError) {
      // If JSON parsing fails, try text
      try {
        const text = await response.text();
        throw new Error(text || fallbackMessage);
      } catch {
        throw new Error(fallbackMessage);
      }
    }
  }
  return response.json();
}

export async function getAllProperties() {
  console.log("🔵 API Call: getAllProperties", `${API_BASE_URL}/properties`);
  const res = await fetchWithAuth(`${API_BASE_URL}/properties`);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch properties");
}

export async function getPropertyById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/properties/${id}`);
  return handleResponse(res, "Failed to fetch property");
}

export async function createProperty(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/properties`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create property");
}

export async function updateProperty(id, data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/properties/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update property");
}

export async function deleteProperty(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/properties/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete property");
}

export async function getAllUsers() {
  console.log("🔵 API Call: getAllUsers", `${API_BASE_URL}/users`);
  const res = await fetchWithAuth(`${API_BASE_URL}/users`);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch users");
}

export async function getUserById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/${id}`);
  return handleResponse(res, "Failed to fetch user");
}

export async function createUser(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create user");
}

export async function updateUser(id, data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update user");
}

export async function deleteUser(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete user");
}

export async function loginUser(data) {
  console.log("🔵 API Call: loginUser", `${API_BASE_URL}/auth/login`, data);
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    }, false); // No auth required for login
    console.log("🔵 API Response status:", res.status, res.statusText);
    const result = await handleResponse(res, "Failed to login");
    console.log("✅ Login successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Login error:", error);
    throw error;
  }
}

export async function registerUser(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify(data),
  }, false); // No auth required for registration
  return handleResponse(res, "Failed to register user");
}

export async function getAllGuests() {
  console.log("🔵 API Call: getAllGuests", `${API_BASE_URL}/guests`);
  const res = await fetchWithAuth(`${API_BASE_URL}/guests`);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch guests");
}

export async function getGuestById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/guests/${id}`);
  return handleResponse(res, "Failed to fetch guest");
}

export async function createGuest(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/guests`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create guest");
}

export async function updateGuest(id, data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/guests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update guest");
}

export async function deleteGuest(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/guests/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete guest");
}

export async function getAllBookings(queryParams = "") {
  const url = `${API_BASE_URL}/bookings${queryParams}`;
  console.log("🔵 API Call: getAllBookings", url);
  const res = await fetchWithAuth(url);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch bookings");
}

export async function getBookingById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`);
  return handleResponse(res, "Failed to fetch booking");
}

export async function createBooking(data) {
  // Check if data contains files (FormData scenario)
  const isFormData = data instanceof FormData;
  
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Only add Content-Type for JSON, let browser set it for FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create booking");
}

export async function updateBooking(id, data) {
  // Check if data contains files (FormData scenario)
  const isFormData = data instanceof FormData;
  
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Only add Content-Type for JSON, let browser set it for FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: "PUT",
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update booking");
}

export async function deleteBooking(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete booking");
}

export async function updateBookingStatus(id, status) {
  const res = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return handleResponse(res, "Failed to update booking status");
}

export async function updateBookingPaymentStatus(id, paymentStatus) {
  const res = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}/payment-status`, {
    method: "PATCH",
    body: JSON.stringify({ payment_status: paymentStatus }),
  });
  return handleResponse(res, "Failed to update payment status");
}

/**
 * Get earnings data with various query parameters
 * @param {Object} params - Query parameters
 * @param {string} params.period - Period filter (week, month, year)
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.groupBy - Group by field (property, month, etc.)
 * @param {string} params.property_id - Filter by property ID
 * @param {string} params.payment_status - Filter by payment status (paid, pending, etc.)
 * @returns {Promise<Object>} Earnings data
 */
export async function getEarnings(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.period) {
    queryParams.append('period', params.period);
  }
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  if (params.groupBy) {
    queryParams.append('groupBy', params.groupBy);
  }
  if (params.property_id) {
    queryParams.append('property_id', params.property_id);
  }
  if (params.payment_status) {
    queryParams.append('payment_status', params.payment_status);
  }

  const url = `${API_BASE_URL}/bookings/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log("🔵 API Call: getEarnings", url);
  const res = await fetchWithAuth(url);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch earnings");
}

export async function getAllPayments() {
  console.log("🔵 API Call: getAllPayments", `${API_BASE_URL}/payments`);
  const res = await fetchWithAuth(`${API_BASE_URL}/payments`);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch payments");
}

export async function getPaymentById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/payments/${id}`);
  return handleResponse(res, "Failed to fetch payment");
}

export async function createPayment(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create payment");
}

export async function updatePayment(id, data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update payment");
}

export async function deletePayment(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/payments/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete payment");
}

export async function getAllPermissions() {
  console.log("🔵 API Call: getAllPermissions", `${API_BASE_URL}/permissions`);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/permissions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch permissions");
}

export async function getPermissionById(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/permissions/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch permission");
}

export async function createPermission(data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create permission");
}

export async function updatePermission(id, data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/permissions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update permission");
}

export async function deletePermission(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/permissions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to delete permission");
}

export async function addSubPermission(id, data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/permissions/${id}/sub-permission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to add sub-permission");
}

export async function getAllTasks(queryParams = "") {
  const url = `${API_BASE_URL}/tasks${queryParams}`;
  console.log("🔵 API Call: getAllTasks", url);
  const res = await fetchWithAuth(url);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch tasks");
}

export async function getTasksByStatus(status) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/tasks?status=${encodeURIComponent(status)}`
  );
  return handleResponse(res, "Failed to fetch tasks by status");
}

export async function createTask(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create task");
}

export async function updateTask(id, data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update task");
}

export async function deleteTask(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete task");
}

export async function getUserRoles() {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/roles/list`);
  return handleResponse(res, "Failed to fetch roles");
}

// Roles API functions
export async function getAllRoles() {
  console.log("🔵 API Call: getAllRoles", `${API_BASE_URL}/roles`);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch roles");
}

export async function getRoleById(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch role");
}

export async function createRole(data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create role");
}

export async function updateRole(id, data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update role");
}

export async function deleteRole(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to delete role");
}

export async function updateRolePermissions(id, permissions) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles/${id}/permissions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permissions }),
  });
  return handleResponse(res, "Failed to update role permissions");
}

export async function getRoleStats() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/roles/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch role statistics");
}

// Auth API functions
export async function getCurrentUser() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch user data");
}

export async function updateProfile(data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update profile");
}

export async function changePassword(currentPassword, newPassword) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/auth/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res, "Failed to change password");
}

// ============================================
// Profile Management API Functions
// ============================================

/**
 * Get current user profile
 * Endpoint: GET /api/users/profile or GET /users/profile
 * Returns the authenticated user's profile information with populated role, permissions, and hostId
 */
export async function getUserProfile() {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/profile`);
  return handleResponse(res, "Failed to fetch user profile");
}

/**
 * Update user profile
 * Endpoint: PUT /api/users/profile or PATCH /api/users/profile
 * Allows users to update their personal information
 * Allowed fields: name, email, phone, businessName (optional, for hosts), department (optional, for staff)
 * @param {Object} data - Profile data to update
 * @param {string} data.name - User's full name (min 2 characters)
 * @param {string} data.email - Email address (validated format, checked for uniqueness)
 * @param {string} [data.phone] - Phone number (optional, validated format)
 * @param {string} [data.businessName] - Business name (optional, for hosts)
 * @param {string} [data.department] - Department (optional, for staff)
 */
export async function updateUserProfile(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update user profile");
}

/**
 * Update user password
 * Endpoint: PUT /api/users/profile/password or PATCH /api/users/profile/password
 * Allows users to change their password
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - New password (min 6 characters)
 */
export async function updateUserPassword(currentPassword, newPassword) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/profile/password`, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res, "Failed to update password");
}

// ============================================
// Superadmin API Functions
// ============================================

export async function loginSuperadmin(data) {
  console.log("🔵 API Call: loginSuperadmin", `${API_BASE_URL}/superadmin/login`);
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/superadmin/login`, {
      method: "POST",
      body: JSON.stringify(data),
    }, false); // No auth required for login
    console.log("🔵 API Response status:", res.status, res.statusText);
    const result = await handleResponse(res, "Failed to login as superadmin");
    console.log("✅ Superadmin login successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Superadmin login error:", error);
    throw error;
  }
}

export async function getSuperadminStatistics() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/statistics`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch superadmin statistics");
}

/**
 * Get all hosts (Superadmin only)
 * 
 * BACKEND REQUIREMENT: When a superadmin is impersonating a host, the backend
 * should still allow access to this endpoint by checking the 'originalRole' or
 * 'impersonatedBy' field in the JWT token. This allows seamless switching between
 * hosts without stopping impersonation.
 * 
 * Expected token structure during impersonation:
 * {
 *   userId: "host_id",
 *   role: "host",
 *   impersonatedBy: "superadmin_id",
 *   originalRole: "superadmin",
 *   isImpersonating: true
 * }
 */
export async function getAllHosts() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch hosts");
}

export async function getHostDetails(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host details");
}

export async function getHostUsers(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host users");
}

export async function getHostProperties(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}/properties`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host properties");
}

export async function getHostBookings(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}/bookings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host bookings");
}

export async function getHostGuests(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}/guests`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host guests");
}

export async function getHostTasks(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host tasks");
}

export async function getHostPayments(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/hosts/${hostId}/payments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch host payments");
}

/**
 * Impersonate a host account (Superadmin only)
 * @param {string} hostId - The ID of the host to impersonate
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function impersonateHost(hostId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/impersonate/${hostId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to impersonate host");
}

/**
 * Stop impersonating and return to superadmin view
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function stopImpersonation() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/superadmin/stop-impersonation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to stop impersonation");
}

// ============================================
// Multi-Tenant User Functions  
// ============================================

export async function getHostsList() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/hosts/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    // If endpoint doesn't exist (404) or forbidden (403), return empty array gracefully
    if (res.status === 404 || res.status === 403) {
      return [];
    }
    
    return handleResponse(res, "Failed to fetch hosts list");
  } catch (error) {
    // Network error or other issues - return empty array
    console.log('ℹ️ Hosts list endpoint not available');
    return [];
  }
}

// Helper function to determine user type
export function getUserType(user) {
  if (!user) return null;
  if (user.role === "superadmin") return "superadmin";
  if (user.host === true) return "host";
  if (user.hostId) return "team_member";
  return null;
}

/**
 * General Search API
 * Search across properties, guests, tasks, and bookings
 * @param {string} query - Search query string
 * @param {string} type - Optional: Filter to specific type (properties, guests, tasks, bookings)
 * @param {number} limit - Optional: Results per category (default: 10)
 * @returns {Promise<Object>} Search results grouped by entity type
 */
export async function search(query, type = null, limit = 10) {
  if (!query || query.trim().length === 0) {
    return {
      query: "",
      total: 0,
      counts: { properties: 0, guests: 0, tasks: 0, bookings: 0 },
      properties: [],
      guests: [],
      tasks: [],
      bookings: [],
    };
  }

  let url = `${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
  if (type) {
    url += `&type=${encodeURIComponent(type)}`;
  }

  const res = await fetchWithAuth(url);
  return handleResponse(res, "Failed to search");
}
