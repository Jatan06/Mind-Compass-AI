/**
 * Navbar Component
 * 
 * What is it?
 * The main top navigation header bar component for MindCompass AI.
 * 
 * What does it do?
 * 1. Displays the brand logo and main navigation links (Home, Features, About, FAQ).
 * 2. Monitors window scroll position to apply a sticky glassmorphism backdrop blur on scroll.
 * 3. Provides theme toggling (Light/Dark mode) via ThemeContext.
 * 4. Enables smooth-scroll navigation to in-page anchor sections (#hero, #features, #about, #faq), routing to homepage first if clicked from another route.
 * 5. Displays call-to-action (CTA) buttons for Login and Get Started (Register).
 * 6. Features a fully responsive mobile menu with slide/fade dropdown animations via Framer Motion.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiMenu, FiX, FiArrowRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';

export const Navbar = () => {
    // Access current theme mode (light/dark) and theme toggle handler from context
    const { theme, toggleTheme } = useTheme();

    // Mobile drawer menu state (open/closed)
    const [isOpen, setIsOpen] = useState(false);

    // Track scroll position to change navbar background from transparent to glassmorphic blur
    const [scrolled, setScrolled] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Effect: Listen for window scroll events to trigger glassmorphic styling when scrolled past 10px
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Effect: Automatically close mobile dropdown menu whenever the route location changes
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    /**
     * Handles navigation link clicks.
     * Supports smooth scrolling to section anchors (#hero, #features, etc.).
     * If the user is on a different route (e.g. /login), navigates back to / first before scrolling.
     */
    const handleNavClick = (e, path) => {
        e.preventDefault();
        if (path.startsWith('#')) {
            const targetId = path.replace('#', '');
            if (location.pathname !== '/') {
                navigate(`/#${targetId}`);
                // Let homepage handle scrolling after navigation render
                setTimeout(() => {
                    const el = document.getElementById(targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(path);
        }
        setIsOpen(false);
    };

    // Navigation items pointing to homepage anchor sections
    const navLinks = [
        { name: 'Home', href: '#hero' },
        { name: 'Features', href: '#features' },
        { name: 'About', href: '#about' },
        { name: 'FAQ', href: '#faq' },
    ];

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? 'bg-bg-light/85 dark:bg-bg-dark/85 backdrop-blur-md border-b border-secondary/15 dark:border-secondary/5 py-3.5 shadow-sm'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
                {/* MindCompass Brand Logo */}
                <Logo />

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            onClick={(e) => handleNavClick(e, link.href)}
                            className="text-sm font-medium text-text-dark/80 dark:text-text-light/85 hover:text-primary dark:hover:text-accent transition-colors duration-200"
                        >
                            {link.name}
                        </a>
                    ))}
                </nav>

                {/* Desktop Actions: Dark Mode Toggle, Login, and Registration CTA */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-full text-text-dark/70 dark:text-text-light/75 hover:bg-secondary/15 dark:hover:bg-secondary/5 transition-all duration-200 cursor-pointer"
                        aria-label="Toggle Dark Mode"
                    >
                        {theme === 'dark' ? <FiSun className="w-5 h-5 text-accent" /> : <FiMoon className="w-5 h-5" />}
                    </button>

                    {/* Auth Action Links */}
                    <Link
                        to="/login"
                        className="text-sm font-semibold text-text-dark/95 dark:text-text-light/95 hover:text-primary dark:hover:text-accent px-4 py-2 transition-colors duration-200"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-200 group"
                    >
                        Get Started
                        <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                </div>

                {/* Mobile Header Controls: Theme toggle & Hamburger menu toggle */}
                <div className="flex items-center gap-2 md:hidden">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-text-dark/70 dark:text-text-light/70 hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-all duration-200"
                        aria-label="Toggle Dark Mode"
                    >
                        {theme === 'dark' ? <FiSun className="w-5 h-5 text-accent" /> : <FiMoon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-full text-text-dark/70 dark:text-text-light/70 hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-all duration-200"
                        aria-label="Toggle Menu"
                    >
                        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Animated Dropdown Drawer Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="md:hidden border-t border-secondary/10 dark:border-secondary/5 bg-bg-light dark:bg-bg-dark overflow-hidden shadow-lg"
                    >
                        <div className="flex flex-col gap-4 px-6 py-6">
                            {/* Mobile Navigation Links */}
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={(e) => handleNavClick(e, link.href)}
                                    className="text-base font-medium text-text-dark/80 dark:text-text-light/85 hover:text-primary dark:hover:text-accent transition-colors duration-250 py-1"
                                >
                                    {link.name}
                                </a>
                            ))}

                            <hr className="border-secondary/10 dark:border-secondary/5 my-2" />

                            {/* Mobile Auth Buttons */}
                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/login"
                                    className="text-center font-semibold text-text-dark dark:text-text-light border border-secondary/20 dark:border-secondary/10 hover:bg-secondary/5 rounded-full py-2.5 transition-colors duration-200"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-center font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark rounded-full py-2.5 shadow-sm transition-colors duration-200"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

