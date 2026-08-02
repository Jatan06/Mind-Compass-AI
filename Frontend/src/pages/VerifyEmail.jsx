import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader, FiAlertCircle, FiMail } from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { authAPI } from '../services/api';

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    // Resend verification state
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');
    const [resendError, setResendError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const executeVerification = async () => {
            if (!token) {
                setStatus('error');
                setErrorMessage('No verification token was provided. Please check the URL link.');
                return;
            }

            try {
                const response = await authAPI.verifyEmail(token);
                if (response.data.success) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMessage(response.data.message || 'Verifications failed.');
                }
            } catch (err) {
                setStatus('error');
                if (err.response && err.response.data && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    if (validationErrors.token) {
                        setErrorMessage(validationErrors.token[0]);
                    } else if (validationErrors.non_field_errors) {
                        setErrorMessage(validationErrors.non_field_errors[0]);
                    } else {
                        setErrorMessage('Verification failed.');
                    }
                } else {
                    setErrorMessage(err.message || 'An unexpected connection failure occurred.');
                }
            }
        };

        executeVerification();
    }, [token]);

    const handleResend = async (e) => {
        e.preventDefault();
        setResendError('');
        setResendSuccess('');
        setEmailError('');

        if (!email) {
            setEmailError('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authAPI.resendVerification(email);
            setIsLoading(false);
            if (response.data.success) {
                setResendSuccess('Verification link has been sent. Check your inbox!');
                setEmail('');
            } else {
                setResendError(response.data.message || 'Failed to resend link.');
            }
        } catch (err) {
            setIsLoading(false);
            if (err.response && err.response.data && err.response.data.errors) {
                const validationErrors = err.response.data.errors;
                if (validationErrors.email) {
                    setEmailError(validationErrors.email[0]);
                } else if (validationErrors.non_field_errors) {
                    setResendError(validationErrors.non_field_errors[0]);
                } else {
                    setResendError('Request failed.');
                }
            } else {
                setResendError(err.message || 'A network error occurred.');
            }
        }
    };

    return (
        <PageTransition>
            <div className="min-h-[85vh] flex flex-col justify-center items-center px-6 py-12 bg-bg-light/65 dark:bg-bg-dark/10 transition-colors duration-300">
                <div className="mb-8">
                    <Logo showText={true} size={42} />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-8 md:p-10 shadow-sm text-center"
                >
                    {status === 'verifying' && (
                        <div className="space-y-6 py-4">
                            <div className="flex justify-center">
                                <FiLoader className="w-12 h-12 text-primary animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                                    Verifying Your Email
                                </h2>
                                <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                                    Just a moment while we validate your secure token...
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6 py-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 border border-emerald-200 dark:border-emerald-800">
                                    <FiCheckCircle className="w-8 h-8" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                                    Email Confirmed
                                </h2>
                                <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                                    Thank you! Your email is verified and secure.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link to="/login">
                                    <Button variant="primary" className="w-full py-3">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500 border border-red-200 dark:border-red-800">
                                    <FiXCircle className="w-8 h-8" />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                                    Verification Failed
                                </h2>
                                <p className="text-sm text-red-500 font-semibold mt-2">
                                    {errorMessage}
                                </p>
                            </div>

                            <hr className="border-secondary/15 dark:border-secondary/5" />

                            {/* Resend utility */}
                            <form onSubmit={handleResend} className="space-y-4 text-left">
                                <h4 className="text-sm font-bold text-text-dark dark:text-text-light text-center">
                                    Request another verification link?
                                </h4>

                                {resendError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-2.5 text-red-650 dark:text-red-400 text-xs">
                                        <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{resendError}</span>
                                    </div>
                                )}

                                {resendSuccess && (
                                    <div className="p-3 bg-emerald-52/10 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 rounded-xl flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
                                        <FiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{resendSuccess}</span>
                                    </div>
                                )}

                                <div className="relative">
                                    <Input
                                        label="Email Address"
                                        id="resend-email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={emailError}
                                        required
                                    />
                                    <div className="absolute right-4 top-10.5 text-secondary/60">
                                        <FiMail className="w-5 h-5" />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="secondary"
                                    className="w-full py-2.5 text-xs"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending Link...' : 'Resend Link'}
                                </Button>
                            </form>

                            <div className="pt-2">
                                <Link
                                    to="/login"
                                    className="text-xs font-bold text-secondary hover:text-primary dark:hover:text-accent transition-colors"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </PageTransition>
    );
};
export default VerifyEmail;
