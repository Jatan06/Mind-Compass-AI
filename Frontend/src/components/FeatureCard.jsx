/**
 * FeatureCard Component
 * 
 * What is it?
 * A reusable card UI component designed to highlight individual platform features on the landing page.
 * 
 * What does it do?
 * 1. Accepts a feature `title`, `description`, and `icon` element.
 * 2. Uses Framer Motion's `whileHover` to apply smooth vertical elevation (-6px upward lift) on hover.
 * 3. Features a dynamic icon container that shifts background and text colors on hover (`group-hover`).
 * 4. Supports light and dark color themes via Tailwind CSS utility classes.
 * 
 * @param {string} title - The title/heading of the feature
 * @param {string} description - Summary explanation of what the feature provides
 * @param {React.ReactNode} icon - Icon component representing the feature (e.g. React-Icons element)
 */

import React from 'react';
import { motion } from 'framer-motion';

export const FeatureCard = ({ title, description, icon }) => {
    return (
        /* Card Container with Framer Motion hover elevation (-6px lift) */
        <motion.div
            whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="p-6 md:p-8 rounded-3xl bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col text-left group"
        >
            {/* Feature Icon Badge Container */}
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 dark:bg-secondary/10 flex items-center justify-center text-primary dark:text-accent mb-6 transition-all duration-300 group-hover:bg-primary group-hover:text-bg-light dark:group-hover:bg-accent dark:group-hover:text-bg-dark">
                {icon}
            </div>

            {/* Feature Title */}
            <h3 className="text-lg md:text-xl font-semibold mb-3 text-text-dark dark:text-text-light group-hover:text-primary dark:group-hover:text-accent transition-colors duration-300">
                {title}
            </h3>

            {/* Feature Description Paragraph */}
            <p className="text-sm md:text-base text-text-dark/70 dark:text-text-light/75 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
};

