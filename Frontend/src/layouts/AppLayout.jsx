/**
 * AppLayout Component
 * 
 * What is it?
 * The main authenticated layout shell component for the MindCompass AI application (`/app/*`).
 * 
 * What does it do?
 * 1. Enforces authentication and onboarding route guards:
 *    - Unauthenticated users -> redirected to `/login`.
 *    - Authenticated but non-onboarded users -> redirected to `/app/onboarding`.
 *    - Onboarded users visiting onboarding -> redirected to `/app`.
 * 2. Implements daily check-in auto-reminders: Redirects users to `/app/checkin` on initial entry if today's check-in is pending.
 * 3. Renders the persistent Desktop Sidebar (`w-64`) with branding, user profile card (name initials + streak counter), navigation items, theme toggle, and logout.
 * 4. Renders a fixed Glassmorphic Mobile Bottom Navigation Bar (`md:hidden`) for small viewports.
 * 5. Provides full-screen loading transitions (`PageLoader`) during initial dashboard hydration (`isInitialLoading`).
 * 6. Renders nested page routes via React Router's `<Outlet />`.
 */

import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid,
    FiCheckSquare,
    FiBookOpen,
    FiHeart,
    FiTrendingUp,
    FiUser,
    FiSun,
    FiMoon,
    FiLogOut,
    FiLoader
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { LogoIcon } from '../components/Logo';
import { PageLoader } from '../components/PageLoader';

export const AppLayout = () => {
    const { theme, toggleTheme } = useTheme();
    const { userProfile, streak, isOnboarded, isAuthenticated, authLoading, isInitialLoading, logout, checkins } = useApp();
    const location = useLocation();
    const navigate = useNavigate();

    // Check if the current active route is the onboarding page
    const isOnboardingPage = location.pathname === '/app/onboarding';

    // Route Guard Effect: Protects routes against unauthenticated or non-onboarded accesses
    React.useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/login', { replace: true });
            } else if (!isOnboarded && !isOnboardingPage) {
                navigate('/app/onboarding', { replace: true });
            } else if (isOnboarded && isOnboardingPage) {
                navigate('/app', { replace: true });
            }
        }
    }, [isAuthenticated, authLoading, isOnboarded, isOnboardingPage, navigate]);

    // Daily Check-in Reminder Effect: Redirects users to check-in if not yet completed today
    React.useEffect(() => {
        if (!authLoading && isAuthenticated && isOnboarded) {
            const hasRedirected = sessionStorage.getItem('has_checked_daily_checkin_redirect');
            if (!hasRedirected && userProfile?.notifications?.dailyCheckin !== false) {
                const getUTCDateString = () => new Date().toISOString().split('T')[0];
                const todayStr = getUTCDateString();
                const hasCheckedInToday = checkins && checkins.some(c => c.date === todayStr);

                if (!hasCheckedInToday && location.pathname !== '/app/checkin' && location.pathname !== '/app/onboarding') {
                    sessionStorage.setItem('has_checked_daily_checkin_redirect', 'true');
                    navigate('/app/checkin');
                } else if (hasCheckedInToday || location.pathname === '/app/checkin') {
                    sessionStorage.setItem('has_checked_daily_checkin_redirect', 'true');
                    if (hasCheckedInToday && location.pathname === '/app/checkin') {
                        navigate('/app', { replace: true });
                    }
                }
            }
        }
    }, [isAuthenticated, authLoading, isOnboarded, userProfile, checkins, location.pathname, navigate]);

    // Main navigation menu items configuration
    const menuItems = [
        { name: 'Dashboard', path: '/app', icon: <FiGrid className="w-5 h-5" /> },
        { name: 'Check-in', path: '/app/checkin', icon: <FiCheckSquare className="w-5 h-5" /> },
        { name: 'Journal', path: '/app/journal', icon: <FiBookOpen className="w-5 h-5" /> },
        { name: 'Wellness', path: '/app/wellness', icon: <FiHeart className="w-5 h-5" /> },
        { name: 'Insights', path: '/app/insights', icon: <FiTrendingUp className="w-5 h-5" /> },
        { name: 'Profile', path: '/app/profile', icon: <FiUser className="w-5 h-5" /> }
    ];

    // Handles user logout confirmation and dispatch
    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await logout();
            navigate('/login');
        }
    };

    // Guard rendering if not authenticated after auth loading finishes
    if (!authLoading && !isAuthenticated) {
        return null;
    }

    // Format user name initials for avatar icon
    const nameInitials = userProfile.name
        ? userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="h-full w-full overflow-hidden bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light flex transition-colors duration-300">
            {/* --- DESKTOP SIDEBAR --- */}
            {!isOnboardingPage && (
                <aside className="hidden md:flex flex-col w-64 bg-bg-light dark:bg-bg-dark border-r border-secondary/15 dark:border-secondary/5 h-full transition-all select-none shrink-0">
                    {/* Brand Logo & Title Header */}
                    <div className="p-6 flex items-center gap-3 border-b border-secondary/15 dark:border-secondary/5 h-20">
                        <LogoIcon size={34} className="text-primary dark:text-accent" />
                        <div className="flex flex-col">
                            <span className="text-base font-bold tracking-tight text-primary dark:text-bg-light leading-none">
                                Mind<span className="text-secondary font-medium">Compass</span>
                            </span>
                            <span className="text-[8px] tracking-[0.12em] uppercase text-secondary/75 dark:text-text-light/50 font-semibold leading-none mt-1">
                                Wellness Space
                            </span>
                        </div>
                    </div>

                    {/* User Profile Card Summary & Streak Counter */}
                    <div className="p-6 border-b border-secondary/10 dark:border-secondary/5 bg-secondary/5 dark:bg-secondary/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/25 dark:bg-accent/20 flex items-center justify-center font-bold text-primary dark:text-accent">
                                {nameInitials}
                            </div>
                            <div className="text-left overflow-hidden">
                                <h4 className="text-sm font-semibold truncate leading-tight">{userProfile.name}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-text-dark/60 dark:text-text-light/60 mt-0.5">
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>Streak: {streak} days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="flex-grow p-4 space-y-1.5 pt-6 text-left">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path === '/app' && location.pathname === '/app/');
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 outline-none
                  ${isActive
                                            ? 'bg-primary text-bg-light dark:bg-accent dark:text-bg-dark shadow-sm'
                                            : 'hover:bg-secondary/10 dark:hover:bg-secondary/5 text-text-dark/75 dark:text-text-light/80'
                                        }
                `}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer: Theme Toggle & Logout Controls */}
                    <div className="p-4 border-t border-secondary/15 dark:border-secondary/5 space-y-1.5">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-text-dark/75 dark:text-text-light/80 hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-all text-left outline-none cursor-pointer"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <FiSun className="w-5 h-5 text-accent" />
                                    Light Theme
                                </>
                            ) : (
                                <>
                                    <FiMoon className="w-5 h-5" />
                                    Dark Theme
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all text-left outline-none cursor-pointer"
                        >
                            <FiLogOut className="w-5 h-5" />
                            Log Out
                        </button>
                    </div>
                </aside>
            )}

            {/* --- MOBILE TOP HEADER --- */}
            {!isOnboardingPage && (
                <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-bg-light/95 dark:bg-bg-dark/95 backdrop-blur-md border-b border-secondary/15 dark:border-secondary/5 px-4 flex items-center justify-between shadow-xs select-none">
                    <Link to="/app" className="flex items-center gap-2.5">
                        <LogoIcon size={28} className="text-primary dark:text-accent" />
                        <span className="text-sm font-bold tracking-tight text-primary dark:text-bg-light leading-none">
                            Mind<span className="text-secondary font-medium">Compass</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                            className="p-2.5 rounded-xl bg-secondary/10 dark:bg-secondary/15 text-text-dark/80 dark:text-text-light/90 hover:bg-secondary/20 transition-all cursor-pointer outline-none"
                        >
                            {theme === 'dark' ? (
                                <FiSun className="w-4 h-4 text-accent" />
                            ) : (
                                <FiMoon className="w-4 h-4 text-text-dark" />
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            aria-label="Log out"
                            title="Log Out"
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer outline-none"
                        >
                            <FiLogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>
            )}

            {/* --- MAIN CONTENT AREA: Renders active nested route --- */}
            <main className={`flex-1 min-w-0 h-full overflow-y-auto bg-bg-light dark:bg-bg-dark ${isOnboardingPage ? '' : 'pt-16 md:pt-0'}`}>
                <div className="p-6 md:p-10 pb-16 md:pb-10 max-w-7xl w-full mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
            {!isOnboardingPage && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-light/95 dark:bg-bg-dark/95 backdrop-blur-md border-t border-secondary/15 dark:border-secondary/5 py-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none">
                    <div className="flex justify-around items-center">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path === '/app' && location.pathname === '/app/');
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 outline-none
                      ${isActive
                                            ? 'text-primary dark:text-accent font-semibold scale-102'
                                            : 'text-text-dark/60 dark:text-text-light/50 hover:text-text-dark dark:hover:text-text-light'
                                        }
                    `}
                                >
                                    {item.icon}
                                    <span className="text-[10px] tracking-wide">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* Full-Screen Semi-Transparent Loading Overlay */}
            <AnimatePresence>
                {isInitialLoading && <PageLoader />}
            </AnimatePresence>
        </div>
    );
};

export default AppLayout;

