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

    const isOnboardingPage = location.pathname === '/app/onboarding';

    // Route guard logic: Protect pages from unauthorized accesses
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

    // Daily morning check-in reminder redirect logic on site entry
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
                }
            }
        }
    }, [isAuthenticated, authLoading, isOnboarded, userProfile, checkins, location.pathname, navigate]);

    const menuItems = [
        { name: 'Dashboard', path: '/app', icon: <FiGrid className="w-5 h-5" /> },
        { name: 'Check-in', path: '/app/checkin', icon: <FiCheckSquare className="w-5 h-5" /> },
        { name: 'Journal', path: '/app/journal', icon: <FiBookOpen className="w-5 h-5" /> },
        { name: 'Wellness', path: '/app/wellness', icon: <FiHeart className="w-5 h-5" /> },
        { name: 'Insights', path: '/app/insights', icon: <FiTrendingUp className="w-5 h-5" /> },
        { name: 'Profile', path: '/app/profile', icon: <FiUser className="w-5 h-5" /> }
    ];

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

    const nameInitials = userProfile.name
        ? userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light flex transition-colors duration-300">
            {/* Sidebar - Desktop */}
            {!isOnboardingPage && (
                <aside className="hidden md:flex flex-col w-64 bg-card-light dark:bg-card-dark border-r border-secondary/15 dark:border-secondary/5 sticky top-0 h-screen transition-all select-none">
                    {/* Branding Brand logo */}
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

                    {/* Profile Card Summary */}
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

                    {/* Nav Menu */}
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

                    {/* Footer and controls */}
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

            {/* Main Content Area */}
            <main className={`flex-grow flex flex-col min-w-0 h-screen overflow-y-auto ${isOnboardingPage ? '' : 'pb-20 md:pb-0'}`}>
                <div className="p-6 md:p-10 max-w-7xl w-full mx-auto flex-grow flex flex-col">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation - Mobile */}
            {!isOnboardingPage && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-md border-t border-secondary/15 dark:border-secondary/5 py-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none">
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
