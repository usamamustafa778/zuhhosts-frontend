export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    // Clone the response so we can read it multiple times if needed
    const clonedResponse = response.clone();

    // Try to parse JSON error first
    try {
      const errorData = await response.json();

      // Extract error message from various possible fields
      let errorMessage = fallbackMessage;

      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object') {
          errorMessage = errorData.error ||
            errorData.message ||
            errorData.msg ||
            errorData.errorMessage ||
            (errorData.errors && Array.isArray(errorData.errors) ? errorData.errors.join(', ') : null) ||
            fallbackMessage;
        }
      }

      throw new Error(errorMessage);
    } catch (parseError) {
      // If we successfully parsed JSON and got a specific error message, use it
      if (parseError.message && parseError.message !== fallbackMessage && parseError.name === 'Error') {
        throw parseError;
      }

      // If JSON parsing failed, try reading as text
      try {
        const text = await clonedResponse.text();
        let errorMessage = fallbackMessage;

        // Try to parse the text as JSON if it looks like JSON
        if (text && text.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(text);
            errorMessage = parsed.error ||
              parsed.message ||
              parsed.msg ||
              parsed.errorMessage ||
              text ||
              fallbackMessage;
          } catch {
            errorMessage = text || fallbackMessage;
          }
        } else if (text) {
          errorMessage = text;
        }

        throw new Error(errorMessage);
      } catch (textError) {
        // If we got a specific error message from text, use it
        if (textError.message && textError.message !== fallbackMessage) {
          throw textError;
        }
        // Fall back to the original parseError if it has a specific message
        if (parseError.message && parseError.message !== fallbackMessage) {
          throw parseError;
        }
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

export async function createProperty(data, images = []) {
  // If images are provided, use FormData
  if (images && images.length > 0) {
    const formData = new FormData();

    // Append all property data
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    // Append images
    images.forEach((image) => {
      formData.append('images', image);
    });

    const token = getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type - browser will set it with boundary for FormData

    const res = await fetch(`${API_BASE_URL}/properties`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse(res, "Failed to create property");
  }

  // Otherwise use JSON
  const res = await fetchWithAuth(`${API_BASE_URL}/properties`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create property");
}

export async function updateProperty(id, data, images = [], imagesToRemove = []) {
  // If images are provided or images need to be removed, use FormData
  if ((images && images.length > 0) || (imagesToRemove && imagesToRemove.length > 0)) {
    const formData = new FormData();

    // Append all property data
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    // Append new images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    // Append images to remove
    if (imagesToRemove && imagesToRemove.length > 0) {
      formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
    }

    const token = getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type - browser will set it with boundary for FormData

    const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: "PUT",
      headers,
      body: formData,
    });
    return handleResponse(res, "Failed to update property");
  }

  // Otherwise use JSON
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
 * @param {string} params.currency - Filter by currency code (e.g., "USD", "PKR", "INR")
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
  if (params.currency) {
    queryParams.append('currency', params.currency);
  }

  const url = `${API_BASE_URL}/bookings/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log("🔵 API Call: getEarnings", url);
  const res = await fetchWithAuth(url);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch earnings");
}

/**
 * Get all payments with optional filters
 * @param {Object} filters - Optional filters
 * @param {string} filters.task_id - Filter by task ID
 * @param {string} filters.booking_id - Filter by booking ID
 * @param {string} filters.property_id - Filter by property ID
 * @param {string} filters.payment_type - Filter by payment type (expense, income)
 * @param {string} filters.method - Filter by payment method (cash, bank, online)
 * @returns {Promise<Array>} Array of payments
 */
export async function getAllPayments(filters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.task_id) queryParams.append('task_id', filters.task_id);
  if (filters.booking_id) queryParams.append('booking_id', filters.booking_id);
  if (filters.property_id) queryParams.append('property_id', filters.property_id);
  if (filters.payment_type) queryParams.append('payment_type', filters.payment_type);
  if (filters.method) queryParams.append('method', filters.method);

  const url = `${API_BASE_URL}/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log("🔵 API Call: getAllPayments", url);
  const res = await fetchWithAuth(url);
  console.log("🔵 API Response:", res.status, res.statusText);
  return handleResponse(res, "Failed to fetch payments");
}

export async function getPaymentById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/payments/${id}`);
  return handleResponse(res, "Failed to fetch payment");
}

/**
 * Create a payment
 * @param {Object} data - Payment data
 * @param {number} data.amount - Payment amount (required, ≥ 0)
 * @param {string} data.payment_type - Payment type: 'expense' or 'income' (required)
 * @param {string} data.method - Payment method: 'cash', 'bank', or 'online' (required)
 * @param {string} [data.date] - Payment date (ISO 8601, optional, defaults to now)
 * @param {string} [data.task_id] - Task ID (optional)
 * @param {string} [data.booking_id] - Booking ID (optional)
 * @param {string} [data.property_id] - Property ID (optional)
 * @param {string} [data.paid_to] - Person/entity paid to (optional)
 * @param {string} [data.paid_by] - Person/entity who paid (optional)
 * @param {string} [data.notes] - Additional notes (optional)
 * @returns {Promise<Object>} Created payment object
 */
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

/**
 * Create a task with optional payment
 * @param {Object} data - Task data
 * @param {string} data.property_id - Property ID (required)
 * @param {string} data.title - Task title (required, min 3 chars)
 * @param {string} data.description - Task description (required, min 5 chars)
 * @param {string} data.assigned_to - Assigned user ID (required)
 * @param {string} [data.status] - Task status: 'pending', 'in_progress', 'completed', 'cancelled' (optional)
 * @param {Object} [data.payment] - Optional payment object
 * @param {number} data.payment.amount - Payment amount (required if payment provided)
 * @param {string} data.payment.payment_type - Payment type: 'expense' or 'income' (required if payment provided)
 * @param {string} data.payment.method - Payment method: 'cash', 'bank', or 'online' (required if payment provided)
 * @param {string} [data.payment.date] - Payment date (optional)
 * @param {string} [data.payment.booking_id] - Booking ID (optional)
 * @param {string} [data.payment.paid_to] - Person/entity paid to (optional)
 * @param {string} [data.payment.paid_by] - Person/entity who paid (optional)
 * @param {string} [data.payment.notes] - Payment notes (optional)
 * @returns {Promise<Object>} Created task object with payment if provided
 */
export async function createTask(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create task");
}

/**
 * Update a task with optional payment
 * @param {string} id - Task ID
 * @param {Object} data - Task data (all fields optional)
 * @param {string} [data.property_id] - Property ID
 * @param {string} [data.title] - Task title (min 3 chars)
 * @param {string} [data.description] - Task description (min 5 chars)
 * @param {string} [data.assigned_to] - Assigned user ID
 * @param {string} [data.status] - Task status
 * @param {Object} [data.payment] - Optional payment object (creates or updates existing payment)
 * @param {number} data.payment.amount - Payment amount (required if payment provided)
 * @param {string} data.payment.payment_type - Payment type: 'maintenance_work', 'staff_payment', 'utility_bills', 'supplies', or 'refund' (required if payment provided)
 * @param {string} data.payment.method - Payment method: 'cash', 'bank', or 'online' (required if payment provided)
 * @param {string} [data.payment.status] - Payment status: 'paid' or 'unpaid' (optional, defaults to 'unpaid')
 * @param {string} [data.payment.date] - Payment date (optional)
 * @param {string} [data.payment.booking_id] - Booking ID (optional)
 * @param {string} [data.payment.paid_to] - Person/entity paid to (optional)
 * @param {string} [data.payment.paid_by] - Person/entity who paid (optional)
 * @param {string} [data.payment.notes] - Payment notes (optional)
 * @returns {Promise<Object>} Updated task object with payment if provided
 */
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

/**
 * Get available currencies
 * Endpoint: GET /api/users/currencies
 * Returns list of all supported currencies with codes and names
 * @returns {Promise<Object>} Object with currencies array and default currency
 */
export async function getCurrencies() {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/currencies`);
  return handleResponse(res, "Failed to fetch currencies");
}

/**
 * Update user's default currency
 * Endpoint: PUT /api/users/profile/currency or PATCH /api/users/profile/currency
 * Updates the user's default currency preference
 * @param {string} currency - Currency code (e.g., "USD", "PKR", "INR")
 * @returns {Promise<Object>} Updated user object
 */
export async function updateDefaultCurrency(currency) {
  const res = await fetchWithAuth(`${API_BASE_URL}/users/profile/currency`, {
    method: "PUT",
    body: JSON.stringify({ currency }),
  });
  return handleResponse(res, "Failed to update default currency");
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

// ============================================
// Subscription API Functions (Superadmin)
// ============================================

/**
 * Get subscription statistics
 * Endpoint: GET /api/subscriptions/statistics
 * @returns {Promise<Object>} Subscription statistics
 */
export async function getSubscriptionStatistics() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/statistics`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch subscription statistics");
}

/**
 * Get all subscriptions with optional filters
 * Endpoint: GET /api/subscriptions/all
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (trial, pending, approved, rejected, expired)
 * @param {string} filters.package - Filter by package (free_trial, basic, big_businesses, enterprise)
 * @param {string} filters.paymentStatus - Filter by payment status (paid, unpaid)
 * @returns {Promise<Object>} Object with count and subscriptions array
 */
export async function getAllSubscriptions(filters = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.package) queryParams.append("package", filters.package);
  if (filters.paymentStatus) queryParams.append("paymentStatus", filters.paymentStatus);

  const url = `${API_BASE_URL}/api/subscriptions/all${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch subscriptions");
}

/**
 * Get subscription by ID
 * Endpoint: GET /api/subscriptions/:id
 * @param {string} id - Subscription ID
 * @returns {Promise<Object>} Subscription object
 */
export async function getSubscriptionById(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch subscription");
}

/**
 * Update subscription
 * Endpoint: PUT /api/subscriptions/:id
 * @param {string} id - Subscription ID
 * @param {Object} data - Update data
 * @param {string} [data.package] - Package type
 * @param {number} [data.price] - Price
 * @param {string} [data.notes] - Notes
 * @returns {Promise<Object>} Updated subscription object
 */
export async function updateSubscription(id, data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update subscription");
}

/**
 * Delete subscription
 * Endpoint: DELETE /api/subscriptions/:id
 * @param {string} id - Subscription ID
 * @returns {Promise<Object>} Success message
 */
export async function deleteSubscription(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to delete subscription");
}

/**
 * Approve subscription
 * Endpoint: POST /api/subscriptions/:id/approve
 * @param {string} id - Subscription ID
 * @param {Object} data - Approval data
 * @param {string} [data.notes] - Approval notes
 * @returns {Promise<Object>} Updated subscription object
 */
export async function approveSubscription(id, data = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to approve subscription");
}

/**
 * Reject subscription
 * Endpoint: POST /api/subscriptions/:id/reject
 * @param {string} id - Subscription ID
 * @param {Object} data - Rejection data
 * @param {string} data.rejectionReason - Reason for rejection
 * @returns {Promise<Object>} Updated subscription object
 */
export async function rejectSubscription(id, data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to reject subscription");
}

// ============================================
// User Subscription API Functions
// ============================================

/**
 * Get user's active subscription
 * Endpoint: GET /api/subscriptions/my-active
 * @returns {Promise<Object>} Active subscription info
 */
export async function getMyActiveSubscription() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/my-active`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch active subscription");
}

/**
 * Get user's subscriptions with optional filters
 * Endpoint: GET /api/subscriptions/my-subscriptions
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.package - Filter by package
 * @param {string} filters.paymentStatus - Filter by payment status
 * @returns {Promise<Object>} Object with count and subscriptions array
 */
export async function getMySubscriptions(filters = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.package) queryParams.append("package", filters.package);
  if (filters.paymentStatus) queryParams.append("paymentStatus", filters.paymentStatus);

  const url = `${API_BASE_URL}/api/subscriptions/my-subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch subscriptions");
}

/**
 * Get user's subscription by ID
 * Endpoint: GET /api/subscriptions/my-subscriptions/:id
 * @param {string} id - Subscription ID
 * @returns {Promise<Object>} Subscription object
 */
export async function getMySubscriptionById(id) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/my-subscriptions/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, "Failed to fetch subscription");
}

/**
 * Create subscription
 * Endpoint: POST /api/subscriptions/create
 * @param {Object} data - Subscription data
 * @param {string} data.package - Package type (basic, big_businesses, enterprise)
 * @param {string} [data.notes] - Optional notes
 * @param {File} [data.paymentScreenshot] - Payment screenshot file
 * @returns {Promise<Object>} Created subscription object
 */
export async function createSubscription(data) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  // Check if paymentScreenshot is provided (FormData scenario)
  const hasFile = data.paymentScreenshot instanceof File;

  if (hasFile) {
    const formData = new FormData();
    formData.append("package", data.package);
    if (data.notes) formData.append("notes", data.notes);
    if (data.paymentScreenshot) formData.append("paymentScreenshot", data.paymentScreenshot);

    const res = await fetch(`${API_BASE_URL}/api/subscriptions/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(res, "Failed to create subscription");
  } else {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        package: data.package,
        notes: data.notes || "",
      }),
    });
    return handleResponse(res, "Failed to create subscription");
  }
}

/**
 * Upload payment screenshot for subscription
 * Endpoint: POST /api/subscriptions/:id/upload-screenshot
 * @param {string} id - Subscription ID
 * @param {File} file - Payment screenshot file
 * @returns {Promise<Object>} Updated subscription object
 */
export async function uploadPaymentScreenshot(id, file) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("luxeboard.authToken")
      : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const formData = new FormData();
  formData.append("paymentScreenshot", file);

  const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/upload-screenshot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(res, "Failed to upload payment screenshot");
}
