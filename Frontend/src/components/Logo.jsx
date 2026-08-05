/**
 * Logo Components (LogoIcon & Logo)
 * 
 * What is it?
 * The core visual brand logo and icon components for MindCompass AI.
 * 
 * What does it do?
 * 1. `LogoIcon`: Renders a standalone scalable SVG compass graphic combining an outer ring, dashed inner ring, directional ticks (N, S, E, W), and an organic leaf compass needle.
 * 2. `Logo`: Wraps `LogoIcon` in a React Router `<Link to="/">` with optional brand typography ("MindCompass Wellness") and smooth 45-degree hover rotation.
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LogoIcon Component
 * Scalable SVG vector icon depicting the MindCompass leaf-needle emblem.
 * 
 * @param {number} size - Width and height dimensions in pixels (default 40)
 * @param {string} className - Additional CSS utility classes
 */
export const LogoIcon = ({ size = 40, className = "" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`select-none ${className}`}
        >
            {/* Outer compass ring */}
            <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="5"
                className="text-secondary/40 dark:text-secondary/20"
            />

            {/* Dynamic dashed inner compass ring */}
            <circle
                cx="50"
                cy="50"
                r="34"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="text-secondary/60 dark:text-secondary/40"
            />

            {/* Compass Directions Ticks (N, S, E, W) */}
            <line x1="50" y1="12" x2="50" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary dark:text-accent" />
            <line x1="50" y1="82" x2="50" y2="88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-secondary/70 dark:text-secondary/40" />
            <line x1="82" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-secondary/70 dark:text-secondary/40" />
            <line x1="12" y1="50" x2="18" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-secondary/70 dark:text-secondary/40" />

            {/* Organic leaf body functioning as the main compass needle */}
            <path
                d="M33 67 C 35 50, 48 37, 67 33 C 65 50, 52 63, 33 67 Z"
                fill="currentColor"
                className="text-primary dark:text-accent opacity-90 dark:opacity-100"
            />

            {/* Shaded side of the leaf needle providing visual depth */}
            <path
                d="M33 67 C 46 62, 57 53, 67 33 Z"
                fill="currentColor"
                className="text-primary-hover dark:text-accent/80 opacity-20"
            />

            {/* Central leaf vein / compass needle spine */}
            <path
                d="M33 67 C 45 55, 55 45, 67 33"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-bg-light dark:text-bg-dark"
            />

            {/* Center pivot point & tip accent dots */}
            <circle cx="50" cy="50" r="3" fill="currentColor" className="text-bg-light dark:text-bg-dark" />
            <circle cx="67" cy="33" r="2.5" fill="currentColor" className="text-secondary dark:text-secondary" />
        </svg>
    );
};

/**
 * Logo Component
 * Clickable brand header logo link with optional text typography.
 * 
 * @param {string} className - Container CSS class names
 * @param {boolean} showText - Whether to render brand title text next to the icon (default true)
 * @param {number} size - LogoIcon size dimensions in pixels (default 38)
 */
export const Logo = ({ className = "", showText = true, size = 38 }) => {
    return (
        <Link to="/" className={`flex items-center gap-3 group focus:outline-none ${className}`}>
            {/* Logo Icon with smooth 45-degree hover rotation effect */}
            <LogoIcon size={size} className="transform transition-transform duration-500 group-hover:rotate-45" />
            
            {/* Brand Title & Subtitle Typography */}
            {showText && (
                <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight text-primary dark:text-bg-light leading-none">
                        Mind<span className="text-secondary font-medium">Compass</span>
                    </span>
                    <span className="text-[9px] tracking-[0.12em] uppercase text-secondary/80 dark:text-secondary/60 font-semibold leading-none mt-1">
                        Wellness
                    </span>
                </div>
            )}
        </Link>
    );
};

export default Logo;

