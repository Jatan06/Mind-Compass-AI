/**
 * Accordion Component
 * 
 * What is it?
 * A reusable, animated collapsible accordion component for displaying expandable lists (e.g. FAQs).
 * 
 * What does it do?
 * 1. Accepts an array of item objects, each containing a `question` (title) and `answer` (content).
 * 2. Maintains state for the currently expanded item (`openIndex`), allowing only one item to be open at a time.
 * 3. Animates the chevron indicator icon rotation (0° to 180°) when toggled.
 * 4. Uses Framer Motion's `AnimatePresence` and `motion.div` for smooth height expansion, collapse, and opacity transitions.
 * 
 * @param {Object[]} items - Array of accordion item objects ({ question: string, answer: string })
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

export const Accordion = ({ items }) => {
    // Tracks the index of the currently open accordion item (null if all are collapsed)
    const [openIndex, setOpenIndex] = useState(null);

    // Toggle open/closed state for a given item index
    const toggleItem = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full space-y-4">
            {items.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <div
                        key={index}
                        className="border border-secondary/15 dark:border-secondary/5 rounded-2xl bg-card-light dark:bg-card-dark overflow-hidden transition-shadow duration-300 hover:shadow-sm"
                    >
                        {/* Accordion Item Header / Toggle Button */}
                        <button
                            onClick={() => toggleItem(index)}
                            className="flex justify-between items-center w-full px-6 py-5 text-left font-medium text-text-dark dark:text-text-light hover:bg-secondary/5 dark:hover:bg-secondary/5 transition-colors focus:outline-none cursor-pointer"
                        >
                            <span className="text-base md:text-lg font-semibold pr-4 text-text-dark dark:text-text-light">{item.question}</span>
                            
                            {/* Animated Chevron Indicator Icon */}
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex-shrink-0 text-secondary"
                            >
                                <FiChevronDown className="w-5 h-5" />
                            </motion.div>
                        </button>

                        {/* Accordion Item Body / Collapsible Answer Container */}
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                    <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-text-dark/70 dark:text-text-light/75 border-t border-secondary/5 pt-3">
                                        {item.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

