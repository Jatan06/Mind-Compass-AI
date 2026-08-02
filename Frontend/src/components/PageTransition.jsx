import React from 'react';
import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => {
    return (
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
