/**
 * Error Handling Utilities
 * 
 * Centralized error handling for API errors
 */

/**
 * Check if error is TENANT_REQUIRED (403 with specific code)
 * @param {Error|Object} error - Error object or response
 * @returns {boolean}
 */
export const isTenantRequiredError = (error) => {
  if (!error) return false;

  // Check if error message contains the TENANT_REQUIRED indicator
  const message = error.message || error.msg || '';
  if (message.includes('TENANT_REQUIRED') ||
      message.includes('not associated with a tenant') ||
      message.includes('complete tenant setup')) {
    return true;
  }

  // Check response data if available
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.code === 'TENANT_REQUIRED') {
      return true;
    }
  }

  // Check if it's a 403 error with tenant-related message
  if (error.status === 403 && message.toLowerCase().includes('tenant')) {
    return true;
  }

  return false;
};

/**
 * Check if error is authentication error (401)
 * @param {Error|Object} error
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  if (!error) return false;

  const status = error.status || error.statusCode;
  return status === 401 || status === '401';
};

/**
 * Check if error is authorization/permission error (403)
 * @param {Error|Object} error
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
  if (!error) return false;

  // Don't treat TENANT_REQUIRED as a permission error
  if (isTenantRequiredError(error)) {
    return false;
  }

  const status = error.status || error.statusCode;
  return status === 403 || status === '403';
};

/**
 * Extract user-friendly error message
 * @param {Error|Object} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An error occurred';

  // Handle TENANT_REQUIRED specially
  if (isTenantRequiredError(error)) {
    return 'Please complete your business setup to continue';
  }

  // Try various error message fields
  if (error.message) return error.message;
  if (error.msg) return error.msg;
  if (error.error) return error.error;
  if (error.errorMessage) return error.errorMessage;

  // Check response data
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.message) return data.message;
    if (data.msg) return data.msg;
    if (data.error) return data.error;
  }

  // Status-based messages
  const status = error.status || error.statusCode;
  if (status === 401) return 'Please log in to continue';
  if (status === 403) return 'You don\'t have permission to do this';
  if (status === 404) return 'Resource not found';
  if (status === 500) return 'Server error. Please try again later';

  return 'An unexpected error occurred';
};

/**
 * Handle API error with appropriate action
 * @param {Error|Object} error
 * @param {Object} router - Next.js router
 * @param {Function} toast - Toast notification function
 * @returns {boolean} - Returns true if error was handled
 */
export const handleApiError = (error, router, toast) => {
  // TENANT_REQUIRED - redirect to tenant setup
  if (isTenantRequiredError(error)) {
    toast.error('Please complete your business setup');
    router.push('/tenant-setup');
    return true;
  }

  // Authentication error - redirect to login
  if (isAuthError(error)) {
    toast.error('Please log in to continue');
    // Clear any stored auth token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('luxeboard.authToken');
    }
    router.push('/login');
    return true;
  }

  // Permission error - show message
  if (isPermissionError(error)) {
    toast.error('You don\'t have permission to perform this action');
    return true;
  }

  // Generic error - show message
  toast.error(getErrorMessage(error));
  return false;
};

/**
 * Wrap an async API call with error handling
 * @param {Function} apiCall - Async function to call
 * @param {Object} options - { router, toast, onSuccess, onError }
 * @returns {Promise<any>}
 */
export const withErrorHandling = async (apiCall, options = {}) => {
  const { router, toast, onSuccess, onError } = options;

  try {
    const result = await apiCall();
    if (onSuccess) {
      onSuccess(result);
    }
    return result;
  } catch (error) {
    console.error('API Error:', error);

    if (router && toast) {
      handleApiError(error, router, toast);
    }

    if (onError) {
      onError(error);
    }

    throw error;
  }
};
