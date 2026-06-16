import axios from "axios";

// Create an axios instance with base URL and common settings
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in all requests
API.interceptors.request.use(
  (config) => {
    // Determine which token to use based on the request URL
    let token;
    if (config.url.includes("/admin") || config.url.includes("/location") || config.url.includes("/slots")) {
      token = sessionStorage.getItem("admin_token") || sessionStorage.getItem("token");
    } else {
      token = sessionStorage.getItem("user_token") || sessionStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      console.error("Unauthorized! Redirecting to login...");
      // sessionStorage.clear();
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API endpoints defined as functions for clean usage in components
export const authService = {
  login: (data) => API.post("/login", data),
  register: (data) => API.post("/register", data),
  updateProfile: (id, data) => API.put(`/users/update/${id}`, data),
  checkEmail: (email) => API.post("/check-email", { email }),
  verifyOTP: (email, otp) => API.post("/verify-otp", { email, otp }),
  resetPasswordDirect: (email, newPassword) => API.post("/reset-password-direct", { email, newPassword }),
};

export const bookingService = {
  getAll: () => API.get("/bookings"),
  getById: (id) => API.get(`/bookings/${id}`),
  create: (data) => API.post("/bookings", data),
  update: (id, data) => API.put(`/bookings/${id}`, data),
  delete: (id) => API.delete(`/bookings/${id}`),
};

export const locationService = {
  getAll: () => API.get("/location"),
  getById: (id) => API.get(`/location/${id}`),
  create: (data) => API.post("/location", data),
  update: (id, data) => API.put(`/location/${id}`, data),
  delete: (id) => API.delete(`/location/${id}`),
};

export const dashboardService = {
  getStats: () => API.get("/bookings/stats"),
};

export const paymentService = {
  confirmPayment: (data) => API.post("/payments/parking/payment", data),
  createPayPalOrder: (data) => API.post("/payments/create-paypal-order", data),
  capturePayPalOrder: (data) => API.post("/payments/capture-paypal-order", data),
};

export default API;
