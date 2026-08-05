/**
 * App Component
 * 
 * What is it?
 * The root React application component and client-side router tree for MindCompass AI.
 * 
 * What does it do?
 * 1. Wraps the whole component hierarchy in global `AppProvider` state context.
 * 2. Initializes `BrowserRouter` with `ScrollToTop` helper to reset scroll position on route transitions.
 * 3. Defines 3 primary routing groups:
 *    - Public Marketing & Auth Layout (`Layout`): Navbar + Footer shell containing Landing Page (`/`), Login (`/login`), Register (`/register`), Verify Email (`/verify-email`), and Reset Password (`/reset-password`).
 *    - Authenticated Workspace Layout (`AppLayout`): Sidebar + Mobile Bottom Nav shell containing Dashboard (`/app`), Onboarding (`/app/onboarding`), Daily Check-in (`/app/checkin`), Journal (`/app/journal`), Wellness (`/app/wellness`), Insights (`/app/insights`), and Profile (`/app/profile`).
 *    - Standalone 404 Fallback (`*`): Renders `NotFoundPage` directly.
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { DailyCheckIn } from './pages/DailyCheckIn';
import { Journal } from './pages/Journal';
import { Wellness } from './pages/Wellness';
import { Insights } from './pages/Insights';
import { Profile } from './pages/Profile';
import { OnboardingAssessment } from './pages/OnboardingAssessment';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppProvider } from './context/AppContext';

/**
 * ScrollToTop Component
 * Resets window scroll position to (0,0) whenever the route pathname changes.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

/**
 * Public Layout Component
 * Standard layout wrapper containing sticky Navbar and Footer for public landing and auth pages.
 */
const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light transition-colors duration-300">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

/**
 * Root App Component
 */
function App() {
    return (
        <AppProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* 1. PUBLIC MARKETING & AUTHENTICATION ROUTES (Navbar + Footer) */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<LandingPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                        <Route path="verify-email" element={<VerifyEmail />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                    </Route>

                    {/* 2. PROTECTED WORKSPACE ROUTES (AppLayout Sidebar + Mobile Nav) */}
                    <Route path="/app" element={<AppLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="onboarding" element={<OnboardingAssessment />} />
                        <Route path="checkin" element={<DailyCheckIn />} />
                        <Route path="journal" element={<Journal />} />
                        <Route path="wellness" element={<Wellness />} />
                        <Route path="insights" element={<Insights />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    {/* 3. STANDALONE 404 FALLBACK ROUTE */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </AppProvider>
    );
}

export default App;


