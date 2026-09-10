// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";
import { signInWithGoogle } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ identifier: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Google Login State ---
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  const redirectAfterLogin = (role, username) => {
    toast.success(`Welcome back, ${username}!`);
    if (role === "admin") navigate("/admin-dashboard", { replace: true });
    else if (role === "owner") navigate("/owner-dashboard", { replace: true });
    else navigate(from === "/login" ? "/" : from, { replace: true });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.identifier.trim())
      newErrors.identifier = "Email or username is required.";
    if (!form.password)
      newErrors.password = "Password is required.";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // -----------------------------------------------------------------------
  // Standard Login
  // -----------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await authApi.login(form.identifier.trim(), form.password);
      login(data.access_token, data.username, data.role);
      redirectAfterLogin(data.role, data.username);
    } catch (err) {
      setErrors({ server: err.message });
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Google Login
  // -----------------------------------------------------------------------
  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setErrors({});
    try {
      const { idToken } = await signInWithGoogle();
      const data = await authApi.googleLogin(idToken, "user");
      login(data.access_token, data.username, data.role);
      redirectAfterLogin(data.role, data.username);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setIsGoogleLoading(false);
        return;
      }
      const msg = err.message || "Google sign-in failed. Please try again.";
      setErrors({ server: msg });
      toast.error(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] flex flex-col pt-24 pb-12">
      <main className="flex-grow flex items-center justify-center px-4 md:px-8 w-full max-w-[1280px] mx-auto">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0px_4px_25px_rgba(26,54,93,0.08)] overflow-hidden flex flex-col md:flex-row border border-[#c4c6cf]/40">

          {/* Left Side: Luxury Architectural Canvas */}
          <div className="hidden md:block w-1/2 relative bg-[#d8e3fa] min-h-[580px]">
            <img
              src="https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=800"
              alt="Luxury Living"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#002045]/30 backdrop-brightness-95"></div>

            {/* Overlay Content */}
            <div className="absolute bottom-10 left-10 right-10 text-white p-6 bg-[#002045]/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fe6c6b] block mb-1">
                🇮🇳 India's Direct Rental Network
              </span>
              <h2 className="font-headline text-2xl font-bold mb-2">Namma Mane 🏠</h2>
              <p className="text-sm text-gray-200 leading-relaxed">
                Find your home which matches your vibe. Connect directly with verified property owners with 100% Zero Brokerage.
              </p>
            </div>
          </div>

          {/* Right Side: Login Form Canvas */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="mb-8 text-center md:text-left">
              <Link to="/" className="inline-flex items-center gap-2 mb-6">
                <span className="w-9 h-9 rounded-xl bg-[#002045] text-white flex items-center justify-center text-base font-bold">
                  🏠
                </span>
                <span className="font-headline text-xl font-bold text-[#002045]">
                  Namma <span className="text-[#ad3035]">Mane</span>
                </span>
              </Link>
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#111c2c] mb-2">
                Welcome Back
              </h1>
              <p className="text-sm text-[#43474e]">
                Sign in to manage your shortlisted properties, owner chats, or listings.
              </p>
            </div>

            {/* Server Error Banner */}
            {errors.server && (
              <div className="mb-5 p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-semibold rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.server}
              </div>
            )}

            {/* ── Google Sign-In Button ── */}
            <button
              type="button"
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-[#c4c6cf]/60 rounded-xl bg-white hover:bg-[#f9f9ff] hover:border-[#002045]/30 transition-all font-semibold text-sm text-[#111c2c] shadow-sm hover:shadow-md disabled:opacity-60 cursor-pointer mb-5"
            >
              {isGoogleLoading ? (
                <span className="w-4 h-4 border-2 border-[#002045] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 48 48" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              )}
              {isGoogleLoading ? "Signing in with Google…" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#c4c6cf]/40" />
              <span className="text-xs text-[#74777f] font-medium">or sign in with email</span>
              <div className="flex-1 h-px bg-[#c4c6cf]/40" />
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">mail</span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    value={form.identifier}
                    onChange={handleChange}
                    placeholder="name@example.com or username"
                    className="w-full pl-11 pr-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm text-[#111c2c] focus:outline-none focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/10 transition-all placeholder-[#74777f]/50"
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.identifier}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider">
                    Password
                  </label>
                  {/* Direct Link to Dedicated Forgot Password Page */}
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#ad3035] hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">lock</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your account password"
                    className="w-full pl-11 pr-11 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm text-[#111c2c] focus:outline-none focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/10 transition-all placeholder-[#74777f]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#111c2c] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-[#43474e] cursor-pointer">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-[#c4c6cf] text-[#002045] focus:ring-[#002045]"
                  />
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isSubmitting}
                className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In to Account
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-[#43474e]">
                New to RentYourHome?{" "}
                <Link to="/register" className="font-bold text-[#ad3035] hover:underline">
                  Create Free Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
