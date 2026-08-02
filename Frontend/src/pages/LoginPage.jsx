import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { useApp } from '../context/AppContext';
import { authAPI } from '../services/api';

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, googleLogin } = useApp();

    const [mode, setMode] = useState('login'); // 'login' or 'forgot'

    // Login form fields
    const [loginCredential, setLoginCredential] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot form fields
    const [forgotEmail, setForgotEmail] = useState('');

    // Error states
    const [credentialError, setCredentialError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [forgotEmailError, setForgotEmailError] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    React.useEffect(() => {
        if (location.state?.googleSuccessMessage) {
            setSuccessMessage(location.state.googleSuccessMessage);
        }
    }, [location.state]);

    const validateCredential = (val) => {
        if (!val) {
            setCredentialError('Username or email is required');
            return false;
        }
        setCredentialError('');
        return true;
    };

    const validatePassword = (val) => {
        if (!val) {
            setPasswordError('Password is required');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const validateForgotEmail = (val) => {
        if (!val) {
            setForgotEmailError('Email is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            setForgotEmailError('Please enter a valid email address');
            return false;
        }
        setForgotEmailError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        const isCredValid = validateCredential(loginCredential);
        const isPasswordValid = validatePassword(password);

        if (isCredValid && isPasswordValid) {
            setIsLoading(true);
            try {
                // login handles caching context token
                await login(loginCredential, password);
                setIsLoading(false);
                navigate('/app');
            } catch (err) {
                setIsLoading(false);
                if (err.response && err.response.data && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;

                    if (validationErrors.username) setCredentialError(validationErrors.username[0]);
                    if (validationErrors.email) setCredentialError(validationErrors.email[0]);
                    if (validationErrors.password) setPasswordError(validationErrors.password[0]);
                    if (validationErrors.non_field_errors) {
                        setFormError(validationErrors.non_field_errors[0]);
                    } else {
                        setFormError('Authentication failed. Please verify credentials.');
                    }
                } else {
                    setFormError(err.message || 'An network connection issue occurred.');
                }
            }
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        if (validateForgotEmail(forgotEmail)) {
            setIsLoading(true);
            try {
                const response = await authAPI.forgotPassword(forgotEmail);
                setIsLoading(false);
                if (response.data.success) {
                    setSuccessMessage(response.data.message || 'Reset link dispatched.');
                    setForgotEmail('');
                } else {
                    setFormError(response.data.message || 'Validation request failed.');
                }
            } catch (err) {
                setIsLoading(false);
                if (err.response && err.response.data && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    if (validationErrors.email) setForgotEmailError(validationErrors.email[0]);
                    if (validationErrors.non_field_errors) {
                        setFormError(validationErrors.non_field_errors[0]);
                    } else {
                        setFormError('Request failed.');
                    }
                } else {
                    setFormError(err.message || 'An error occurred.');
                }
            }
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setFormError('');
        setSuccessMessage('');
        try {
            // For testing and mock verification, pass a mock oauth token
            const mockGoogleToken = `mock-google-token-${Date.now()}`;
            await googleLogin(mockGoogleToken, 'jane.doe@example.com', 'Jane Doe');
            setIsGoogleLoading(false);
            navigate('/app');
        } catch (err) {
            setIsGoogleLoading(false);
            if (err.response && err.response.data && err.response.data.message) {
                setFormError(err.response.data.message);
            } else {
                setFormError('Google sign in failed.');
            }
        }
    };

    return (
        <PageTransition>
            <div className="min-h-[85vh] flex flex-col justify-center items-center px-6 py-12 bg-bg-light/65 dark:bg-bg-dark/10 transition-colors duration-300">

                {/* Navigation Logo */}
                <div className="mb-8">
                    <Logo showText={true} size={42} />
                </div>

                {/* Login/Recovery Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-8 md:p-10 shadow-sm"
                >
                    <AnimatePresence mode="wait">
                        {mode === 'login' ? (
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

                                {formError && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                                        <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="mb-6 p-4 bg-emerald-55/15 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
                                        <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email/Username Field */}
                                    <div className="relative text-left">
                                        <Input
                                            label="Username or Email"
                                            id="credentials"
                                            type="text"
                                            placeholder="username or name@example.com"
                                            value={loginCredential}
                                            onChange={(e) => {
                                                setLoginCredential(e.target.value);
                                                if (credentialError) validateCredential(e.target.value);
                                            }}
                                            onBlur={() => validateCredential(loginCredential)}
                                            error={credentialError}
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
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) validatePassword(e.target.value);
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

                                    {/* Remember Me & Forget Pass */}
                                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                                        <label className="flex items-center gap-2 text-text-dark/70 dark:text-text-light/75 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="rounded border-secondary/35 text-primary focus:ring-primary/45 w-4 h-4 bg-transparent cursor-pointer"
                                            />
                                            Remember me
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode('forgot');
                                                setFormError('');
                                                setSuccessMessage('');
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
                                        {isLoading ? 'Signing In...' : 'Sign In'}
                                    </Button>
                                </form>

                                {/* Divider */}
                                <div className="relative my-8 text-center">
                                    <hr className="border-secondary/15 dark:border-secondary/5" />
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-light dark:bg-card-dark px-3 text-xs uppercase tracking-wider text-text-dark/45 dark:text-text-light/50">
                                        or continue with
                                    </span>
                                </div>

                                {/* Social Auth */}
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading || isGoogleLoading}
                                    className="w-full flex items-center justify-center gap-3 border border-secondary/25 dark:border-secondary/10 bg-transparent hover:bg-secondary/5 dark:hover:bg-secondary/5 rounded-full py-3 text-sm font-semibold text-text-dark dark:text-text-light transition-colors duration-205 cursor-pointer disabled:opacity-50"
                                >
                                    {isGoogleLoading ? (
                                        <span className="text-secondary/70">Connecting...</span>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                            </svg>
                                            Sign in with Google
                                        </>
                                    )}
                                </button>

                                {/* Redirect to Register */}
                                <p className="text-center text-sm text-text-dark/70 dark:text-text-light/75 mt-8">
                                    Don't have a secure account?{' '}
                                    <Link
                                        to="/register"
                                        className="font-bold text-secondary hover:text-primary dark:hover:text-accent transition-colors"
                                    >
                                        Get Started
                                    </Link>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="forgot-password-card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                                        Recover Password
                                    </h2>
                                    <p className="text-sm text-text-dark/60 dark:text-text-light/65 mt-2">
                                        Enter your email below to receive reset instructions.
                                    </p>
                                </div>

                                {formError && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                                        <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="mb-6 p-4 bg-emerald-55/15 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
                                        <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                                    {/* Email Field */}
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
                                            onBlur={() => validateForgotEmail(forgotEmail)}
                                            error={forgotEmailError}
                                            required
                                        />
                                        <div className="absolute right-4 top-10.5 text-secondary/60">
                                            <FiMail className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full py-3"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Sending Link...' : 'Send Recovery Link'}
                                    </Button>

                                    {/* Back to login trigger */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('login');
                                            setFormError('');
                                            setSuccessMessage('');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-text-dark/65 dark:text-text-light/70 hover:text-text-dark dark:hover:text-text-light cursor-pointer mt-4 py-2 border-none bg-transparent outline-none"
                                    >
                                        <FiArrowLeft /> Back to Sign In
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </PageTransition>
    );
};
