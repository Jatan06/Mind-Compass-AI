/**
 * RegisterPage Component
 * 
 * What is it?
 * The user registration and account creation page component for MindCompass AI.
 * 
 * What does it do?
 * 1. Auto-redirects authenticated users (`token`) directly to `/app`.
 * 2. Provides a full account registration form: Username, Email, Password, Password Confirmation, and Terms agreement.
 * 3. Evaluates real-time client-side field validation (length bounds, email regex match, password confirmation matching).
 * 4. Calculates real-time password strength score (1-4: Weak, Fair, Good, Strong) with visual progress meter.
 * 5. Integrates Google OAuth 2.0 social sign-up (`useGoogleLogin`).
 * 6. Displays post-registration instructions asking users to verify their email inbox (`regSuccess === true`), showing the exact destination email address.
 * 7. Offers a "Resend Verification Email" action button triggering `authAPI.resendVerification`.
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import {
  FiUser,
  FiMail,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { PageTransition } from "../components/PageTransition";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";
import { authAPI } from "../services/api";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, googleLogin, token } = useApp();

  // Redirect Effect: Auto-redirect authenticated users directly to /app
  useEffect(() => {
    if (token) {
      navigate("/app", { replace: true });
    }
  }, [token, navigate]);

  // Form Field States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Field Validation & Form Error States
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [formError, setFormError] = useState("");

  // Loading & View Control States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Verification Resend States
  const [resendEmail, setResendEmail] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");

  // Username validation helper (4 to 20 characters)
  const validateUsername = (val) => {
    if (!val) {
      setUsernameError("Username is required");
      return false;
    }
    if (val.length < 4 || val.length > 20) {
      setUsernameError("Username must rest between 4 and 20 characters");
      return false;
    }
    setUsernameError("");
    return true;
  };

  // Email format validation helper
  const validateEmail = (val) => {
    if (!val) {
      setEmailError("Email is required");
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

  // Password minimum length validation helper (8+ characters)
  const validatePassword = (val) => {
    if (!val) {
      setPasswordError("Password is required");
      return false;
    }
    if (val.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Password matching confirmation validation helper
  const validateConfirmPassword = (val, passVal) => {
    if (!val) {
      setConfirmError("Please confirm your password");
      return false;
    }
    if (val !== passVal) {
      setConfirmError("Passwords do not match");
      return false;
    }
    setConfirmError("");
    return true;
  };

  // Calculates password strength rating (0-4: Weak, Fair, Good, Strong)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "Empty", color: "bg-secondary/25" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score: 1, text: "Weak", color: "bg-red-400" };
      case 2:
        return { score: 2, text: "Fair", color: "bg-orange-400" };
      case 3:
        return { score: 3, text: "Good", color: "bg-yellow-500" };
      case 4:
        return { score: 4, text: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 0, text: "Empty", color: "bg-secondary/25" };
    }
  };

  const strengthInfo = getPasswordStrength(password);

  // Handles standard account creation form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setResendSuccess("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    setUsername(cleanUsername);
    setEmail(cleanEmail);

    const isUserValid = validateUsername(cleanUsername);
    const isEmailValid = validateEmail(cleanEmail);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);

    let isTermsValid = true;
    if (!termsChecked) {
      setTermsError("You must agree to the Terms of Service");
      isTermsValid = false;
    } else {
      setTermsError("");
    }

    if (
      isUserValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmValid &&
      isTermsValid
    ) {
      setIsLoading(true);
      try {
        const data = await register(
          cleanUsername,
          cleanEmail,
          password,
          confirmPassword,
        );
        setIsLoading(false);
        if (data.success) {
          setResendEmail(cleanEmail);
          setSuccessMessage(
            data.message || "Registration successful. Please check your email to verify your account.",
          );
          setRegSuccess(true);
        } else {
          setFormError(data.message || "Registration failed.");
        }
      } catch (err) {
        setIsLoading(false);
        if (err.response && err.response.data && err.response.data.errors) {
          const validationErrors = err.response.data.errors;

          if (validationErrors.username)
            setUsernameError(validationErrors.username[0]);
          if (validationErrors.email) setEmailError(validationErrors.email[0]);
          if (validationErrors.password)
            setPasswordError(validationErrors.password[0]);
          if (validationErrors.password_confirm)
            setConfirmError(validationErrors.password_confirm[0]);
          if (validationErrors.non_field_errors) {
            setFormError(validationErrors.non_field_errors[0]);
          } else {
            setFormError("Account validation constraints failed.");
          }
        } else {
          setFormError(err.message || "A network error occurred.");
        }
      }
    }
  };

  // Handles triggering a new verification email link dispatch
  const handleResend = async () => {
    setFormError("");
    setResendSuccess("");
    setIsLoading(true);
    try {
      const response = await authAPI.resendVerification(resendEmail || email);
      setIsLoading(false);
      if (response.data.success) {
        setResendSuccess(
          "Verification link has been resent. Check your inbox!",
        );
      } else {
        setFormError(response.data.message || "Failed to resend verification.");
      }
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        if (validationErrors.email) setFormError(validationErrors.email[0]);
        else
          setFormError(
            err.response.data.message || "Failed to trigger verification.",
          );
      } else {
        setFormError("Failed to communicate with authorization server.");
      }
    }
  };

  // Handles Google OAuth sign-in failure callback
  const handleGoogleError = () => {
    setIsGoogleLoading(false);
    setFormError("Google sign in was cancelled or failed.");
  };

  // Google OAuth sign-in hook handler
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setFormError("");
      try {
        await googleLogin(tokenResponse.access_token);
        setIsGoogleLoading(false);
        navigate("/app");
      } catch (err) {
        setIsGoogleLoading(false);
        if (err.response && err.response.data && err.response.data.message) {
          setFormError(err.response.data.message);
        } else {
          setFormError("Google registration failed.");
        }
      }
    },
    onError: handleGoogleError,
  });

  return (
    <PageTransition>
      <div className="min-h-[85vh] flex flex-col justify-center items-center px-6 py-12 bg-bg-light/65 dark:bg-bg-dark/10 transition-colors duration-300">

        {/* Outer Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-8 md:p-10 shadow-sm"
        >
          <AnimatePresence mode="wait">
            {!regSuccess ? (
              /* --- VIEW 1: REGISTRATION FORM --- */
              <motion.div
                key="register-forms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                    Create Secure Space
                  </h2>
                  <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                    Start mapping your emotional balance path.
                  </p>
                </div>

                {/* Google OAuth Social Registration Button */}
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 border border-secondary/25 dark:border-secondary/10 bg-transparent hover:bg-secondary/5 dark:hover:bg-secondary/5 rounded-full py-3 text-sm font-semibold text-text-dark dark:text-text-light transition-colors duration-200 cursor-pointer disabled:opacity-50"
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
                      Continue with Google
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
                
                {/* Form Error Alert Banner */}
                {formError && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Standard Account Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div className="relative text-left">
                    <Input
                      label="Username"
                      id="username"
                      type="text"
                      placeholder="janedoe1"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (usernameError) validateUsername(e.target.value);
                      }}
                      error={usernameError}
                      required
                    />
                    <div className="absolute right-4 top-10.5 text-secondary/60">
                      <FiUser className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="relative text-left">
                    <Input
                      label="Email Address"
                      id="email"
                      type="email"
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

                  {/* Password Field */}
                  <div className="relative text-left">
                    <Input
                      label="Password"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                        if (confirmPassword && confirmError)
                          validateConfirmPassword(
                            confirmPassword,
                            e.target.value,
                          );
                      }}
                      error={passwordError}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-10.5 text-secondary/60 hover:text-secondary focus:outline-none"
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Visual Password Strength Progress Bar */}
                  {password && (
                    <div className="space-y-1.5 px-1 pt-1 text-left">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-dark/60 dark:text-text-light/65">
                          Password Strength:
                        </span>
                        <span className="font-semibold text-text-dark dark:text-text-light">
                          {strengthInfo.text}
                        </span>
                      </div>
                      <div className="w-full bg-secondary/15 dark:bg-card-dark rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${strengthInfo.color} transition-all duration-300`}
                          style={{
                            width: `${(strengthInfo.score / 4) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Confirm Password Field */}
                  <div className="relative text-left">
                    <Input
                      label="Confirm Password"
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmError)
                          validateConfirmPassword(e.target.value, password);
                      }}
                      error={confirmError}
                      required
                    />
                  </div>

                  {/* Terms of Service Consent Checkbox */}
                  <div className="pt-2 text-left">
                    <label className="flex items-start gap-2.5 text-xs sm:text-sm text-text-dark/70 dark:text-text-light/75 cursor-pointer leading-tight">
                      <input
                        type="checkbox"
                        checked={termsChecked}
                        onChange={(e) => {
                          setTermsChecked(e.target.checked);
                          if (e.target.checked) setTermsError("");
                        }}
                        className="rounded border-secondary/35 text-primary focus:ring-primary/45 w-4.5 h-4.5 bg-transparent cursor-pointer mt-0.5"
                      />
                      <span>
                        I accept the{" "}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("Terms of Service summary...");
                          }}
                          className="font-semibold text-secondary hover:text-primary dark:hover:text-accent underline"
                        >
                          Terms of Service
                        </a>{" "}
                        and consent to secure encryptions.
                      </span>
                    </label>
                    {termsError && (
                      <div className="text-xs text-red-500 font-medium ml-7 mt-1.5 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span>{termsError}</span>
                      </div>
                    )}
                  </div>

                  {/* Submit Account Creation Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? "Creating Space..." : "Create Account"}
                  </Button>
                </form>

                {/* Redirect Link to Login Page */}
                <p className="text-center text-sm text-text-dark/70 dark:text-text-light/75 mt-8">
                  Already have a space?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-secondary hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </motion.div>
            ) : (
              /* 
                --- VIEW 2: POST-REGISTRATION VERIFICATION INSTRUCTIONS --- 
                Displayed immediately after successful account creation.
                Instructs the user to open their email inbox, find the MindCompass verification email,
                and click the unique link to verify their account.
              */
              <motion.div
                key="verify-instruct-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-center space-y-6"
              >
                {/* Success Icon Badge */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 border border-emerald-200 dark:border-emerald-800">
                    <FiCheckCircle className="w-8 h-8" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                    Check Your Email
                  </h2>
                  <p className="text-sm text-text-dark/70 dark:text-text-light/75 mt-2 px-1">
                    We sent an official verification email to{" "}
                    <span className="font-bold text-primary dark:text-accent underline">
                      {resendEmail || email}
                    </span>
                  </p>
                  <p className="text-xs text-text-dark/60 dark:text-text-light/60 mt-3 bg-secondary/10 p-3 rounded-xl">
                    Open your email inbox and click the <strong>Verify Email Address</strong> button inside to confirm your account.
                  </p>
                </div>

                {/* Form / API Error Banner */}
                {formError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm text-left">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Resend Link Success Banner */}
                {resendSuccess && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm text-left">
                    <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {/* Resend Verification Action & Sign In Navigation */}
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-text-dark/50 dark:text-text-light/50">
                    Didn't receive the email? Check your spam folder or request a new link:
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full text-xs py-2.5"
                    onClick={handleResend}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Sending Link..."
                      : "Resend Verification Email"}
                  </Button>

                  <Link
                    to="/login"
                    className="inline-block text-xs font-bold text-secondary hover:text-primary dark:hover:text-accent transition-colors pt-2"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageTransition>
  );
};
