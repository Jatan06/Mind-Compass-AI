/**
 * ResetPassword Component
 * 
 * What is it?
 * The password reset verification page component for MindCompass AI.
 * 
 * What does it do?
 * 1. Extracts the secret password reset token from the URL query parameters (`?token=...`).
 * 2. Provides form fields for entering and confirming a new secure password.
 * 3. Evaluates real-time client-side validation (8+ characters minimum, password match confirmation).
 * 4. Submits token and new password credentials to `authAPI.resetPassword`.
 * 5. On successful update, displays a success notification banner and auto-redirects the user to `/login` after 3 seconds.
 */

import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { authAPI } from '../services/api';

export const ResetPassword = () => {
    const navigate = useNavigate();
    
    // Extract reset token from URL query parameters (?token=...)
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    // Input & Visibility States
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Validation & Response Alert States
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Minimum password length validation helper (8+ chars)
    const validatePassword = (val) => {
        if (!val) {
            setPasswordError('New password is required');
            return false;
        }
        if (val.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    // Password confirmation matching validation helper
    const validateConfirmPassword = (val, passVal) => {
        if (!val) {
            setConfirmError('Please confirm your password');
            return false;
        }
        if (val !== passVal) {
            setConfirmError('Passwords do not match');
            return false;
        }
        setConfirmError('');
        return true;
    };

    // Handles submitting password reset request to backend API
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        const isPasswordValid = validatePassword(password);
        const isConfirmValid = validateConfirmPassword(confirmPassword, password);

        // Guard against missing URL token
        if (!token) {
            setFormError('Reset token is missing. Please close this page and navigate from your email link again.');
            return;
        }

        if (isPasswordValid && isConfirmValid) {
            setIsLoading(true);
            try {
                const response = await authAPI.resetPassword({
                    token,
                    password,
                    password_confirm: confirmPassword
                });
                setIsLoading(false);

                if (response.data.success) {
                    setSuccessMessage(response.data.message || 'Password updated successfully!');
                    // Auto-redirect user to sign-in page after 3-second delay
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setFormError(response.data.message || 'Reset failed.');
                }
            } catch (err) {
                setIsLoading(false);
                if (err.response && err.response.data && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    if (validationErrors.password) setPasswordError(validationErrors.password[0]);
                    if (validationErrors.password_confirm) setConfirmError(validationErrors.password_confirm[0]);
                    if (validationErrors.token) setFormError(validationErrors.token[0]);
                    if (validationErrors.non_field_errors) {
                        setFormError(validationErrors.non_field_errors[0]);
                    } else {
                        setFormError('Account constraints validation failed.');
                    }
                } else {
                    setFormError(err.message || 'An unexpected connection error occurred.');
                }
            }
        }
    };

    return (
        <PageTransition>
            <div className="min-h-[85vh] flex flex-col justify-center items-center px-6 py-12 bg-bg-light/65 dark:bg-bg-dark/10 transition-colors duration-300">
                {/* Brand Logo Header */}
                <div className="mb-8">
                    <Logo showText={true} size={42} />
                </div>

                {/* Reset Password Form Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-8 md:p-10 shadow-sm"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                            Reset Password
                        </h2>
                        <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                            Type in your new secure authentication credentials.
                        </p>
                    </div>

                    {/* Error Alert Banner */}
                    {formError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-650 dark:text-red-400 text-sm">
                            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Success Confirmation Banner */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
                            <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block">{successMessage}</span>
                                <span className="text-xs text-text-dark/55 dark:text-text-light/60 mt-1 block">
                                    Redirecting to sign-in page shortly...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* New Password Form */}
                    {!successMessage && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* New Password Input */}
                            <div className="relative text-left">
                                <Input
                                    label="New Password"
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) validatePassword(e.target.value);
                                        if (confirmPassword) validateConfirmPassword(confirmPassword, e.target.value);
                                    }}
                                    onBlur={() => validatePassword(password)}
                                    error={passwordError}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-10.5 text-secondary/60 hover:text-text-dark dark:hover:text-text-light focus:outline-none cursor-pointer"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Confirm New Password Input */}
                            <div className="relative text-left">
                                <Input
                                    label="Confirm New Password"
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (confirmError) validateConfirmPassword(e.target.value, password);
                                    }}
                                    onBlur={() => validateConfirmPassword(confirmPassword, password)}
                                    error={confirmError}
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-3"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FiLoader className="animate-spin" /> Verifying...
                                    </span>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Back to Sign In Link */}
                    <div className="text-center mt-6">
                        <Link
                            to="/login"
                            className="text-xs font-bold text-secondary hover:text-primary dark:hover:text-accent transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
};

export default ResetPassword;

