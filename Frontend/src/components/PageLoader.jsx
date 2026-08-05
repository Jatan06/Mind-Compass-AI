/**
 * PageLoader Component
 * 
 * What is it?
 * A full-screen, backdrop-blurred loading overlay component for MindCompass AI.
 * 
 * What does it do?
 * 1. Covers the entire viewport with a fixed glassmorphic backdrop (`backdrop-blur-md`).
 * 2. Displays a rapidly spinning `LogoIcon` compass emblem (360° rotation every 0.3s) placed over a soft ambient radial glow.
 * 3. Shows a customizable status title message (`message` prop) and subtitle.
 * 4. Fades smoothly in and out during route transitions or data synchronization (`AnimatePresence` compatible).
 * 
 * @param {string} message - Custom loading headline text (default: 'Syncing your wellness space…')
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from './Logo';

export const PageLoader = ({ message = 'Syncing your wellness space…' }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-md p-6 text-center select-none"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-5 max-w-sm"
            >
                {/* Centered Compass Emblem Container */}
                <div className="relative flex items-center justify-center">
                    {/* Soft ambient pulse glow behind compass emblem */}
                    <div className="absolute -inset-4 rounded-full bg-primary/15 dark:bg-accent/20 blur-2xl animate-pulse" />

                    {/* Fast Continuous Spin Animation: 360 degrees per 0.3 seconds */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="relative z-10"
                    >
                        <LogoIcon size={68} className="text-primary dark:text-accent drop-shadow-sm" />
                    </motion.div>
                </div>

                {/* Loading Status Headline & Subtitle */}
                <div className="space-y-1 mt-2">
                    <p className="text-base font-bold text-text-dark dark:text-text-light tracking-wide">
                        {message}
                    </p>
                    <p className="text-xs font-medium text-text-dark/50 dark:text-text-light/45">
                        Fetching your latest data from MindCompass…
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PageLoader;

