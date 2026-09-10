// src/pages/ForgotPassword.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";
import { validatePassword } from "../utils/passwordValidator";
import PasswordRequirements from "../components/PasswordRequirements";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Step 1 = Enter Email
  // Step 2 = Enter & Verify OTP
  // Step 3 = Change Password
  // Step 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // -----------------------------------------------------------------------
  // Step 1: Send OTP to Email
  // -----------------------------------------------------------------------
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address format.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(cleanEmail);
      toast.success(`6-digit OTP sent to ${cleanEmail}! Please check your inbox.`);
      setStep(2);
      startResendTimer();


      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(err.message || "Failed to send reset OTP. Please check your email.");
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Step 2: OTP Input Navigation
  // -----------------------------------------------------------------------
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
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

  // -----------------------------------------------------------------------
  // Step 2: Verify OTP First
  // -----------------------------------------------------------------------
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authApi.verifyResetOtp(email.trim().toLowerCase(), otpCode);
      setVerifiedOtpCode(otpCode);
      toast.success("OTP verified successfully! Now create your new password.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid OTP code. Please check your email or resend.");
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Step 3: Change Password
  // -----------------------------------------------------------------------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.isValid) {
      setError(pwdCheck.message);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), verifiedOtpCode, newPassword);
      setStep(4);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
      toast.error(err.message || "Password update failed.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Resend OTP
  // -----------------------------------------------------------------------
  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
      toast.success("New 6-digit OTP sent to your email!");
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
      toast.error(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] flex flex-col pt-24 pb-12">
      <main className="flex-grow flex items-center justify-center px-4 md:px-8 w-full max-w-[1280px] mx-auto">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0px_4px_25px_rgba(26,54,93,0.08)] overflow-hidden flex flex-col md:flex-row border border-[#c4c6cf]/40">

          {/* Left Column: Visual Panel */}
          <div className="hidden md:block w-1/2 relative bg-[#d8e3fa] min-h-[580px]">
            <img
              src="https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&dpr=2&w=800"
              alt="Luxury Living"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#002045]/40 backdrop-brightness-95" />

            <div className="absolute bottom-10 left-10 right-10 text-white p-6 bg-[#002045]/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fe6c6b] block mb-1">
                🔐 3-Step Verification
              </span>
              <h2 className="font-headline text-2xl font-bold mb-2">Namma Mane 🏠</h2>
              <p className="text-sm text-gray-200 leading-relaxed">
                Step 1: Enter Email &bull; Step 2: Verify 6-digit OTP &bull; Step 3: Set Your New Password.
              </p>
            </div>
          </div>

          {/* Right Column: Step by Step Flow */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">

            {/* Brand Header */}
            <div className="mb-5">
              <Link to="/" className="inline-flex items-center gap-2 mb-3">
                <span className="w-9 h-9 rounded-xl bg-[#002045] text-white flex items-center justify-center text-base font-bold">
                  🏠
                </span>
                <span className="font-headline text-xl font-bold text-[#002045]">
                  Namma <span className="text-[#ad3035]">Mane</span>
                </span>
              </Link>
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#002045] mb-1">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify 6-Digit OTP"}
                {step === 3 && "Create New Password"}
                {step === 4 && "Password Updated!"}
              </h1>
              <p className="text-sm text-[#43474e]">
                {step === 1 && "Enter your registered email to receive your one-time verification code."}
                {step === 2 && `Enter the 6-digit OTP code sent to ${email}`}
                {step === 3 && "OTP verified! Now create and confirm your new password."}
                {step === 4 && "Your account password has been securely updated."}
              </p>
            </div>

            {/* Step Progress Indicators */}
            {step <= 3 && (
              <div className="flex items-center gap-2 mb-6">
                {[
                  { num: 1, label: "Email" },
                  { num: 2, label: "Verify OTP" },
                  { num: 3, label: "New Password" },
                ].map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step > s.num
                            ? "bg-green-600 text-white"
                            : step === s.num
                            ? "bg-[#002045] text-white ring-2 ring-[#002045]/20"
                            : "bg-[#e2e8f0] text-[#74777f]"
                        }`}
                      >
                        {step > s.num ? (
                          <span className="material-symbols-outlined text-xs font-bold">check</span>
                        ) : (
                          s.num
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          step === s.num ? "text-[#002045]" : "text-[#74777f]"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          step > s.num ? "bg-green-500" : "bg-[#e2e8f0]"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-semibold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* STEP 1: Enter Email & Send OTP                             */}
            {/* ════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      mail
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-11 pr-4 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm text-[#111c2c] focus:outline-none focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/10 transition-all placeholder-[#74777f]/50"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Sending OTP to Inbox…
                    </span>
                  ) : (
                    <>
                      Send 6-Digit Verification OTP
                      <span className="material-symbols-outlined text-sm">send</span>
                    </>
                  )}
                </button>

                <div className="mt-6 pt-4 border-t border-[#c4c6cf]/30 text-center">
                  <Link to="/login" className="text-xs font-semibold text-[#ad3035] hover:underline flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* STEP 2: Enter & Verify 6-Digit OTP First                   */}
            {/* ════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Email Chip */}
                <div className="flex items-center justify-between p-3 bg-[#f0f4ff] border border-[#002045]/15 rounded-xl text-xs text-[#002045]">
                  <span className="truncate">Code sent to: <strong>{email}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="text-[#ad3035] hover:underline font-bold ml-2 shrink-0 cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                {/* 6 OTP Digit Boxes */}
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
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
                        className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-[#f9f9ff] text-[#002045] focus:outline-none transition-all
                          ${digit ? "border-[#002045]" : "border-[#c4c6cf]/60 focus:border-[#002045]"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify OTP Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Verifying OTP…
                    </span>
                  ) : (
                    <>
                      Verify OTP
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                    </>
                  )}
                </button>

                {/* Resend & Back */}
                <div className="flex items-center justify-between pt-2 text-xs text-[#74777f]">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-semibold text-[#002045]">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="font-bold text-[#ad3035] hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="text-center pt-3 border-t border-[#c4c6cf]/30">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="text-xs text-[#74777f] hover:text-[#111c2c] flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Edit Email Address
                  </button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* STEP 3: Change Password (Only after OTP is Verified)       */}
            {/* ════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Verified Email Banner */}
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                  <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                  <div className="truncate">
                    <span>OTP Verified for <strong>{email}</strong></span>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    New Password (8–12 Characters)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      lock
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      maxLength={12}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      placeholder="8–12 chars, e.g. Home@2026"
                      className="w-full pl-11 pr-11 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#111c2c]"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showNewPassword ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                  <PasswordRequirements password={newPassword} />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#111c2c] uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      lock_reset
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Re-enter new password"
                      className="w-full pl-11 pr-11 py-3 bg-[#f9f9ff] border border-[#c4c6cf]/60 rounded-xl text-sm focus:outline-none focus:border-[#002045]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#111c2c]"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showConfirmPassword ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ad3035] hover:bg-[#8e2428] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving New Password…
                    </span>
                  ) : (
                    <>
                      Save &amp; Update Password
                      <span className="material-symbols-outlined text-sm">lock_reset</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-xs font-semibold text-[#ad3035] hover:underline">
                    Cancel &amp; Return to Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* STEP 4: Success State                                      */}
            {/* ════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-[#002045]">Password Updated Successfully!</h2>
                <p className="text-sm text-[#43474e] max-w-xs">
                  Your new password is now active. You can sign in to your RentYourHome account with your new credentials.
                </p>
                <div className="w-6 h-6 border-2 border-[#002045] border-t-transparent rounded-full animate-spin mt-1" />
                <Link
                  to="/login"
                  className="mt-4 inline-flex items-center justify-center gap-2 bg-[#002045] hover:bg-[#1a365d] text-white text-xs font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
                >
                  Sign In Now
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
