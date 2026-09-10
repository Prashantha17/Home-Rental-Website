// src/pages/Register.jsx
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";
import { signInWithGoogle } from "../firebase";
import { validatePassword } from "../utils/passwordValidator";
import PasswordRequirements from "../components/PasswordRequirements";

// ── Step indicators ──────────────────────────────────────────────────
const steps = ["Details", "Verify Email"];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  // Step 1 — form data
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    aadhaar: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // Step 2 — OTP verification
  const [step, setStep]           = useState(1);          // 1 = details, 2 = OTP
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError]   = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const resendRef = useRef(null);

  // Google loading
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = "Full name or username is required.";
    if (!form.email.trim() || !form.email.includes("@"))
      errs.email = "Valid email address is required.";
    
    // Enforce strict password criteria: 8-12 chars, 1 uppercase, 1 number, 1 special char
    const pwdCheck = validatePassword(form.password);
    if (!pwdCheck.isValid) {
      errs.password = pwdCheck.message;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    if (resendRef.current) clearInterval(resendRef.current);
    resendRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(resendRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Step 1: Register + send OTP ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    try {
      await authApi.register(form);
      await authApi.sendEmailOtp(form.email.trim(), form.username.trim());
      toast.success(`OTP sent to ${form.email}! Please check your email inbox.`);
      setStep(2);
      startResendTimer();


    } catch (err) {
      setErrors({ server: err.message });
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP input helpers ──────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpLoading(true);
    setOtpError("");
    try {
      await authApi.verifyEmailOtp(form.email.trim(), code, form.username.trim());
      toast.success("Email verified! Signing you in…");
      // Auto login
      try {
        const loginData = await authApi.login(form.email.trim(), form.password);
        login(loginData.access_token, loginData.username, loginData.role);
        if (loginData.role === "owner") navigate("/owner-dashboard", { replace: true });
        else navigate("/", { replace: true });
      } catch {
        navigate("/login");
      }
    } catch (err) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authApi.sendEmailOtp(form.email.trim(), form.username.trim());
      toast.success("New OTP sent to your email inbox! Please check your inbox.");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      startResendTimer();
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP.");
    }
  };



  // ── Google Sign-Up ────────────────────────────────────────────────
  const handleGoogleSignUp = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setErrors({});
    try {
      const { idToken } = await signInWithGoogle();
      const data = await authApi.googleLogin(idToken, form.role);
      login(data.access_token, data.username, data.role);
      toast.success(`Welcome to RentYourHome, ${data.username}!`);
      if (data.role === "owner") navigate("/owner-dashboard", { replace: true });
      else if (data.role === "admin") navigate("/admin-dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setGoogleLoading(false); return;
      }
      const msg = err.message || "Google sign-up failed. Please try again.";
      setErrors({ server: msg });
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] flex flex-col pt-24 pb-12">
      <main className="flex-grow flex items-center justify-center px-4 md:px-8 w-full max-w-[1280px] mx-auto">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0px_4px_25px_rgba(26,54,93,0.08)] overflow-hidden flex flex-col md:flex-row border border-[#c4c6cf]/40">

          {/* ── Left: Form ── */}
          <section className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">

            {/* Logo */}
            <div className="mb-6">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#002045] text-white flex items-center justify-center text-base font-bold">🏠</span>
                <span className="font-headline text-xl font-bold text-[#002045]">
                  Namma <span className="text-[#ad3035]">Mane</span>
                </span>
              </Link>
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#002045] mb-1.5">
                {step === 1 ? "Join Namma Mane 🏠" : "Verify Your Email"}
              </h1>
              <p className="text-sm text-[#43474e]">
                {step === 1
                  ? "Find your home which matches your vibe."
                  : `We sent a 6-digit code to ${form.email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > i + 1 ? "bg-green-500 text-white" :
                      step === i + 1 ? "bg-[#002045] text-white" :
                      "bg-[#e2e8f0] text-[#74777f]"
                    }`}>
                      {step > i + 1
                        ? <span className="material-symbols-outlined text-xs">check</span>
                        : i + 1}
                    </div>
                    <span className={`text-xs font-semibold ${step === i + 1 ? "text-[#002045]" : "text-[#74777f]"}`}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px ${step > i + 1 ? "bg-green-400" : "bg-[#e2e8f0]"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ══════════════ STEP 1: Registration Form ══════════════ */}
            {step === 1 && (
              <>
                {errors.server && (
                  <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-semibold rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.server}
                  </div>
                )}

                {/* Role selector */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-2">I want to</label>
                  <div className="grid grid-cols-2 gap-2.5 p-1 bg-[#f9f9ff] rounded-xl border border-[#c4c6cf]/50">
                    <button type="button" onClick={() => setForm((p) => ({ ...p, role: "user" }))}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${form.role === "user" ? "bg-[#002045] text-white shadow-sm" : "text-[#43474e] hover:text-[#111c2c]"}`}>
                      🏡 Rent a Home (Tenant)
                    </button>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, role: "owner" }))}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${form.role === "owner" ? "bg-[#002045] text-white shadow-sm" : "text-[#43474e] hover:text-[#111c2c]"}`}>
                      🔑 List Properties (Owner)
                    </button>
                  </div>
                  <p className="text-[10px] text-[#74777f] mt-1.5 text-center">Applies to both Google and email sign-up</p>
                </div>

                {/* Google Sign-Up */}
                <button type="button" id="google-signup-btn" onClick={handleGoogleSignUp}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-[#c4c6cf]/60 rounded-xl bg-white hover:bg-[#f9f9ff] hover:border-[#002045]/30 transition-all font-semibold text-sm text-[#111c2c] shadow-sm hover:shadow-md disabled:opacity-60 cursor-pointer mb-5">
                  {googleLoading ? (
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
                  {googleLoading ? "Signing up…" : `Sign up as ${form.role === "owner" ? "Owner" : "Tenant"} with Google`}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[#c4c6cf]/40" />
                  <span className="text-xs text-[#74777f] font-medium">or register with email</span>
                  <div className="flex-1 h-px bg-[#c4c6cf]/40" />
                </div>

                {/* Registration form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">Full Name / Username</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">person</span>
                      <input id="username" name="username" type="text" value={form.username} onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-11 pr-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/10 transition-all placeholder-[#74777f]/50" />
                    </div>
                    {errors.username && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.username}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">mail</span>
                      <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                        placeholder="rahul@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/10 transition-all placeholder-[#74777f]/50" />
                    </div>
                    {errors.email && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                      Password (8–12 Characters)
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">lock</span>
                      <input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                        maxLength={12}
                        placeholder="8–12 chars, e.g. Home@2026"
                        className="w-full pl-11 pr-11 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/10 transition-all placeholder-[#74777f]/50" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#111c2c] transition-colors">
                        <span className="material-symbols-outlined text-lg">{showPassword ? "visibility" : "visibility_off"}</span>
                      </button>
                    </div>
                    <PasswordRequirements password={form.password} />
                    {errors.password && <p className="text-xs text-[#ba1a1a] mt-1.5 font-medium">{errors.password}</p>}
                  </div>

                  <button type="submit" id="register-submit-btn" disabled={loading}
                    className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-60">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Sending OTP…
                      </span>
                    ) : (
                      <>
                        Create Account &amp; Verify Email
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ══════════════ STEP 2: OTP Verification ══════════════ */}
            {step === 2 && (
              <div className="flex flex-col items-center">

                {/* Email sent icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#e8f0fe] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-4xl text-[#002045]">mark_email_unread</span>
                </div>

                <p className="text-sm text-[#43474e] text-center mb-6 max-w-xs">
                  Enter the <strong>6-digit code</strong> we emailed to{" "}
                  <span className="font-bold text-[#002045]">{form.email}</span>
                </p>

                {/* OTP boxes */}
                <form onSubmit={handleVerifyOtp} className="w-full">
                  <div className="flex justify-center gap-2.5 mb-4" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-[#f9f9ff] text-[#002045] focus:outline-none transition-all
                          ${otpError ? "border-[#ba1a1a] bg-[#fff5f5]" :
                            digit ? "border-[#002045]" : "border-[#c4c6cf]/60 focus:border-[#002045]"}`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-xs text-[#ba1a1a] text-center font-medium mb-3">{otpError}</p>
                  )}

                  <button type="submit" id="verify-otp-btn" disabled={otpLoading}
                    className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-4 cursor-pointer disabled:opacity-60">
                    {otpLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Verifying…
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Verify &amp; Complete Registration
                      </>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="text-center text-xs text-[#74777f]">
                  Didn't receive it?{" "}
                  {resendTimer > 0 ? (
                    <span className="font-semibold text-[#002045]">Resend in {resendTimer}s</span>
                  ) : (
                    <button onClick={handleResend} className="font-bold text-[#ad3035] hover:underline cursor-pointer">
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Back */}
                <button onClick={() => { setStep(1); setOtp(["","","","","",""]); setOtpError(""); }}
                  className="mt-5 text-xs text-[#74777f] hover:text-[#111c2c] flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Edit details
                </button>
              </div>
            )}

            {/* Bottom link */}
            {step === 1 && (
              <div className="mt-6 text-center border-t border-[#c4c6cf]/30 pt-4">
                <p className="text-xs text-[#43474e]">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-[#ad3035] hover:underline">Sign In</Link>
                </p>
              </div>
            )}
          </section>

          {/* ── Right: Image ── */}
          <aside className="hidden md:block md:w-1/2 relative bg-[#dee8ff] overflow-hidden min-h-[580px]">
            <img
              src="/aesthetic_village_home.jpg"
              alt="Aesthetic Village Home - Namma Mane"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002045]/85 via-[#002045]/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 text-white p-6 bg-[#002045]/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fe6c6b] block mb-1">
                🏡 Authentic Village Vibe
              </span>
              <h3 className="font-headline text-xl font-bold mb-1.5">Find Your Peaceful Sanctuary</h3>
              <p className="text-xs text-gray-200 leading-relaxed">
                Connect directly with verified owners for heritage homes, tranquil village retreats, and peaceful stays across India with zero brokerage.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Register;
