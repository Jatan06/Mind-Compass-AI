import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCompass, FiHome, FiArrowLeft } from 'react-icons/fi';

export const NotFoundPage = () => {
    return (
        <div className="min-h-screen w-full bg-bg-light dark:bg-bg-dark flex items-center justify-center px-6 py-16 text-center">
            <div className="max-w-md mx-auto">

                {/* Animated Floating Compass Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center rounded-3xl bg-primary/10 dark:bg-accent/10 border border-primary/20 dark:border-accent/20"
                >
                    <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    >
                        <FiCompass className="w-14 h-14 text-primary dark:text-accent" />
                    </motion.div>
                    <span className="absolute -top-2 -right-2 px-3 py-0.5 text-xs font-extrabold bg-primary text-bg-light dark:bg-accent dark:text-bg-dark rounded-full shadow-md">
                        404
                    </span>
                </motion.div>

                {/* Heading & Subtitle */}
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-4xl font-extrabold text-primary dark:text-bg-light tracking-tight mb-3"
                >
                    Page Not Found
                </motion.h1>

                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-base text-text-dark/70 dark:text-text-light/70 mb-8 leading-relaxed"
                >
                    Looks like your compass lost its bearings! The page or route you are looking for doesn't exist or has moved.
                </motion.p>

                {/* Action Buttons */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold bg-primary text-bg-light dark:bg-accent dark:text-bg-dark shadow-lg shadow-primary/20 dark:shadow-accent/20 hover:opacity-95 transition-all duration-200"
                    >
                        <FiHome className="w-4 h-4" />
                        Go to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold border border-secondary/20 dark:border-secondary/10 hover:bg-secondary/10 transition-all duration-200 text-text-dark dark:text-text-light"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFoundPage;
