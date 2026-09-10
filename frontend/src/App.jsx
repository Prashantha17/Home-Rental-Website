import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ChatWidget from "./components/ChatWidget";
import ImageSecurityGuard from "./components/ImageSecurityGuard";

// Code-split secondary pages for instant initial homepage load & scalability
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RentalAgreement = lazy(() => import("./pages/RentalAgreement"));
const HraReceipts = lazy(() => import("./pages/HraReceipts"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// High-performance minimal loader for page transitions
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-9 h-9 border-3 border-[#002045]/20 border-t-[#002045] rounded-full animate-spin"></div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex flex-col min-h-screen bg-[#f9f9ff]">
          {/* Top navigation bar */}
          <Navbar />

          {/* Main page content with Suspense streaming */}
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ForgotPassword />} />

                {/* Tenant Requests & Approvals Dashboard (Protected) */}
                <Route
                  path="/tenant-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                      <TenantDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* PropTech Legal & Tax Tools (Protected) */}
                <Route
                  path="/rental-agreement"
                  element={
                    <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                      <RentalAgreement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hra-receipts"
                  element={
                    <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                      <HraReceipts />
                    </ProtectedRoute>
                  }
                />

                {/* Owner Protected Dashboards */}
                <Route
                  path="/owner-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["owner", "admin"]}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/add-property"
                  element={
                    <ProtectedRoute allowedRoles={["owner", "admin"]}>
                      <AddProperty />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Dashboard */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>

          {/* Modern Coastal Minimalist Footer */}
          <Footer />

          {/* Persistent Direct Messaging Chat Console */}
          <ChatWidget />

          {/* Anti-Download & Security Protection Guard */}
          <ImageSecurityGuard />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
