/**
 * ShareModal Component
 * 
 * What is it?
 * A premium, interactive share popup modal for MindCompass AI.
 * 
 * What does it do?
 * 1. Provides a one-click "Copy Link" input box with animated visual feedback ("Copied!").
 * 2. Supports social share actions (WhatsApp, Twitter/X, LinkedIn, Facebook, Email).
 * 3. Supports Native Web Share API (`navigator.share`) on mobile devices.
 * 4. Animates entry/exit using Framer Motion with backdrop blur and smooth keyboard/click-outside dismiss handlers.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiX, 
    FiCopy, 
    FiCheck, 
    FiShare2, 
    FiMail, 
    FiTwitter, 
    FiLinkedin, 
    FiFacebook,
    FiMessageSquare
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export const ShareModal = ({ isOpen, onClose, shareUrl, title, text }) => {
    const [copied, setCopied] = useState(false);

    const urlToShare = shareUrl || 'https://mind-compass-ai-frontend.onrender.com/';
    const shareTitle = title || 'MindCompass AI - Empowering Your Emotional Wellbeing';
    const shareText = text || 'Discover MindCompass AI: A thoughtful mental wellness companion to track moods, voice journal, and find emotional balance.';

    // Reset copied state on modal open
    useEffect(() => {
        if (isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    // Handle ESC key press to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Copy URL to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(urlToShare);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy share link:', err);
        }
    };

    // Native device web share
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: urlToShare,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Native share error:', err);
                }
            }
        }
    };

    // Quick social share channels
    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: <FaWhatsapp className="w-5 h-5 text-emerald-500" />,
            bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
            href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${urlToShare}`)}`,
        },
        {
            name: 'Twitter / X',
            icon: <FiTwitter className="w-5 h-5 text-sky-500" />,
            bgColor: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400',
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(urlToShare)}`,
        },
        {
            name: 'LinkedIn',
            icon: <FiLinkedin className="w-5 h-5 text-blue-600" />,
            bgColor: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlToShare)}`,
        },
        {
            name: 'Facebook',
            icon: <FiFacebook className="w-5 h-5 text-blue-500" />,
            bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`,
        },
        {
            name: 'Email',
            icon: <FiMail className="w-5 h-5 text-amber-500" />,
            bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400',
            href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${urlToShare}`)}`,
        },
        {
            name: 'Feedback',
            icon: <FiMessageSquare className="w-5 h-5 text-purple-500" />,
            bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400',
            href: `https://mail.google.com/mail/?view=cm&fs=1&to=mindcompassai01@gmail.com&su=${encodeURIComponent('MindCompass AI User Feedback')}&body=${encodeURIComponent('Hi MindCompass AI Team,\n\nI would like to share the following feedback about MindCompass AI:\n\n')}`,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    />

                    {/* Modal Content Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light rounded-3xl p-6 sm:p-8 shadow-2xl border border-secondary/20 dark:border-secondary/10 z-10 overflow-hidden"
                    >
                        {/* Close Icon Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 rounded-full text-text-dark/50 dark:text-text-light/50 hover:text-text-dark dark:hover:text-text-light hover:bg-secondary/15 dark:hover:bg-secondary/10 transition-colors cursor-pointer outline-none"
                            aria-label="Close modal"
                        >
                            <FiX className="w-5 h-5" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-2xl bg-primary/10 dark:bg-accent/15 text-primary dark:text-accent">
                                <FiShare2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight leading-tight">Share MindCompass AI</h3>
                                <p className="text-xs text-text-dark/60 dark:text-text-light/60 mt-0.5">
                                    Spread emotional wellness with friends & family
                                </p>
                            </div>
                        </div>

                        {/* Social Channels Grid */}
                        <div className="my-6">
                            <label className="text-xs font-semibold text-text-dark/50 dark:text-text-light/50 uppercase tracking-wider block mb-3">
                                Share directly to
                            </label>
                            <div className="grid grid-cols-5 gap-2.5">
                                {shareOptions.map((opt) => (
                                    <a
                                        key={opt.name}
                                        href={opt.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 group ${opt.bgColor}`}
                                        title={`Share via ${opt.name}`}
                                    >
                                        <div className="transform transition-transform duration-200 group-hover:scale-110">
                                            {opt.icon}
                                        </div>
                                        <span className="text-[10px] font-medium mt-1.5 truncate max-w-full">
                                            {opt.name.split(' ')[0]}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Native Share Button (if supported) */}
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <button
                                onClick={handleNativeShare}
                                className="w-full mb-4 py-2.5 px-4 rounded-xl border border-secondary/20 dark:border-secondary/10 bg-secondary/5 dark:bg-secondary/5 hover:bg-secondary/15 dark:hover:bg-secondary/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <FiShare2 className="w-4 h-4 text-primary dark:text-accent" />
                                Use device share menu
                            </button>
                        )}

                        {/* Copy Link Input Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-dark/50 dark:text-text-light/50 uppercase tracking-wider block">
                                Or copy link
                            </label>
                            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary/10 dark:bg-secondary/10 border border-secondary/20 dark:border-secondary/10">
                                <input
                                    type="text"
                                    readOnly
                                    value={urlToShare}
                                    className="flex-1 bg-transparent px-3 py-1.5 text-xs font-mono text-text-dark/80 dark:text-text-light/90 outline-none truncate select-all"
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                                        copied
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-primary text-bg-light dark:bg-accent dark:text-bg-dark hover:opacity-90'
                                    }`}
                                >
                                    {copied ? (
                                        <>
                                            <FiCheck className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <FiCopy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
