import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Loader from "./components/Loader";
import ScrollToTop from "./components/ScrollToTop";

// Lazy Load User Pages
const Home = lazy(() => import("./pages/user/Home"));
const About = lazy(() => import("./pages/user/About"));
const Contact = lazy(() => import("./pages/user/Contact"));
const Register = lazy(() => import("./pages/user/Register"));
const Login = lazy(() => import("./pages/user/Login"));
const ForgotPassword = lazy(() => import("./pages/user/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/user/ResetPassword"));
const Booking = lazy(() => import("./pages/user/Booking"));
const Profile = lazy(() => import("./pages/user/Profile"));
const Feedback = lazy(() => import("./pages/user/Feedback"));

// Lazy Load Admin Pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageLocation = lazy(() => import("./pages/admin/ManageLocation"));
const ManageSlots = lazy(() => import("./pages/admin/ManageSlots"));
const CreateSlots = lazy(() => import("./pages/admin/CreateSlots"));
const ManageBookings = lazy(() => import("./pages/admin/ManageBookings"));
const ManagePayments = lazy(() => import("./pages/admin/ManagePayments"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManageContact = lazy(() => import("./pages/admin/ManageContact"));
const ManageFeedback = lazy(() => import("./pages/admin/ManageFeedback"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Settings = lazy(() => import("./pages/admin/Placeholders").then(module => ({ default: module.Settings })));

function App() {
  return (
    <Suspense fallback={<Loader />}>
        <ScrollToTop />
        <Routes>
        {/* User Routes with UserLayout */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="booking" element={<Booking />} />
          <Route path="profile" element={<Profile />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>

        {/* Admin Routes with AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="location" element={<ManageLocation />} />
          <Route path="slots" element={<ManageSlots />} />
          <Route path="create-slots" element={<CreateSlots />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="payments" element={<ManagePayments />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="contact" element={<ManageContact />} />
          <Route path="feedback" element={<ManageFeedback />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
