/**
 * LoginPage Component
 * 
 * What is it?
 * The user authentication and account recovery page component for MindCompass AI.
 * 
 * What does it do?
 * 1. Checks session authentication; auto-redirects logged-in users directly to `/app`.
 * 2. Supports standard email/password authentication with optional "Remember Me" local storage persistence.
 * 3. Integrates Google OAuth 2.0 social login via `@react-oauth/google` (`useGoogleLogin`).
 * 4. Provides a full 3-step OTP-based Password Recovery workflow:
 *    - Step 1: Submits account email to dispatch a 6-digit verification OTP code.
 *    - Step 2: Renders a 6-digit OTP input form with auto-focus movement, clipboard paste support, and a 60-second resend countdown timer.
 *    - Step 3: Sets a new account password and updates credentials on the backend.
 * 5. Animated view switches between Login and Recovery modes using Framer Motion.
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import {
  FiMail,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { PageTransition } from "../components/PageTransition";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";
import { authAPI } from "../services/api";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, googleLogin, token } = useApp();

  // Effect: Auto-redirect authenticated users directly to dashboard if token exists
  useEffect(() => {
    if (token) {
      navigate("/app", { replace: true });
    }
  }, [token, navigate]);

  // Mode state: 'login' for standard authentication, 'forgot' for password recovery
  const [mode, setMode] = useState("login");

  // Login form field states (hydrates remembered_email if previously saved)
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('remembered_email') || '';
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('remembered_email');
  });
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password form email state
  const [forgotEmail, setForgotEmail] = useState("");

  // Error and feedback alert states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Loading state indicators for standard and Google authentication dispatches
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Input validation helpers
  const validateEmail = (val) => {
    if (!val) {
      setEmailError("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (val) => {
    if (!val) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateForgotEmail = (val) => {
    if (!val) {
      setForgotEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setForgotEmailError("Please enter a valid email address");
      return false;
    }
    setForgotEmailError("");
    return true;
  };

  // Handles email & password login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const cleanEmail = email.trim();
    setEmail(cleanEmail);

    const isEmailValid = validateEmail(cleanEmail);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      try {
        if (rememberMe) {
          localStorage.setItem('remembered_email', cleanEmail);
        } else {
          localStorage.removeItem('remembered_email');
        }
        const res = await login(cleanEmail, password, rememberMe);
        setIsLoading(false);
        const todayStr = new Date().toISOString().split('T')[0];
        const hasCheckedInToday = Array.isArray(res.dashboardData?.checkins)
          ? res.dashboardData.checkins.some((c) => c.date === todayStr)
          : false;
        sessionStorage.setItem('has_checked_daily_checkin_redirect', 'true');
        if (!hasCheckedInToday) {
          navigate('/app/checkin', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } catch (err) {
        setIsLoading(false);
        if (err.response && err.response.data && err.response.data.errors) {
          const validationErrors = err.response.data.errors;

          if (validationErrors.email)
            setEmailError(validationErrors.email[0]);
          if (validationErrors.password)
            setPasswordError(validationErrors.password[0]);
          if (validationErrors.non_field_errors) {
            setFormError(validationErrors.non_field_errors[0]);
          } else {
            setFormError("Authentication failed. Please verify credentials.");
          }
        } else {
          setFormError(err.message || "A network connection issue occurred.");
        }
      }
    }
  };

  // 3-Step Password Recovery states (1: Send Email, 2: Enter 6-digit OTP, 3: Set New Password)
  const [forgotStep, setForgotStep] = useState(1);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Effect: 60-second resend countdown timer for OTP dispatch
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Dispatches forgot password OTP code request to backend
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (validateForgotEmail(forgotEmail)) {
      setIsLoading(true);
      try {
        const response = await authAPI.forgotPassword(forgotEmail);
        setIsLoading(false);
        if (response.data.success) {
          setSuccessMessage(response.data.message || "A 6-digit code has been dispatched.");
          setForgotStep(2);
          setResendTimer(60);
        } else {
          setFormError(response.data.message || "Request failed.");
        }
      } catch (err) {
        setIsLoading(false);
        if (err.response && err.response.data && err.response.data.errors) {
          const validationErrors = err.response.data.errors;
          if (validationErrors.email) setForgotEmailError(validationErrors.email[0]);
          if (validationErrors.non_field_errors) setFormError(validationErrors.non_field_errors[0]);
        } else {
          setFormError(err.message || "An error occurred while sending code.");
        }
      }
    }
  };

  // Step 2: Verifies entered 6-digit OTP code against backend
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    setOtpError("");
    setFormError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await authAPI.verifyResetOTP(forgotEmail, fullOtp);
      setIsLoading(false);
      if (response.data.success) {
        setSuccessMessage("OTP verified! Please create your new password.");
        setForgotStep(3);
      }
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        if (validationErrors.otp) setOtpError(validationErrors.otp[0]);
        if (validationErrors.non_field_errors) setFormError(validationErrors.non_field_errors[0]);
      } else {
        setFormError(err.message || "Invalid or expired verification code.");
      }
    }
  };

  // Step 3: Submits new password reset request
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setNewPasswordError("");

    if (!newPassword || newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setNewPasswordError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const fullOtp = otpDigits.join("");
    try {
      const response = await authAPI.resetPassword({
        email: forgotEmail,
        otp: fullOtp,
        password: newPassword,
        password_confirm: confirmNewPassword,
      });
      setIsLoading(false);
      if (response.data.success) {
        setSuccessMessage("Password reset successfully! Please sign in with your new password.");
        setTimeout(() => {
          setMode("login");
          setForgotStep(1);
          setOtpDigits(["", "", "", "", "", ""]);
          setNewPassword("");
          setConfirmNewPassword("");
          setSuccessMessage("Password reset successfully. You can now sign in!");
        }, 1500);
      }
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        if (validationErrors.password) setNewPasswordError(validationErrors.password[0]);
        if (validationErrors.password_confirm) setNewPasswordError(validationErrors.password_confirm[0]);
        if (validationErrors.non_field_errors) setFormError(validationErrors.non_field_errors[0]);
      } else {
        setFormError(err.message || "Failed to reset password.");
      }
    }
  };

  const handleGoogleError = () => {
    setIsGoogleLoading(false);
    setFormError("Google sign in was cancelled or failed.");
  };

  // Google OAuth 2.0 Login Handler
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setFormError("");
      setSuccessMessage("");
      try {
        const res = await googleLogin(tokenResponse.access_token, null, null, rememberMe);
        setIsGoogleLoading(false);
        const todayStr = new Date().toISOString().split('T')[0];
        const hasCheckedInToday = Array.isArray(res.dashboardData?.checkins)
          ? res.dashboardData.checkins.some((c) => c.date === todayStr)
          : false;
        sessionStorage.setItem('has_checked_daily_checkin_redirect', 'true');
        if (!hasCheckedInToday) {
          navigate('/app/checkin', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } catch (err) {
        setIsGoogleLoading(false);
        if (err.response && err.response.data && err.response.data.message) {
          setFormError(err.response.data.message);
        } else {
          setFormError("Google sign in failed. Please try again.");
        }
      }
    },
    onError: handleGoogleError,
  });

  return (
    <PageTransition>
      <div className="min-h-[85vh] flex flex-col justify-center items-center px-6 py-12 bg-bg-light/65 dark:bg-bg-dark/10 transition-colors duration-300">
        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-8 md:p-10 shadow-sm"
        >
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              /* --- MODE 1: STANDARD LOGIN FORM --- */
              <motion.div
                key="login-form-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                    Reconnect with your mindful compass.
                  </p>
                </div>

                {/* Google Social Login Button */}
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 border border-secondary/25 dark:border-secondary/10 bg-transparent hover:bg-secondary/5 dark:hover:bg-secondary/5 rounded-full py-3 text-sm font-semibold text-text-dark dark:text-text-light transition-colors duration-205 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <span className="text-secondary/70">Connecting...</span>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>

                {/* Section Divider */}
                <div className="relative my-8 text-center">
                  <hr className="border-secondary/15 dark:border-secondary/5" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-light dark:bg-card-dark px-3 text-xs uppercase tracking-wider text-text-dark/45 dark:text-text-light/50">
                    or
                  </span>
                </div>

                {/* General Form Error Alert */}
                {formError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Email & Password Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input Field */}
                  <div className="relative text-left">
                    <Input
                      label="Email Address"
                      id="email"
                      type="email"
                      autoComplete="username email"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      error={emailError}
                      required
                    />
                    <div className="absolute right-4 top-10.5 text-secondary/60">
                      <FiMail className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Password Input Field with Toggle Visibility */}
                  <div className="relative text-left">
                    <Input
                      label="Password"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      error={passwordError}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-10.5 text-secondary/60 hover:text-text-dark dark:hover:text-text-light focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Remember Me Checkbox & Forgot Password Link */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-text-dark/70 dark:text-text-light/75 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-secondary/35 text-primary focus:ring-primary/45 w-4 h-4 accent-primary dark:accent-secondary bg-transparent cursor-pointer"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setFormError("");
                        setSuccessMessage("");
                        setForgotEmailError("");
                        if (email) {
                          setForgotEmail(email.trim());
                        } else {
                          setForgotEmail("");
                        }
                      }}
                      className="font-semibold text-secondary hover:text-primary dark:hover:text-accent transition-colors bg-transparent border-none outline-none cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                {/* Redirect Link to Register Page */}
                <p className="text-center text-sm text-text-dark/70 dark:text-text-light/75 mt-8">
                  Don't have a account?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-secondary hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    Get Started
                  </Link>
                </p>
              </motion.div>
            ) : (
              /* --- MODE 2: PASSWORD RECOVERY (3-STEP OTP FLOW) --- */
              <motion.div
                key="forgot-password-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                    {forgotStep === 1 && "Recover Password"}
                    {forgotStep === 2 && "Enter Verification Code"}
                    {forgotStep === 3 && "Reset Password"}
                  </h2>
                  <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                    {forgotStep === 1 && "Enter your email to receive a 6-digit verification code."}
                    {forgotStep === 2 && `Enter the 6-digit OTP code sent to ${forgotEmail}`}
                    {forgotStep === 3 && "Create a new strong password for your account."}
                  </p>
                </div>

                {/* Feedback Alerts */}
                {formError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-6 p-4 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
                    <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* STEP 1: Email Submission Form for OTP Code */}
                {forgotStep === 1 && (
                  <form onSubmit={handleSendOTP} className="space-y-5">
                    <div className="relative text-left">
                      <Input
                        label="Email Address"
                        id="forgot-email"
                        type="email"
                        placeholder="jane@example.com"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotEmailError) validateForgotEmail(e.target.value);
                        }}
                        error={forgotEmailError}
                        required
                      />
                      <div className="absolute right-4 top-10.5 text-secondary/60">
                        <FiMail className="w-5 h-5" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-3 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending Code..." : "Send Verification Code"}
                    </Button>
                  </form>
                )}

                {/* STEP 2: 6-Digit OTP Verification Form */}
                {forgotStep === 2 && (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="flex justify-center items-center gap-2 my-4">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-digit-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            const newOtp = [...otpDigits];
                            newOtp[idx] = val;
                            setOtpDigits(newOtp);
                            setOtpError("");
                            if (val && idx < 5) {
                              const nextInput = document.getElementById(`otp-digit-${idx + 1}`);
                              if (nextInput) nextInput.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                              const prevInput = document.getElementById(`otp-digit-${idx - 1}`);
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
                            if (pasted.length) {
                              const newOtp = ["", "", "", "", "", ""];
                              pasted.split("").forEach((char, i) => {
                                newOtp[i] = char;
                              });
                              setOtpDigits(newOtp);
                            }
                          }}
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-secondary/30 bg-transparent text-text-dark dark:text-text-light focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary transition-all"
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p className="text-xs text-red-500 font-medium text-center">{otpError}</p>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-3 font-semibold"
                      disabled={isLoading || otpDigits.join("").length < 6}
                    >
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>

                    <div className="flex justify-between items-center text-xs text-text-dark/65 dark:text-text-light/70 pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="hover:underline cursor-pointer bg-transparent border-none outline-none font-semibold text-secondary"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={resendTimer > 0 || isLoading}
                        className="hover:underline cursor-pointer bg-transparent border-none outline-none font-semibold text-primary dark:text-accent disabled:opacity-40"
                      >
                        {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : "Resend Code"}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Create New Password Form */}
                {forgotStep === 3 && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                    {/* Hidden input for password manager accessibility */}
                    <input
                      type="email"
                      name="username"
                      id="reset-username-email"
                      value={forgotEmail}
                      onChange={() => { }}
                      autoComplete="username email"
                      style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
                    />

                    <div className="relative text-left">
                      <Input
                        label="New Password"
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setNewPasswordError("");
                        }}
                        error={newPasswordError}
                        required
                      />
                    </div>

                    <div className="relative text-left">
                      <Input
                        label="Confirm New Password"
                        id="confirm-new-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          setNewPasswordError("");
                        }}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-3 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating Password..." : "Set New Password"}
                    </Button>
                  </form>
                )}

                {/* Back to Sign In button */}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForgotStep(1);
                    setOtpDigits(["", "", "", "", "", ""]);
                    setFormError("");
                    setSuccessMessage("");
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-text-dark/65 dark:text-text-light/70 hover:text-text-dark dark:hover:text-text-light cursor-pointer mt-6 py-2 border-none bg-transparent outline-none"
                >
                  <FiArrowLeft /> Back to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageTransition>
  );
};

