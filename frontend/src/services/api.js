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
  logout: () => API.post("/logout"),
};

export const bookingService = {
  getAll: () => API.get("/bookings"),
  getAllBookings: () => API.get("/bookings/all"),
  getById: (id) => API.get(`/bookings/${id}`),
  create: (data) => API.post("/bookings", data),
  add: (data) => API.post("/bookings/add", data),
  update: (id, data) => API.put(`/bookings/${id}`, data),
  updatePaymentStatus: (id, data) => API.put(`/bookings/update-payment/${id}`, data),
  delete: (id) => API.delete(`/bookings/${id}`),
  deleteLock: (id) => API.delete(`/bookings/delete/${id}`),
  checkAvailability: (data) => API.post("/bookings/check-availability", data),
  autoConfirmPayment: (data) => API.post("/bookings/auto-confirm-payment", data),
  getUserBookings: (id) => API.get(`/bookings/user/${id}`),
  extendBooking: (data) => API.post("/bookings/extend-booking", data),
  payOvertime: (data) => API.post("/bookings/pay-overtime", data),
  updateBookingStatus: (id, data) => API.put(`/bookings/update-status/${id}`, data),
  getAdminBookings: () => API.get("/bookings/admin/bookings"),
  getBookingsByLocation: (id) => API.get(`/bookings/by-location/${id}`),
};

export const locationService = {
  getAll: () => API.get("/location"),
  getById: (id) => API.get(`/location/${id}`),
  create: (data) => API.post("/location", data),
  update: (id, data) => API.put(`/location/${id}`, data),
  delete: (id) => API.delete(`/location/${id}`),
  getCities: () => API.get("/location/cities"),
  getAreasByCity: (city) => API.get(`/location/areas/${city}`),
  addLocation: (data) => API.post("/location/add", data),
  updateLocation: (id, data) => API.put(`/location/update/${id}`, data),
  deleteLocation: (id) => API.delete(`/location/delete/${id}`),
  getLocations: () => API.get("/location/get"),
};

export const dashboardService = {
  getStats: () => API.get("/bookings/stats"),
};

export const paymentService = {
  confirmPayment: (data) => API.post("/payments/parking/payment", data),
  createPayPalOrder: (data) => API.post("/payments/create-paypal-order", data),
  capturePayPalOrder: (data) => API.post("/payments/capture-paypal-order", data),
};

export const feedbackService = {
  submit: (data) => API.post("/feedback", data),
  getAll: () => API.get("/feedback"),
  delete: (id) => API.delete(`/feedback/${id}`),
  addFeedback: (data) => API.post("/feedback/add", data),
  getAllFeedback: () => API.get("/feedback/all"),
};

export const contactService = {
  submit: (data) => API.post("/contact", data),
  getAll: () => API.get("/contact"),
  delete: (id) => API.delete(`/contact/${id}`),
  addContact: (data) => API.post("/contact/add", data),
  getAllContact: () => API.get("/contact/all"),
  reply: (data) => API.post("/contact/reply", data),
};

export const userService = {
  getAll: () => API.get("/admin/users"),
  delete: (id) => API.delete(`/admin/users/${id}`),
  updateStatus: (id, data) => API.put(`/admin/users/${id}/status`, data),
  getAllUsers: () => API.get("/users/all"),
  deleteUser: (id) => API.delete(`/users/delete/${id}`),
};

export const slotService = {
  getAll: () => API.get("/admin/slots"),
  create: (data) => API.post("/admin/slots", data),
  update: (id, data) => API.put(`/admin/slots/${id}`, data),
  delete: (id) => API.delete(`/admin/slots/${id}`),
};

export const paymentManagementService = {
  getAll: () => API.get("/admin/payments"),
};

export const reportService = {
  getReports: () => API.get("/admin/reports"),
};

export default API;
