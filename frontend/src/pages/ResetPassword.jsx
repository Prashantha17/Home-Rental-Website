// src/pages/ResetPassword.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState(initialEmail ? 2 : 1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(cleanEmail.toLowerCase());
      setStep(2);
      startTimer();
      toast.success(`6-digit OTP sent to ${cleanEmail}! Check your inbox.`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Box inputs
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), otpCode, newPassword);
      setSuccess(true);
      toast.success("Password updated successfully! Redirecting to login…");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.message || "Invalid OTP or reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setOtp(["", "", "", "", "", ""]);
      setError("");
      startTimer();
      toast.success("New 6-digit OTP sent to your email!");
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] flex flex-col pt-24 pb-12">
      <main className="flex-grow flex items-center justify-center px-4 md:px-8 w-full max-w-[1280px] mx-auto">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0px_4px_25px_rgba(26,54,93,0.08)] overflow-hidden flex flex-col md:flex-row border border-[#c4c6cf]/40">

          {/* Left Side: Visual Panel */}
          <div className="hidden md:block w-1/2 relative bg-[#d8e3fa] min-h-[520px]">
            <img
              src="https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=800"
              alt="Luxury Living"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#002045]/30 backdrop-brightness-95" />
            <div className="absolute bottom-10 left-10 right-10 text-white p-6 bg-[#002045]/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fe6c6b] block mb-1">
                🔐 OTP Password Reset
              </span>
              <h2 className="font-headline text-2xl font-bold mb-2">Namma Mane 🏠</h2>
              <p className="text-sm text-gray-200 leading-relaxed">
                Enter your 6-digit email verification code to securely create a new password.
              </p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="mb-6 text-center md:text-left">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#002045] text-white flex items-center justify-center text-base font-bold">
                  🏠
                </span>
                <span className="font-headline text-xl font-bold text-[#002045]">
                  Namma <span className="text-[#ad3035]">Mane</span>
                </span>
              </Link>
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#111c2c] mb-1.5">
                Reset Password
              </h1>
              <p className="text-sm text-[#43474e]">
                {step === 1 ? "Enter your email to receive a 6-digit OTP code." : `Enter the 6-digit OTP sent to ${email}`}
              </p>
            </div>

            {/* Success State */}
            {success ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-[#111c2c]">Password Updated!</h2>
                <p className="text-sm text-[#43474e]">Redirecting you to the login page…</p>
                <div className="w-6 h-6 border-2 border-[#002045] border-t-transparent rounded-full animate-spin mt-2" />
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-semibold rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                  </div>
                )}

                {/* Step 1: Send OTP */}
                {step === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                        Registered Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">mail</span>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          placeholder="yourname@gmail.com"
                          className="w-full pl-11 pr-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm text-[#111c2c] focus:outline-none focus:border-[#002045]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? "Sending OTP…" : "Send 6-Digit Reset OTP"}
                    </button>
                  </form>
                )}

                {/* Step 2: Enter OTP & New Password */}
                {step === 2 && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#43474e]">
                      <span>Email: <strong>{email}</strong></span>
                      <button
                        type="button"
                        onClick={() => { setStep(1); setError(""); }}
                        className="text-[#ad3035] hover:underline font-semibold"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-2 text-center">
                        6-Digit Verification Code
                      </label>
                      <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
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
                            className={`w-10 h-13 text-center text-xl font-bold rounded-xl border-2 bg-[#f9f9ff] text-[#002045] focus:outline-none transition-all
                              ${digit ? "border-[#002045]" : "border-[#c4c6cf]/60 focus:border-[#002045]"}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">lock</span>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                          placeholder="Min 6 characters"
                          className="w-full pl-11 pr-11 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f]"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showNewPassword ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">lock_reset</span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                          placeholder="Re-enter password"
                          className="w-full pl-11 pr-11 py-2.5 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f]"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showConfirmPassword ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? "Updating Password…" : "Update Password"}
                    </button>

                    <div className="text-center text-xs text-[#74777f] pt-1">
                      Didn't receive code?{" "}
                      {resendTimer > 0 ? (
                        <span className="font-semibold text-[#002045]">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="font-bold text-[#ad3035] hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <Link to="/login" className="text-xs font-semibold text-[#ad3035] hover:underline">
                    ← Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
