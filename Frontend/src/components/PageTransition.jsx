/**
 * PageTransition Component
 * 
 * What is it?
 * A wrapper component that provides animated entrance and exit transitions for top-level pages.
 * 
 * What does it do?
 * 1. Wraps route view components with a Framer Motion `motion.div`.
 * 2. Applies smooth entrance animations (fades in from opacity 0 to 1 while sliding up from y: 15px to 0px).
 * 3. Handles exit animations (fades out while drifting up to y: -15px).
 * 4. Uses a custom cubic-bezier easing curve ([0.25, 1, 0.5, 1]) over 0.4s for a subtle, fluid UI experience.
 * 
 * @param {React.ReactNode} children - The page content to be wrapped and animated
 */

import React from 'react';
import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => {
    return (
        /* Animated page container with entry/exit animations and custom cubic-bezier easing */
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="flex-grow flex flex-col w-full"
        >
            {children}
        </motion.div>
    );
};

