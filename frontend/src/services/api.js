// src/services/api.js
/**
 * Unified API Client for RentYourHome
 * Centralizes all network communication, token injection, and response parsing.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Core fetch wrapper with auth header injection and standardized error throwing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("access_token");

  const headers = {
    ...options.headers,
  };

  // Add JSON Content-Type if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Inject Bearer token if present
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON or text
    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === "object" && (data.detail || data.message)) ||
        `Request failed with status ${response.status}`;

      // If token is invalid or expired, trigger logout event
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network connection error", 0, null);
  }
}

// ----------------------------------------------------------------------
// DOMAIN-SPECIFIC API CLIENTS
// ----------------------------------------------------------------------

export const authApi = {
  login: (identifier, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  register: (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || "user",
        phone: userData.phone || "9876543210",
        aadhaar: userData.aadhaar || "123456789012",
      }),
    }),

  sendOtp: (phone, email = "", username = "") =>
    request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone, email, username }),
    }),

  verifyOtp: (phone, code, username = "") =>
    request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code, username }),
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyResetOtp: (email, otp) =>
    request("/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (email, otp, new_password) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, new_password }),
    }),



  googleLogin: (id_token, role = "user") =>
    request("/auth/google-login", {
      method: "POST",
      body: JSON.stringify({ id_token, role }),
    }),

  sendEmailOtp: (email, username = "") =>
    request("/auth/send-email-otp", {
      method: "POST",
      body: JSON.stringify({ email, username }),
    }),

  verifyEmailOtp: (email, code, username = "") =>
    request("/auth/verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ email, code, username }),
    }),
};



export const propertyApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.city) query.append("city", params.city);
    if (params.area) query.append("area", params.area);
    if (params.state) query.append("state", params.state);
    if (params.district) query.append("district", params.district);
    if (params.taluk) query.append("taluk", params.taluk);
    if (params.pincode) query.append("pincode", params.pincode);
    if (params.maxRent) query.append("maxRent", params.maxRent);
    if (params.owner_id) query.append("owner_id", params.owner_id);

    const queryString = query.toString();
    return request(`/properties${queryString ? `?${queryString}` : ""}`);
  },

  getProperties: (params = {}) => {
    const query = new URLSearchParams();
    if (params.city) query.append("city", params.city);
    if (params.area) query.append("area", params.area);
    if (params.state) query.append("state", params.state);
    if (params.district) query.append("district", params.district);
    if (params.taluk) query.append("taluk", params.taluk);
    if (params.pincode) query.append("pincode", params.pincode);
    if (params.maxRent) query.append("maxRent", params.maxRent);
    if (params.owner_id) query.append("owner_id", params.owner_id);

    const queryString = query.toString();
    return request(`/properties${queryString ? `?${queryString}` : ""}`);
  },

  create: (propertyData) =>
    request("/properties/create", {
      method: "POST",
      body: JSON.stringify(propertyData),
    }),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/properties/upload-image", {
      method: "POST",
      body: formData,
    });
  },

  predictRent: (calculatorData) =>
    request("/properties/predict-rent", {
      method: "POST",
      body: JSON.stringify(calculatorData),
    }),

  vibeSearch: (searchQuery) =>
    request("/properties/vibe-search", {
      method: "POST",
      body: JSON.stringify({ query: searchQuery }),
    }),

  approve: (propertyId) =>
    request(`/properties/approve/${propertyId}`, {
      method: "POST",
    }),

  reject: (propertyId) =>
    request(`/properties/reject/${propertyId}`, {
      method: "POST",
    }),
};

export const requestApi = {
  create: (propertyId, offeredRent = null, message = "") =>
    request("/requests/create", {
      method: "POST",
      body: JSON.stringify({
        property_id: propertyId,
        offered_rent: offeredRent ? parseFloat(offeredRent) : null,
        message: message || "",
      }),
    }),

  getOwnerRequests: () => request("/requests/owner"),

  getTenantRequests: () => request("/requests/tenant"),

  accept: (requestId) =>
    request(`/requests/accept/${requestId}`, {
      method: "POST",
    }),

  reject: (requestId) =>
    request(`/requests/reject/${requestId}`, {
      method: "POST",
    }),

  payDeposit: (requestId, paymentData) =>
    request(`/payments/pay/${requestId}`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  createRazorpayOrder: (requestId, amount) =>
    request("/payments/razorpay/create-order", {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, amount: parseFloat(amount) }),
    }),

  verifyRazorpayPayment: (paymentData) =>
    request("/payments/razorpay/verify-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),
};

export const paymentApi = {
  payDeposit: (requestId, paymentData) => requestApi.payDeposit(requestId, paymentData),
  createRazorpayOrder: (requestId, amount) => requestApi.createRazorpayOrder(requestId, amount),
  verifyRazorpayPayment: (paymentData) => requestApi.verifyRazorpayPayment(paymentData),
};


export const chatApi = {
  getInbox: () => request("/messages/inbox"),

  getChatHistory: (username) => request(`/messages/chat/${username}`),

  sendMessage: (receiver, text) =>
    request("/messages/send", {
      method: "POST",
      body: JSON.stringify({ receiver, text }),
    }),
};

export const adminApi = {
  getStats: () => request("/admin/stats"),

  getUsers: () => request("/admin/users"),

  toggleUserStatus: (userId) =>
    request(`/admin/toggle-user-status/${userId}`, {
      method: "POST",
    }),
};

export const reviewApi = {
  getReviews: (propertyId) => request(`/properties/${propertyId}/reviews`),

  submitReview: (propertyId, rating, comment) =>
    request(`/properties/${propertyId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),
};

export const agreementApi = {
  create: (agreementData) =>
    request("/agreements/create", {
      method: "POST",
      body: JSON.stringify(agreementData),
    }),

  getById: (agreementId) => request(`/agreements/${agreementId}`),

  getUserAgreements: () => request("/agreements/user/all"),

  sign: (agreementId, signatureData, signeeType) =>
    request(`/agreements/sign/${agreementId}`, {
      method: "POST",
      body: JSON.stringify({
        signature_data: signatureData,
        signee_type: signeeType,
      }),
    }),
};

export const receiptApi = {
  generate: (receiptParams) =>
    request("/receipts/generate", {
      method: "POST",
      body: JSON.stringify(receiptParams),
    }),

  getUserReceipts: () => request("/receipts/user/all"),
};

